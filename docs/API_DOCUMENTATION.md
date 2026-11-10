# API documentation (current)

- `POST /api/orders/checkout`: accepts customerName, customerPhone, address, coordinates `{lat,lng}`, items `[{productId,qty}]`, paymentType `qris|cod`. Server enforces minimum five units, coordinate bounds, <=8 km from `STORE_LAT/STORE_LNG`, available Firestore product and positive integer price. QRIS requires real Midtrans credentials; order requires Firestore. Returns orderId/orderNumber/payment details. Errors are JSON and missing setup returns 503.
- `POST /api/admin/login`: validates the environment-configured admin account and sets an eight-hour signed HttpOnly session cookie. `POST /api/admin/logout` clears it.
- Middleware requires that signed session for `/admin/**` and operational API endpoints. Customer checkout, verified Midtrans webhook and guest order lookup stay unauthenticated.
- Other existing order, kitchen, stock, seed, cancellation, cash-confirmation and webhook routes are inherited legacy APIs. Several mutations lack RBAC and webhook currently needs stricter mandatory signature/idempotency checks. They must not be treated as production-secure.

Target APIs: category/product CRUD (admin), scoped customer tracking, admin order/payment/courier assignment, courier assigned-task/status update, idempotent payment webhook. These are not implemented yet.
