const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: '.env' });

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const props = await prisma.property.findMany({
    where: { title: 'Phoenix One Cyber Suites' },
    include: { images: true }
  });
  console.log(JSON.stringify(props.map(p => ({
    id: p.id,
    image_url: p.image_url,
    images: p.images.map(img => img.image_url)
  })), null, 2));
  
  await prisma.$disconnect();
}
main().catch(console.error);
