require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testAll() {
  console.log('Testing Database connections & Models:');

  // 1. Test ScheduledNotification model
  const scheduledCount = await prisma.scheduledNotification.count();
  console.log('✅ ScheduledNotification model query successful. Count:', scheduledCount);

  // 2. Test Transaction / Ledger model
  const txnCount = await prisma.transaction.count();
  console.log('✅ Transaction model query successful. Count:', txnCount);

  // 3. Test ServiceInquiry model
  const serviceCount = await prisma.serviceInquiry.count();
  console.log('✅ ServiceInquiry model query successful. Count:', serviceCount);

  // 4. Test SupportTicket model
  const ticketCount = await prisma.supportTicket.count();
  console.log('✅ SupportTicket model query successful. Count:', ticketCount);

  // 5. Test Banner model
  const bannerCount = await prisma.banner.count();
  console.log('✅ Banner model query successful. Count:', bannerCount);

  // 6. Test Notification model
  const notifCount = await prisma.notification.count();
  console.log('✅ Notification model query successful. Count:', notifCount);

  console.log('\nAll 6 management console models are active, healthy, and communicating with PostgreSQL database!');
  await prisma.$disconnect();
  await pool.end();
}

testAll().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
