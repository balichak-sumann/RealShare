import prisma from './src/lib/prisma';

async function main() {
  const users = await prisma.profile.findMany({
    where: {
      phone_number: { not: null }
    }
  });

  const phoneCounts: Record<string, string[]> = {};
  for (const user of users) {
    if (user.phone_number) {
      if (!phoneCounts[user.phone_number]) {
        phoneCounts[user.phone_number] = [];
      }
      phoneCounts[user.phone_number].push(user.id);
    }
  }

  const duplicates = Object.entries(phoneCounts).filter(([_, ids]) => ids.length > 1);
  if (duplicates.length > 0) {
    console.log('Found duplicates:');
    console.log(JSON.stringify(duplicates, null, 2));
  } else {
    console.log('No duplicates found.');
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
