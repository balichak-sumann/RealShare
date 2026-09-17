import prisma from './src/lib/prisma';

async function main() {
  const users = await prisma.profile.findMany({
    where: {
      OR: [
        { phone_number: { contains: '6302662448' } },
        { id: { contains: '6302662448' } }
      ]
    }
  });

  if (users.length > 0) {
    console.log(JSON.stringify(users, null, 2));
  } else {
    console.log('No users found with phone number 6302662448.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
