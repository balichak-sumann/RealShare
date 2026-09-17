import prisma from '../src/lib/prisma';

async function main() {
  console.log('Fetching developers...');
  const developers = await prisma.developer.findMany();
  console.log('Found developers:', developers.length);

  const makuta = developers.find(d => d.name.toLowerCase().includes('makuta'));
  if (!makuta) {
    console.log('Makuta Developers not found! Current developers:');
    console.log(developers.map(d => d.name));
    return;
  }

  console.log('Found Makuta Developers with ID:', makuta.id);

  const otherDevs = developers.filter(d => d.id !== makuta.id);
  console.log('Other developers to delete:', otherDevs.map(d => d.name));

  if (otherDevs.length === 0) {
    console.log('No other developers to delete.');
    return;
  }

  const otherDevIds = otherDevs.map(d => d.id);

  // 1. Unlink profiles
  const profilesResult = await prisma.profile.updateMany({
    where: { developer_id: { in: otherDevIds } },
    data: { developer_id: null }
  });
  console.log(`Unlinked ${profilesResult.count} profiles from other developers.`);

  // 2. Unlink properties
  const propertiesResult = await prisma.property.updateMany({
    where: { developer_id: { in: otherDevIds } },
    data: { developer_id: null }
  });
  console.log(`Unlinked ${propertiesResult.count} properties from other developers.`);

  // 3. Delete developers
  const deleteResult = await prisma.developer.deleteMany({
    where: { id: { in: otherDevIds } }
  });
  console.log(`Deleted ${deleteResult.count} developers.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit(0));
