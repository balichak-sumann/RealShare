require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testCron() {
  console.log('Testing Scheduled Notification Creation and Cron Execution:');

  // 1. Create a test scheduled notification due right now
  const now = new Date();
  const testSchedule = await prisma.scheduledNotification.create({
    data: {
      title: 'Daily Morning Market Brief',
      body: 'Good morning! Check out the newly listed commercial fractions.',
      audience: 'all',
      repeat_type: 'daily',
      repeat_time: '09:00',
      next_send_at: now, // Due immediately
      is_active: true,
    }
  });
  console.log('1. Created scheduled notification:', testSchedule.id, testSchedule.title);

  // 2. Query due notifications
  const due = await prisma.scheduledNotification.findMany({
    where: {
      is_active: true,
      next_send_at: { lte: new Date() }
    }
  });
  console.log('2. Due notifications found count:', due.length);

  // 3. Clean up test schedule
  await prisma.scheduledNotification.delete({
    where: { id: testSchedule.id }
  });
  console.log('3. Test schedule cleaned up.');

  await prisma.$disconnect();
  await pool.end();
}

testCron().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
