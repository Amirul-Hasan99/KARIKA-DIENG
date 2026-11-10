# Engineering practices

- Preserve the existing Next.js 15, React 19, TypeScript, Tailwind, Firebase Admin/Firestore and Midtrans stack.
- Trust no client totals, product names, prices, payment state or delivery distance. Recompute values on the server from persistent products and server coordinates.
- Production order creation requires persistent Firestore. Never silently fall back to process memory or simulate a real payment.
- Keep customer, admin and assigned-courier access separated. Protect every operational API with server-side authorization before production use.
- Do not invent business prices, inventory, coordinates or integration success. Configure those values and document unavailable credentials.
- Keep product prices immutable in order snapshots. Keep payment, order and delivery state distinct.
- Validate request shape, input bounds and state transitions on the server. Make payment webhook handling signature-verified and idempotent.
- Use responsive, accessible mobile-first UI and consistent Dioleh2 tokens: yellow #F4CE00, dark yellow #DDB900, warm background #F8F7F0, white surface, text #292929.
