import prisma from './src/lib/prisma';
async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log(plans.map((p: any) => ({ id: p.id, tier: p.tier, role_type: p.role_type, is_active: p.is_active })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
