require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in .env file!");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const targetInput = process.argv[2] || '+916302662448';
  console.log(`Searching for user with identifier: "${targetInput}"...`);

  let profile = null;

  if (targetInput.includes('@')) {
    profile = await prisma.profile.findFirst({
      where: { email: { equals: targetInput, mode: 'insensitive' } }
    });
  } else {
    const cleanPhone = targetInput.replace('+91', '').trim();
    profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { id: targetInput },
          { phone_number: cleanPhone },
          { phone_number: targetInput }
        ]
      }
    });
  }

  if (!profile) {
    console.error(`❌ Profile not found in database for identifier: ${targetInput}`);
    console.log(`\nAll current profiles in DB:`);
    const profiles = await prisma.profile.findMany({
      select: { id: true, email: true, phone_number: true, full_name: true, role: true },
      take: 20
    });
    console.log(profiles);
    process.exit(1);
  }

  console.log(`Found profile: ID=${profile.id}, Name=${profile.full_name}, Email=${profile.email}, Current Role=${profile.role}`);

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: { role: 'superadmin', is_approved: true }
  });

  console.log(`\n🎉 SUCCESS: Upgraded user "${updated.full_name || updated.email || updated.id}" to role 'superadmin'!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
