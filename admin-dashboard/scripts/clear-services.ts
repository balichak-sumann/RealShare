import prisma from '../src/lib/prisma';

async function main() {
  try {
    await prisma.$queryRaw`DELETE FROM premium_services`;
    console.log('Cleared premium_services');
  } catch (e) {
    console.error(e);
  }
}

main();
