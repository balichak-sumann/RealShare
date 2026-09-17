const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDevelopers() {
  const developers = await prisma.developer.findMany({
    select: { id: true, name: true, company_name: true }
  });
  console.log(JSON.stringify(developers, null, 2));
}

checkDevelopers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
