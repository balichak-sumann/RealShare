import 'dotenv/config';
import { createPrismaClient } from './db'

const prisma = createPrismaClient()

const demoDevelopers = [
  {
    name: 'Prestige Group',
    bio: 'One of India\'s leading real estate developers, known for premium residential and commercial projects across major metros.',
    rating: 4.8,
    established_year: 1986,
    rera_registered: true,
  },
  {
    name: 'Lodha Group',
    bio: 'Luxury residential and mixed-use developer with a strong presence in Mumbai and other major cities.',
    rating: 4.7,
    established_year: 1980,
    rera_registered: true,
  },
  {
    name: 'Aparna Constructions',
    bio: 'Hyderabad-based developer known for gated community townships and quality construction.',
    rating: 4.9,
    established_year: 1996,
    rera_registered: true,
  },
  {
    name: 'My Home Group',
    bio: 'Prominent Hyderabad developer with landmark residential and commercial projects.',
    rating: 4.8,
    established_year: 1981,
    rera_registered: true,
  },
];

async function main() {
  for (const dev of demoDevelopers) {
    const created = await prisma.developer.upsert({
      where: { name: dev.name },
      update: dev,
      create: dev,
    });
    console.log(`✅ Upserted developer: ${created.name}`);
  }
  console.log(`\n🎉 Done! ${demoDevelopers.length} developers seeded successfully.`);
  console.log('Tip: run this after applying the schema migration (npx prisma db push).');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
