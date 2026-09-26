import { PrismaClient } from './admin-dashboard/node_modules/@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const plans = await prisma.subscriptionPlan.findMany({ select: { id: true, name: true, role_type: true, is_active: true } });
  console.log(plans);
}
main().catch(console.error).finally(() => prisma.$disconnect());
