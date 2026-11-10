# Deployment guide

1. Configure a persistent Firebase project and least-privilege Firestore rules/service account.
2. Set verified `STORE_LAT`/`STORE_LNG`, confirmed products, variants, stock and prices.
3. Configure Midtrans sandbox, verify signed webhook behavior, then configure production credentials after business approval.
4. Implement and verify authentication/RBAC on admin, courier and all mutation APIs before public production exposure.
5. Run lint, typecheck, tests and production build. Review `.env.local` and ensure secrets are not committed.
6. Deploy only through the approved environment; no deployment was performed as part of this refactor.
