import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "trocar-esta-senha";

const STAFF = [
  { name: "Zé Garçom", role: "GARCOM" as const, pin: "1111" },
  { name: "Maria Garçonete", role: "GARCOM" as const, pin: "2222" },
  { name: "Joana Caixa", role: "CAIXA" as const, pin: "3333" },
];

const MESA_COUNT = 30;

const PRODUCTS = [
  // Bebidas
  { name: "Cerveja Long Neck", category: "Bebidas", price: 8.5, stock: 120, lowStockThreshold: 24 },
  { name: "Chopp 300ml", category: "Bebidas", price: 9.0, stock: 200, lowStockThreshold: 40 },
  { name: "Caipirinha", category: "Bebidas", price: 15.0, stock: null, lowStockThreshold: null },
  { name: "Refrigerante Lata", category: "Bebidas", price: 6.0, stock: 80, lowStockThreshold: 20 },
  { name: "Água Mineral", category: "Bebidas", price: 4.0, stock: 60, lowStockThreshold: 15 },
  { name: "Suco Natural", category: "Bebidas", price: 8.0, stock: 30, lowStockThreshold: 10 },
  // Petiscos
  { name: "Porção de Batata Frita", category: "Petiscos", price: 28.0, stock: null, lowStockThreshold: null },
  { name: "Isca de Frango", category: "Petiscos", price: 32.0, stock: null, lowStockThreshold: null },
  { name: "Bolinho de Bacalhau (un.)", category: "Petiscos", price: 6.5, stock: 40, lowStockThreshold: 10 },
  { name: "Amendoim Torrado", category: "Petiscos", price: 10.0, stock: 25, lowStockThreshold: 8 },
  { name: "Linguiça Acebolada", category: "Petiscos", price: 26.0, stock: null, lowStockThreshold: null },
  // Pratos
  { name: "Picanha para 2", category: "Pratos", price: 79.0, stock: null, lowStockThreshold: null },
  { name: "Filé com Fritas", category: "Pratos", price: 42.0, stock: null, lowStockThreshold: null },
];

const INSUMOS = [
  { name: "Cachaça", unit: "ml", stock: 5000, lowStockThreshold: 1000 },
  { name: "Limão", unit: "un", stock: 100, lowStockThreshold: 20 },
  { name: "Açúcar", unit: "g", stock: 3000, lowStockThreshold: 500 },
  { name: "Batata congelada", unit: "g", stock: 8000, lowStockThreshold: 1500 },
  { name: "Óleo de fritura", unit: "ml", stock: 4000, lowStockThreshold: 1000 },
  { name: "Peito de frango", unit: "g", stock: 6000, lowStockThreshold: 1000 },
];

// Produtos compostos: quanto de cada insumo uma unidade vendida consome.
const RECIPES: Record<string, { insumo: string; quantityPerUnit: number }[]> = {
  Caipirinha: [
    { insumo: "Cachaça", quantityPerUnit: 50 },
    { insumo: "Limão", quantityPerUnit: 1 },
    { insumo: "Açúcar", quantityPerUnit: 20 },
  ],
  "Porção de Batata Frita": [
    { insumo: "Batata congelada", quantityPerUnit: 400 },
    { insumo: "Óleo de fritura", quantityPerUnit: 50 },
  ],
  "Isca de Frango": [
    { insumo: "Peito de frango", quantityPerUnit: 350 },
    { insumo: "Óleo de fritura", quantityPerUnit: 50 },
  ],
};

