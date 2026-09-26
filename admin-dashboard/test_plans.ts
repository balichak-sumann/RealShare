import prisma from './src/lib/prisma';

async function main() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { is_active: true }
  });
  console.log(JSON.stringify(plans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
