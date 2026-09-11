import prisma from '../src/lib/prisma';

async function main() {
  const allowedMakuta = [
    'makuta horizon', 'makuta nirvana', 'makuta greenwoods', 'makuta taranga',
    'makuta prime', 'makuta aruna arcade', 'makuta mall'
  ];

  const allProps = await prisma.property.findMany();
  
  let count = 0;
  for (const prop of allProps) {
    if (prop.title && allowedMakuta.includes(prop.title.toLowerCase())) {
      await prisma.property.update({
        where: { id: prop.id },
        data: { featured: true }
      });
      console.log(`Updated ${prop.title} to featured`);
      count++;
    }
  }
  console.log(`Successfully updated ${count} properties.`);
}

main().catch(e => console.error(e));
