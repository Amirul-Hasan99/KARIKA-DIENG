const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_An3OriHysUC0@ep-snowy-haze-at8e3hc2.us-east-1.aws.neon.tech/KARIKA?sslmode=require';

// Parse connection or use connectionString
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log('Connecting via pg Pool...');
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() as current_time, version()');
    console.log('PostgreSQL Connected Successfully!', res.rows[0]);

    console.log('Creating table orders...');
    await client.query(`
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
    `);
    console.log('Table orders verified/created!');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);`);
    console.log('Indexes ready!');

    const countRes = await client.query('SELECT COUNT(*) FROM orders');
    console.log('Total orders in Neon DB:', countRes.rows[0].count);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('PG Connection Error:', err);
  process.exit(1);
});
