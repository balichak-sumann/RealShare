const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://indusinnovate:VXpHjQItUpG7lOJSbDkFJTNMKfsmvZCY@dpg-dad7lnqjnfac73ept4tg-a.ohio-postgres.render.com/realshare_qn3n?sslmode=require&connection_limit=5'
});

async function main() {
  const client = await pool.connect();
  try {
    // List all tables to check what exists
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('All tables:', tables.rows.map(r => r.tablename).join(', '));
    
    // Check investments table
    const inv = await client.query("SELECT COUNT(*) as count FROM investments");
    console.log('Investments count:', inv.rows[0]);
    
    // Check transactions table
    const txn = await client.query("SELECT COUNT(*) as count FROM transactions");
    console.log('Transactions count:', txn.rows[0]);
    
    // Check support_tickets table
    try {
      const tickets = await client.query("SELECT COUNT(*) as count FROM support_tickets");
      console.log('Support tickets count:', tickets.rows[0]);
    } catch (e) {
      console.log('support_tickets error:', e.message);
    }
    
    // Check service_inquiries table
    try {
      const svc = await client.query("SELECT COUNT(*) as count FROM service_inquiries");
      console.log('Service inquiries count:', svc.rows[0]);
    } catch (e) {
      console.log('service_inquiries error:', e.message);
    }
    
    // Check kyc_documents
    try {
      const kyc = await client.query("SELECT COUNT(*) as count FROM kyc_documents");
      console.log('KYC documents count:', kyc.rows[0]);
    } catch (e) {
      console.log('kyc_documents error:', e.message);
    }
    
  } finally { 
    client.release(); 
    pool.end(); 
  }
}

main().catch(console.error);
