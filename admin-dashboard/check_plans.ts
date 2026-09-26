import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './node_modules/@prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const plans = await prisma.subscriptionPlan.findMany({});
  console.log(plans);
}
main().catch(console.error).finally(() => prisma.$disconnect());
