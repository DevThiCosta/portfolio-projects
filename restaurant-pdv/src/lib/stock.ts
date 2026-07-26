import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export class InsufficientStockError extends Error {}

type DbClient = Prisma.TransactionClient | typeof prisma;

export type Availability = {
  /** false = venda livre, não rastreado */
  tracked: boolean;
  /** null quando !tracked */
  quantity: number | null;
};

type ProductWithRecipe = {
  stock: number | null;
  ingredients: { quantityPerUnit: Prisma.Decimal | number; insumo: { stock: Prisma.Decimal | number } }[];
};

/** Versão pura, sem consulta ao banco — usada quando o produto já foi carregado (ex: listagens). */
export function computeAvailability(product: ProductWithRecipe): Availability {
  if (product.ingredients.length > 0) {
    let min = Infinity;
    for (const ing of product.ingredients) {
      const perUnit = Number(ing.quantityPerUnit);
      if (perUnit <= 0) continue;
      min = Math.min(min, Math.floor(Number(ing.insumo.stock) / perUnit));
    }
    return { tracked: true, quantity: Number.isFinite(min) ? Math.max(0, min) : 0 };
  }
  if (product.stock === null) {
    return { tracked: false, quantity: null };
  }
  return { tracked: true, quantity: product.stock };
}

/**
 * Quantas unidades de um produto ainda podem ser vendidas agora.
 * Produto composto (tem `ingredients`, ou seja, uma receita): disponibilidade
 * é o mínimo entre `insumo.stock / quantityPerUnit` de cada ingrediente.
 * Produto simples: usa `product.stock` diretamente (null = não rastreado).
 */
export async function getProductAvailability(
  db: DbClient,
  productId: string
): Promise<Availability> {
  const product = await db.product.findUniqueOrThrow({
    where: { id: productId },
    include: { ingredients: { include: { insumo: true } } },
  });
  return computeAvailability(product);
}

/**
 * Reserva estoque para a venda de `quantity` unidades — decrementa os
 * insumos da receita (produto composto) ou o próprio produto (simples).
 * Lança `InsufficientStockError` se não houver o suficiente; nesse caso
 * nada é alterado (a checagem acontece antes de qualquer escrita).
 */
export async function reserveStock(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
  context: { relatedComandaId?: string; createdByUserId?: string; reason: string }
) {
  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
    include: { ingredients: { include: { insumo: true } } },
  });

  if (product.ingredients.length > 0) {
    for (const ing of product.ingredients) {
      const needed = Number(ing.quantityPerUnit) * quantity;
      if (Number(ing.insumo.stock) < needed) {
        throw new InsufficientStockError(
          `Insumo "${ing.insumo.name}" insuficiente para preparar "${product.name}".`
        );
      }
    }
    for (const ing of product.ingredients) {
      const needed = Number(ing.quantityPerUnit) * quantity;
      await tx.insumo.update({
        where: { id: ing.insumoId },
        data: { stock: { decrement: needed } },
      });
      await tx.insumoMovement.create({
        data: {
          insumoId: ing.insumoId,
          delta: -needed,
          reason: context.reason,
          relatedComandaId: context.relatedComandaId,
          createdByUserId: context.createdByUserId,
        },
      });
    }
    return;
  }

  if (product.stock === null) return; // não rastreado, venda livre

  if (product.stock < quantity) {
    throw new InsufficientStockError(`Estoque insuficiente de "${product.name}".`);
  }
  await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  });
  await tx.stockMovement.create({
    data: {
      productId,
      delta: -quantity,
      reason: context.reason,
      relatedComandaId: context.relatedComandaId,
      createdByUserId: context.createdByUserId,
    },
  });
}

/** Libera estoque previamente reservado (ex: item cancelado antes de ir à cozinha). */
export async function releaseStock(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
  context: { relatedComandaId?: string; createdByUserId?: string; reason: string }
) {
  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
    include: { ingredients: true },
  });

  if (product.ingredients.length > 0) {
    for (const ing of product.ingredients) {
      const amount = Number(ing.quantityPerUnit) * quantity;
      await tx.insumo.update({
        where: { id: ing.insumoId },
        data: { stock: { increment: amount } },
      });
      await tx.insumoMovement.create({
        data: {
          insumoId: ing.insumoId,
          delta: amount,
          reason: context.reason,
          relatedComandaId: context.relatedComandaId,
          createdByUserId: context.createdByUserId,
        },
      });
    }
    return;
  }

  if (product.stock === null) return;

  await tx.product.update({
    where: { id: productId },
    data: { stock: { increment: quantity } },
  });
  await tx.stockMovement.create({
    data: {
      productId,
      delta: quantity,
      reason: context.reason,
      relatedComandaId: context.relatedComandaId,
      createdByUserId: context.createdByUserId,
    },
  });
}
