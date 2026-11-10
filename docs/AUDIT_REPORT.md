# Dioleh2 repository audit

## Findings from the checked-out source
- Stack: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Zustand, Firebase client/Admin, Midtrans Snap.
- Routes: `/`, `/table/[tableId]`, `/orders/[orderId]`, `/admin`, `/admin/kitchen`; APIs cover checkout, order lookup/status, cancellation, cash confirmation, kitchen, stock, seed and Midtrans webhook.
- Persistence: `lib/order-store.ts` previously treated a process-local Map as authoritative and swallowed Firestore failures. Checkout has now been changed to require Firestore persistence.
- Payments: Midtrans Snap SDK and signature helper exist. The previous Snap helper generated a fake token after gateway errors; this simulator behavior has been removed.
- Catalog: `lib/mock-data.ts` is a large coffee shop catalog with invented demo prices and modifiers. Seed API writes it as `menus`, not the requested Dioleh2 `products` collection.
- UI: home page selected a table; table menu and tracking copy describe coffee, dine-in, pickup and kitchen workflow. Admin/KDS remains legacy.
- Auth/security: the original API handlers exposed operational mutations. This iteration adds a signed admin session, protects `/admin` and operational APIs through middleware, and rejects cross-origin login attempts. Firestore rules are not present, and the admin credential remains a single environment-configured account rather than a user-management/RBAC system.
- Environment: checked-in example values contain dummy Firebase and Midtrans values; actual `.env.local` exists and was not read or modified.

## Features
- Present in source: customer cart state, menu modifiers, checkout handler, Firestore/Admin integration, Midtrans Snap/webhook signature helper, admin/KDS pages, order status UI, CSV/thermal-print utilities.
- Mock/demo: coffee catalog, demo table selector, in-memory order fallback, QRIS simulator/fallback transaction URL. Simulated payment has been removed from Midtrans helper; coffee data remains legacy and must not be seeded as Dioleh2 products.
- Broken or not established: no verified production credentials; no confirmed live Firestore/Midtrans connection; no customer delivery address/map, category CRUD, courier assignment/workspace, radius verification, WhatsApp provider, real product CRUD, or role-based access control.

## Migration plan and status
1. Audit actual source and preserve clean Git state — done; branch `codex/dioleh2-refactor` created.
2. Replace table-first customer entry with Dioleh2 delivery storefront — partial; `/` and `/catalog` updated with example products, sourced images, and clearly marked reference prices.
3. Add authoritative products/variants, cart/checkout UI and validated delivery flow — backend checkout validation added, full admin-backed product and customer flow outstanding.
4. Implement authenticated admin/courier workspaces, status history and payment verification — admin login/session protection added; catalog/order/courier workflows remain outstanding.
5. Remove or quarantine legacy table, coffee, KDS and POS flows after dependencies are migrated — outstanding.
6. Update all operational documentation and verify build — in progress.

## Retain / modify / remove
- Retain: Next.js, Firebase Admin/Firestore, Midtrans, tracking route concept, Zustand and reusable UI utilities.
- Modify: catalog, checkout, order/payment/delivery states, admin workflows, customer tracking and documentation.
- Remove from customer workflow: table selection, dine-in, pickup and coffee modifiers. Legacy routes/components remain in the repository pending full migration.
