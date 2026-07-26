# 🍽️ Restaurant PDV (Bar POS)

A full-stack point-of-sale (POS) system built for a small neighborhood bar:
the waiter takes orders from their phone, the kitchen gets a ticket printed
automatically, and the register closes each tab with cash, Pix, or a card —
with stock control and sales reports along the way.

Designed around a real constraint: a small bar with a tight budget, busy on
live-music nights. Every technical choice below favors low recurring cost
over "the most robust solution possible."

---

## 🚀 Features

- **Waiter app (PWA)** — pick a table, add items to the order, send straight
  to the kitchen. No app store, installable straight to the home screen.
- **Kitchen printing** — a small standalone service polls for new orders and
  prints ESC/POS tickets on a thermal printer, with a console fallback so the
  whole flow can be tested before any hardware is bought.
- **Cashier checkout** — close a tab with cash, a Pix QR code (Mercado Pago
  API + webhook confirmation), or a card terminal.
- **Stock control with recipes** — inventory is reserved the moment an item
  is ordered, not just at checkout, so two tables can't oversell the same
  item. Composite products (a caipirinha, a food portion) have recipes that
  track the raw ingredients they consume.
- **Admin dashboard** — products, tables, staff, stock, and daily sales
  reports.
- **PIN login** for waiters/cashiers, password login for the admin.

```
┌────────────┐    order      ┌──────────────┐   pending job   ┌───────────────┐
│  Waiter     │ ────────────▶│              │◀────────────────│ Print Bridge  │
│  (PWA)      │               │   Next.js    │                 │ (Node.js, on  │
└────────────┘               │   + Postgres │   ack PRINTED   │  the kitchen  │
┌────────────┐   checkout    │   (cloud)    │────────────────▶│  LAN)         │
│  Cashier    │ ────────────▶│              │                 │ → printer     │
│  (PWA)      │               └──────┬───────┘                 └───────────────┘
└────────────┘                       │
                              webhook │ Pix
                                      ▼
                              Mercado Pago
```

---

## 🛠️ Tech Stack

**Framework:** Next.js 16 (App Router, TypeScript, Turbopack).

**Database:** PostgreSQL, accessed via Prisma (ORM).

**Styling:** Tailwind CSS.

**Authentication:** session via a JWT-signed cookie (using the `jose`
library) — PIN login for waitstaff/cashier, username and password for the
admin, with no external auth service.

**Validation:** Zod.

**Password/PIN hashing:** bcryptjs.

**Payments:** Mercado Pago — Pix via API with QR code and a confirmation
webhook; card payments go through a separate physical terminal (e.g. Point
Smart).

**Kitchen printing:** a separate Node.js service (`print-bridge`) running
locally at the bar (Raspberry Pi or mini PC), which fetches orders from the
cloud and sends them to a thermal printer via the ESC/POS protocol.

**Hosting:** Railway (or Render as an alternative), bundling the web app
and a managed Postgres instance into a single bill.

---

## 🧠 Notable Decisions

**Cloud-hosted, not local-only.** The cheapest path for a small bar would be
running everything on the local network with zero hosting cost. Going
cloud was deliberate: the roadmap includes ordering via a QR code at the
table, from the customer's own phone and mobile data — that needs the app
reachable from the internet, not just the bar's Wi-Fi.

**Kitchen printer on the LAN, backend in the cloud.** That mismatch is
bridged by a standalone service (`print-bridge/`) that polls the cloud API
for pending tickets and prints locally. Polling instead of a websocket —
overkill at this order volume, and far more resilient to a dropped
connection than a persistent socket would be.

**Stock reserved at order time, not at checkout.** The first version only
decremented stock when a tab closed — which meant two tables could both
order the last of something before either one paid. Every order now
atomically reserves stock (or, for composite products, each recipe
ingredient) the moment it's placed, and releases it if the item is
cancelled before reaching the kitchen.

**Card payments without a native app.** Card-reader SDKs only run inside a
native Android app, not a browser. Rather than block the rest of the system
on building one, card payments go through a separate terminal, with the
cashier confirming in-app once the terminal approves. If that manual step
ever needs to go away, the path is wrapping the same PWA with
[Capacitor](https://capacitorjs.com/) and plugging in the terminal's SDK —
reusing the whole backend and frontend, no rewrite.

**A comanda belongs to the table, never to the waiter.** That's what makes
the (future) QR-code self-ordering feature a clean addition later, instead
of a rework: a customer scanning a code at their table would just be adding
to the same order a waiter could also be building.

---

## 🤖 AI-Assisted QA & Security

Claude Code is used on this project as a QA and security reviewer during development — flagging bugs, race conditions, and vulnerabilities before they ship. Implementation and commits are my own.

---

## ▶️ Running locally

```bash
npm install
cp .env.example .env
# point DATABASE_URL at a local Postgres and generate a SESSION_SECRET
# with `openssl rand -base64 32`

npx prisma migrate dev
npx prisma db seed   # creates an admin, sample waiter/cashier, tables, menu

npm run dev
```

The seed script prints the admin credentials and staff PINs it created.

To try the kitchen-printing flow with no hardware at all:

```bash
cd print-bridge
npm install
cp .env.example .env   # same BRIDGE_API_KEY as the main app's .env
npm run dev
```

With `PRINTER_MODE=console` (the default), any order the waiter sends
appears as a formatted ticket right in the print-bridge's terminal —
exactly what would come out of a real printer.

---

## 📌 Status

Functional MVP — the full order → kitchen → payment loop works end to end,
covering cash, Pix, and card-terminal confirmation, plus recipe-aware stock
tracking and sales reporting.

Still open: an offline queue in the waiter's PWA (service worker) so a
Wi-Fi drop at the bar doesn't lose an order, a real run against Mercado
Pago's sandbox (the integration follows their official API but hasn't been
exercised against live test credentials), and deployment + a Raspberry Pi
set up as a systemd service for the print bridge.
