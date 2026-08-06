# Bar POS — restaurant-pdv

A full-stack point-of-sale (POS) system for a small bar/restaurant: waiter
ordering, kitchen printing, cashier checkout (cash/Pix/card), stock with
recipes, and admin (products, staff, suppliers/purchases/expenses, reports).

## Stack

Next.js 16 (App Router, TypeScript, Turbopack) · PostgreSQL + Prisma ·
Tailwind CSS · JWT sessions (`jose`) · Zod validation · bcryptjs ·
Mercado Pago (Pix) · Node.js print bridge (`print-bridge/`, ESC/POS)

## Conventions

- Mutations go through Server Actions in `src/app/actions/`, not API routes
  — the only API routes are the Mercado Pago webhook and the print-bridge
  polling endpoints (`src/app/api/`), both external integrations.
- Every server action re-validates the caller's role server-side
  (`requireRole` / `src/lib/dal.ts`) — never trust a client-supplied role
  or id for authorization.
- Money is handled in integer cents (`src/lib/money.ts`) to avoid
  floating-point rounding in payment/stock math.
- Stock/payment mutations that touch more than one row go through
  `prisma.$transaction` — see `src/lib/stock.ts` for the pattern.
- No comments explaining what code does; a comment is only justified when
  it explains a non-obvious why (a hidden constraint, a workaround for a
  specific bug, a subtle invariant).

## Running locally

```bash
npm install
cp .env.example .env
# point DATABASE_URL at a local Postgres and generate a SESSION_SECRET
# with `openssl rand -base64 32`

npx prisma migrate dev
npx prisma db seed   # creates an admin, sample waiter/cashier, tables, menu

npm run dev
```

To try the kitchen-printing flow with no hardware:

```bash
cd print-bridge
npm install
cp .env.example .env   # same BRIDGE_API_KEY as the main app's .env
npm run dev
```

With `PRINTER_MODE=console` (the default), orders print as a formatted
ticket in the print-bridge's terminal instead of a real printer.
