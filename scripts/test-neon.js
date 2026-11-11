process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { neon, neonConfig } = require('@neondatabase/serverless');

// We use the exact connection string provided by user
const url = 'postgresql://neondb_owner:npg_An3OriHysUC0@ep-snowy-haze-at8e3hc2-pooler.c-9.us-east-1.aws.neon.tech/KARIKA?sslmode=require&channel_binding=require';

async function run() {
  console.log('Testing neon with pooler URL...');
  try {
    const sql = neon(url);
    const res = await sql`SELECT 1 as test, NOW() as time`;
    console.log('Pooler connection SUCCESS!', res);
    return;
  } catch (e) {
    console.warn('Pooler failed:', e.message);
  }

  const directUrl = 'postgresql://neondb_owner:npg_An3OriHysUC0@ep-snowy-haze-at8e3hc2.us-east-1.aws.neon.tech/KARIKA?sslmode=require';
  console.log('Testing neon with direct URL...');
  try {
    const sql2 = neon(directUrl);
    const res2 = await sql2`SELECT 1 as test, NOW() as time`;
    console.log('Direct connection SUCCESS!', res2);
    return;
  } catch (e2) {
    console.warn('Direct failed:', e2.message);
  }
}

run();
