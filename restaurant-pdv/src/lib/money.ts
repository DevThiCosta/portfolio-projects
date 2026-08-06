import "server-only";

/** Evita comparações/arredondamentos de ponto flutuante em dinheiro — tudo em centavos inteiros. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToAmount(cents: number): number {
  return cents / 100;
}
