# ⚡ MASTER ROUTER HUB (`CLAUDE.md` <-> 6 VAULT FILES)

Welcome to the **Click2IT BD E-Commerce, POS & Enterprise ERP** repository.
This file acts as the **Master Router Hub** connecting all AI coding agents to the 6 core knowledge vault files located in [`./vault/`](./vault/).

---

## 🔒 Connected Vault Files

| Vault ID | File Path | Purpose & When to Read |
| :--- | :--- | :--- |
| **01** | [`vault/01.PRD.md`](./vault/01.PRD.md) | **Product Requirements:** Storefront rules, stock availability rules, address book behavior, POS/ERP features, and accounting rules. |
| **02** | [`vault/02.STATE.md`](./vault/02.STATE.md) | **State Machine:** Order lifecycle (`pending` -> `processing` stock deduction), `isOutOfStock` gate, invoice edit reconciliation, and individual vs corporate ledger state flows. |
| **03** | [`vault/03.TOKENS.md`](./vault/03.TOKENS.md) | **Design Tokens:** Brand colors (`#F97316` orange, `#081621` admin dark navy, `#EF4444` action red), currency formatting, and Tailwind UI conventions. |
| **04** | [`vault/04.STACK.md`](./vault/04.STACK.md) | **Framework & Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind v4, Firebase v12, Express, and build/verification commands. |
| **05** | [`vault/05.SCHEMA.md`](./vault/05.SCHEMA.md) | **Database Schema:** Firestore collections (`products`, `orders`, `customers`, `transactions`, `vendors`, `users`, `counters`) and field definitions. |
| **06** | [`vault/06.PLAN.md`](./vault/06.PLAN.md) | **Sequential Plan:** Completed milestones, active architectural invariants, and verification checklist. |

---

## 🚨 Mandatory Agent Guardrails (Quick Reference)

1. **Out-of-Stock Gate:** Never block adding to cart or checkout when `product.stock <= 0`. Only block when `Boolean(product.isOutOfStock) === true` (see [`vault/02.STATE.md`](./vault/02.STATE.md)).
2. **Stock Deduction Timing:** Online orders deduct stock when status changes to `processing` (tracked by `order.stockDeducted = true`). Do not double-deduct.
3. **Order Item ID Normalization:** Order items in Firestore may store the product ID in `item.id` or `item.productId`. Always use `const pid = item.id || item.productId` before calling `doc(db, 'products', pid)`.
4. **Ledger Isolation:** Selecting an individual customer in [`Ledger.tsx`](./src/pages/admin/tabs/accounting/Ledger.tsx) or [`CustomerDueList.tsx`](./src/pages/admin/tabs/sales/CustomerDueList.tsx) must **only** display that customer's own transactions unless a Corporate Company rollup (`isCompany: true`) is explicitly chosen.
5. **Minimal Footprint:** Only modify code directly related to the user's request. Never alter unrelated business logic.
