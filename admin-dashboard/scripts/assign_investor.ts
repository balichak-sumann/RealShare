import { Client } from 'pg';

async function main() {
  const connectionString = 'postgres://indusinnovate:nmYGybz3y8zNDuAaJrgVfHql1mhWOgRL@dpg-da77qiad0e5s73dl6rhg-a.oregon-postgres.render.com/realshare?sslmode=require';
  const client = new Client({ connectionString });
  
  await client.connect();
  
  console.log('Fetching profiles...');
  const empRes = await client.query("SELECT id, full_name FROM profiles WHERE email = 'emp@realshare.com'");
  const invRes = await client.query("SELECT id, full_name FROM profiles WHERE email = 'investor@realshare.com'");
  
  if (empRes.rows.length === 0 || invRes.rows.length === 0) {
    console.error('Could not find either emp@realshare.com or investor@realshare.com');
    await client.end();
    return;
  }
  
  const employee = empRes.rows[0];
  const investor = invRes.rows[0];
  
  console.log(`Assigning investor ${investor.full_name} to employee ${employee.full_name}...`);
  
  await client.query("UPDATE profiles SET assigned_sales_rep_id = $1 WHERE id = $2", [employee.id, investor.id]);
  
  console.log('Successfully assigned investor to employee!');
  
  await client.end();
}

main().catch(console.error);
