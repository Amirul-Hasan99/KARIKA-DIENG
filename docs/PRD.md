# Dioleh2 product requirements

Dioleh2 is a delivery-only catalog for Wonosobo/Dieng souvenirs. Customers browse and combine products, order at least five items, provide delivery contact/address and map coordinates, choose QRIS or COD, then track fulfillment. Business owner: Putro. WhatsApp: +62 878-3943-9540. Operational origin: Titik Nol Dieng; maximum radius: 8 km. Prices and stock are not yet supplied and must be set by an authorized admin before sale.

Catalog categories: Carica Biasa, Carica Premium, Carica Kardus, Mie Ongklok Instan, Pitos, Keripik Carica, Keripik Combro, Keripik Jamur, Purwaceng, and admin-managed additions. Carica variants include pack sizes 6 and 12 where applicable. QRIS settlement must be verified before dispatch; COD is collected by the assigned company courier.

Roles: customer (guest checkout and tracking), admin (catalog, order, payment, settings and courier assignment), internal courier (assigned delivery tasks only). No table, dine-in, pickup or counter-payment workflow.

Current implementation status: landing/catalog shell and server-side checkout validations exist. Product CRUD, cart/checkout screens, exact business coordinates, auth/RBAC, courier, maps and WhatsApp delivery remain outstanding. See AUDIT_REPORT.md.
