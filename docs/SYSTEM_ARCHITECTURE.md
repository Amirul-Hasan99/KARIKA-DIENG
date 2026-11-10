# System architecture (current and target)

Current stack: Next.js App Router route handlers, React client pages, Zustand cart, Firebase Admin/Firestore, Midtrans Snap. The checkout route is the trusted boundary: validates delivery details and item counts, loads current product prices from Firestore, computes radius from server coordinates, requests real Midtrans transaction for QRIS, and persists the resulting order. It rejects missing Firestore/configuration and does not use mock persistence.

Target modules: catalog repository (categories/products/variants), order service (atomic order and item snapshots), payment adapter + verified webhook, delivery service + history, auth/RBAC, and notification adapter. Customer tracking reads a scoped order projection. Courier APIs must filter by authenticated courier assignment. Legacy table/POS/KDS routes are transitional and are not suitable as Dioleh2 operations.

Deployment requires persistent Firestore, server-only Firebase credentials, confirmed origin coordinates, real product data and production payment credentials. No production deployment was performed.
