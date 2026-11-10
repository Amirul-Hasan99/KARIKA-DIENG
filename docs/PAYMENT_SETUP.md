# Payment setup

QRIS uses Midtrans Snap. Provide valid `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, and `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`. Checkout refuses QRIS if transaction creation fails; it no longer emits a simulated payment URL. The webhook endpoint exists but needs mandatory signature validation, amount/order matching and idempotent state updates before production. COD collection must be recorded by an authorized courier; legacy cash confirmation is not a substitute.
