-- No máximo uma comanda OPEN por mesa por vez.
-- Prisma Schema DSL não suporta índices únicos parciais, então isso é
-- mantido apenas como SQL puro (não representável em schema.prisma).
CREATE UNIQUE INDEX "Comanda_mesaId_open_unique"
  ON "Comanda" ("mesaId")
  WHERE "status" = 'OPEN';
