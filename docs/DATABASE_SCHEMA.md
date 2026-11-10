# Database schema (target)

Firestore collections: `users`, `customers`, `couriers`, `categories`, `products`, `orders`, `payments`, `deliveries`, `business_settings`, `notification_logs`, `audit_logs`.

Product: name, slug, category_id, description, image_url, variants (variant id/name/confirmed integer price/stock), is_available, timestamps. Prices and inventory must be business-entered; current source does not migrate coffee mock records.

Order: customer_name/phone and address snapshot, coordinates, server-calculated distance, item snapshots (product/variant names, unit prices, quantity, subtotal), total, payment method/status, order status, delivery status, assigned courier id, timestamps. Use Firestore transactions for inventory reservation/order creation when inventory controls are enabled.

History subcollections or append-only records: `orders/{id}/status_history`, `payments/{id}/history`, `deliveries/{id}/history`. Never derive old order totals from current catalog prices.

Current implementation persists legacy-shaped orders in `orders`; checkout saves only after successful Firestore configuration. Full schema migration is outstanding.
