import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_An3OriHysUC0@ep-snowy-haze-at8e3hc2-pooler.c-9.us-east-1.aws.neon.tech/KARIKA?sslmode=require&channel_binding=require';

declare global {
  var __neonSql: any;
  var __neonReachable: boolean | undefined;
  var __neonInitAttempted: boolean | undefined;
}

/**
 * Returns the neon sql tagged-template function, or null if unavailable.
 * On dev machines with restricted outbound networking (e.g. port 443 blocked),
 * the first query will time out, after which we permanently skip Neon and
 * fall through to disk / in-memory storage so the app stays functional.
 */
export function getNeonSql(): any {
  // If we have confirmed Neon is unreachable, skip immediately
  if (global.__neonReachable === false) return null;

  if (!global.__neonSql) {
    try {
      if (!connectionString || connectionString.includes('placeholder')) return null;
      global.__neonSql = neon(connectionString);
    } catch (err) {
      console.warn('[db] Failed to initialize neon sql client:', err);
      global.__neonReachable = false;
      return null;
    }
  }
  return global.__neonSql;
}

let isTableInitialized = false;

export async function ensureNeonTables() {
  if (isTableInitialized) return;
  if (global.__neonReachable === false) return;

  const sql = getNeonSql();
  if (!sql) return;

  try {
    // Short timeout to avoid blocking app start on dev machines with firewall restrictions
    const initPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(120) PRIMARY KEY,
          order_number VARCHAR(120) NOT NULL UNIQUE,
          customer_id VARCHAR(100),
          table_id VARCHAR(50) DEFAULT 'delivery',
          table_number VARCHAR(50) DEFAULT 'delivery',
          customer_name VARCHAR(200),
          customer_phone VARCHAR(60),
          delivery_address TEXT,
          coordinates JSONB,
          delivery_distance_km NUMERIC,
          total_amount NUMERIC NOT NULL DEFAULT 0,
          payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
          order_status VARCHAR(50) NOT NULL DEFAULT 'received',
          delivery_status VARCHAR(50) DEFAULT 'pending',
          payment_type VARCHAR(50) DEFAULT 'qris',
          midtrans_transaction_id VARCHAR(150),
          snap_token TEXT,
          snap_redirect_url TEXT,
          whatsapp_confirmation_sent_at TIMESTAMPTZ,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);`;
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Neon init timeout (2500ms)')), 2500)
    );

    await Promise.race([initPromise, timeoutPromise]);
    isTableInitialized = true;
    global.__neonReachable = true;
    console.log('[db] ✅ Neon database connected and tables ready');
  } catch (err: any) {
    // Mark as unreachable so future calls skip immediately without blocking
    global.__neonReachable = false;
    console.warn('[db] ⚠️ Neon unreachable, using local disk/memory fallback:', err.message);
  }
}
