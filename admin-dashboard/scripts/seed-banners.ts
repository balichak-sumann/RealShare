import prisma from '../src/lib/prisma';

const BANNERS = [
  {
    title: 'Premium Residential Homes',
    subtitle: 'Own a premium residential home, your dream home search starts here.',
    image_url: '/banners/residential.png',
    link_url: '/(tabs)/search?filter=residential',
    sort_order: 1,
    is_active: true
  },
  {
    title: 'High-Yield Commercial Spaces',
    subtitle: 'Institutional grade assets now accessible to retail investors.',
    image_url: '/banners/commercial.png',
    link_url: '/(tabs)/search?filter=commercial',
    sort_order: 2,
    is_active: true
  },
  {
    title: 'Fractional Ownership',
    subtitle: 'Co - own a piece of Premium  Realestate, start investing in Fractional ownership today.',
    image_url: '/banners/fractional.png',
    link_url: '/(tabs)/search?filter=fractional',
    sort_order: 3,
    is_active: true
  },
  {
    title: 'Investor Exclusives',
    subtitle: 'Pre-launch and off-market deals for verified investors.',
    image_url: '/banners/investor.png',
    link_url: '/(tabs)/search?filter=investor',
    sort_order: 4,
    is_active: true
  },
  {
    title: 'Plots & Farms',
    subtitle: 'Secure premium agricultural land and farm plots for your future.',
    image_url: '/banners/plots.png',
    link_url: '/(tabs)/search?filter=plots-farms',
    sort_order: 5,
    is_active: true
  },
  {
    title: 'Luxury Holiday Homes',
    subtitle: 'Earn passive income while enjoying exclusive access.',
    image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2560&auto=format&fit=crop',
    link_url: '/(tabs)/search?filter=holiday',
    sort_order: 6,
    is_active: true
  }
];

async function main() {
  console.log('🗑️ Deleting old banners...');
  await prisma.banner.deleteMany({});

  console.log('🌱 Seeding new aligned banners...');
  for (const banner of BANNERS) {
    await prisma.banner.create({
      data: banner
    });
    console.log(`✅ Inserted: ${banner.title}`);
  }

  console.log('🎉 Successfully aligned all banners with the categories!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