async function main() {
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      name: "Administrador",
      role: "ADMIN",
      username: ADMIN_USERNAME,
      passwordHash: adminPasswordHash,
    },
  });

  for (const staff of STAFF) {
    const pinHash = await bcrypt.hash(staff.pin, 10);
    const existing = await prisma.user.findFirst({
      where: { name: staff.name, role: staff.role },
    });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { pinHash } });
    } else {
      await prisma.user.create({
        data: { name: staff.name, role: staff.role, pinHash },
      });
    }
  }

  for (let i = 1; i <= MESA_COUNT; i++) {
    const label = `Mesa ${String(i).padStart(2, "0")}`;
    await prisma.mesa.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }

  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }

  const insumoIdByName = new Map<string, string>();
  for (const insumo of INSUMOS) {
    const existing = await prisma.insumo.findFirst({ where: { name: insumo.name } });
    const record = existing ?? (await prisma.insumo.create({ data: insumo }));
    insumoIdByName.set(insumo.name, record.id);
  }

  for (const [productName, ingredients] of Object.entries(RECIPES)) {
    const product = await prisma.product.findFirst({ where: { name: productName } });
    if (!product) continue;
    for (const ing of ingredients) {
      const insumoId = insumoIdByName.get(ing.insumo);
      if (!insumoId) continue;
      await prisma.productIngredient.upsert({
        where: { productId_insumoId: { productId: product.id, insumoId } },
        update: { quantityPerUnit: ing.quantityPerUnit },
        create: { productId: product.id, insumoId, quantityPerUnit: ing.quantityPerUnit },
      });
    }
  }

  // --- Custos: fornecedores, contas fixas e uma compra de exemplo ---
  const SUPPLIERS = [
    { name: "Atacadão Bebidas", kind: "INSUMO" as const },
    { name: "Light Energia", kind: "SERVICO" as const },
  ];
  const supplierIdByName = new Map<string, string>();
  for (const s of SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    const record = existing ?? (await prisma.supplier.create({ data: s }));
    supplierIdByName.set(s.name, record.id);
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 3, 0, 0));

  const FIXED_EXPENSES = [
    {
      description: "Aluguel do salão",
      category: "Aluguel",
      amount: 3500,
      dueDay: 10,
    },
    {
      description: "Internet",
      category: "Internet",
      amount: 150,
      dueDay: 15,
    },
  ];
  for (const fx of FIXED_EXPENSES) {
    const existing = await prisma.expense.findFirst({
      where: { kind: "FIXA", description: fx.description, competencia: monthStart },
    });
    if (existing) continue;
    const dueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), fx.dueDay, 3, 0, 0));
    await prisma.expense.create({
      data: {
        kind: "FIXA",
        description: fx.description,
        category: fx.category,
        amount: fx.amount,
        paymentTerm: "PRAZO_UNICO",
        installmentsCount: 1,
        issuedAt: monthStart,
        competencia: monthStart,
        installments: {
          create: [{ number: 1, dueDate, amount: fx.amount }],
        },
      },
    });
  }

  const existingPurchase = await prisma.expense.findFirst({
    where: { kind: "COMPRA_INSUMO", description: { startsWith: "Atacadão Bebidas" } },
  });
  if (!existingPurchase) {
    const cachacaId = insumoIdByName.get("Cachaça");
    const limaoId = insumoIdByName.get("Limão");
    const supplierId = supplierIdByName.get("Atacadão Bebidas");
    if (cachacaId && limaoId && supplierId) {
      const purchaseItems = [
        { insumoId: cachacaId, description: "Cachaça 51 (garrafa 1L)", quantity: 2000, unitCost: 0.045 },
        { insumoId: limaoId, description: "Limão taiti (caixa)", quantity: 50, unitCost: 0.8 },
      ];
      const amount = purchaseItems.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
      const totalCents = Math.round(amount * 100);
      const halfCents = Math.floor(totalCents / 2);
      const dueDate1 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 30, 3, 0, 0));
      const dueDate2 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 60, 3, 0, 0));

      await prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            kind: "COMPRA_INSUMO",
            description: "Atacadão Bebidas — Cachaça 51 (garrafa 1L), Limão taiti (caixa)",
            category: "Insumos",
            supplierId,
            amount,
            paymentTerm: "PRAZO_PARCELADO",
            installmentsCount: 2,
            installmentIntervalDays: 30,
            issuedAt: now,
            items: { create: purchaseItems.map((i) => ({ ...i, totalCost: i.quantity * i.unitCost })) },
            installments: {
              create: [
                { number: 1, dueDate: dueDate1, amount: halfCents / 100 },
                { number: 2, dueDate: dueDate2, amount: (totalCents - halfCents) / 100 },
              ],
            },
          },
        });
        for (const item of purchaseItems) {
          await tx.insumo.update({
            where: { id: item.insumoId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.insumoMovement.create({
            data: {
              insumoId: item.insumoId,
              delta: item.quantity,
              reason: "reposição (compra)",
              relatedExpenseId: expense.id,
            },
          });
        }
      });
    }
  }

  console.log("Seed concluído.");
  console.log(`Admin: usuário "${ADMIN_USERNAME}", senha "${ADMIN_PASSWORD}" (troque em produção)`);
  console.log("Garçom/Caixa PINs:", STAFF.map((s) => `${s.name}: ${s.pin}`).join(" | "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
