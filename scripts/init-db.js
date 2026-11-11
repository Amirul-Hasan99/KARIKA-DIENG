const { neon } = require('@neondatabase/serverless');

// We test both direct and pooler
const poolerUrl = 'postgresql://neondb_owner:npg_An3OriHysUC0@ep-snowy-haze-at8e3hc2-pooler.c-9.us-east-1.aws.neon.tech/KARIKA?sslmode=require&channel_binding=require';
const directUrl = 'postgresql://neondb_owner:npg_An3OriHysUC0@ep-snowy-haze-at8e3hc2.us-east-1.aws.neon.tech/KARIKA?sslmode=require';

async function testConnection(url, label) {
  try {
    console.log(`Testing ${label}...`);
    const sql = neon(url);
    const res = await sql`SELECT NOW() as current_time, 1 as status`;
    console.log(`${label} connected successfully!`, res);
    return sql;
  } catch (err) {
    console.warn(`${label} failed:`, err.message);
    return null;
  }
}

async function main() {
  let sql = await testConnection(directUrl, 'Direct Neon Host');
  if (!sql) {
    sql = await testConnection(poolerUrl, 'Pooler Neon Host');
  }

  if (!sql) {
    throw new Error('Both Neon connections failed.');
  }

  console.log('Creating orders table if not exists...');
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
  console.log('Table orders created/verified in Neon!');

  // Create an index on customer_phone for blazing fast search by WA number!
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);`;
  console.log('Indexes created successfully!');

  const count = await sql`SELECT COUNT(*) FROM orders`;
  console.log('Neon order count:', count);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
