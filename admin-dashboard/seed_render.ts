import prisma from './src/lib/prisma';

async function main() {
  console.log('Seeding Render database with luxury properties...');

  // Create an admin profile if we want a posted_by reference
  const adminId = 'seed-admin-123';
  await prisma.profile.upsert({
    where: { id: adminId },
    update: {},
    create: {
      id: adminId,
      full_name: 'RealShare Admin',
      email: 'admin@realshare.in',
      role: 'admin',
    },
  });

  const properties = [
    {
      title: 'The Lodha Bel Air Penthouse',
      description: 'Ultra-luxury 4BHK penthouse with a private pool and panoramic views of the Arabian Sea. Managed by Taj Hospitality.',
      property_type: 'Penthouse',
      total_fractions: 100,
      available_fractions: 85,
      price_per_fraction: 2500000,
      booking_amount: 100000,
      assured_yield: 8.5,
      target_irr: 14.2,
      state: 'Maharashtra',
      district: 'Mumbai',
      locality: 'Worli',
      featured: true,
      approval_status: 'approved',
      posted_by: adminId,
      images: [
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop'
      ]
    },
    {
      title: 'Prestige Golfshire Villa',
      description: 'Exclusive 5BHK villa set within a 275-acre premium golf resort. Comes with club membership and 24/7 concierge.',
      property_type: 'Villa',
      total_fractions: 50,
      available_fractions: 12,
      price_per_fraction: 1500000,
      booking_amount: 50000,
      assured_yield: 7.2,
      target_irr: 12.5,
      state: 'Karnataka',
      district: 'Bangalore',
      locality: 'Nandi Hills',
      featured: true,
      approval_status: 'approved',
      posted_by: adminId,
      images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop'
      ]
    },
    {
      title: 'DLF Camellias Apartment',
      description: 'Sprawling 7000 sq.ft ultra-luxury apartment facing the DLF Golf and Country Club.',
      property_type: 'Apartment',
      total_fractions: 200,
      available_fractions: 150,
      price_per_fraction: 1000000,
      booking_amount: 50000,
      assured_yield: 6.8,
      target_irr: 11.0,
      state: 'Haryana',
      district: 'Gurgaon',
      locality: 'Golf Course Road',
      featured: true,
      approval_status: 'approved',
      posted_by: adminId,
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop'
      ]
    },
    {
      title: 'Oberoi Exquisite High-Rise',
      description: 'Premium 3BHK high-rise apartment offering stunning city skyline views and exclusive Aarey colony greenery.',
      property_type: 'Apartment',
      total_fractions: 100,
      available_fractions: 100,
      price_per_fraction: 850000,
      booking_amount: 25000,
      assured_yield: 7.0,
      target_irr: 10.5,
      state: 'Maharashtra',
      district: 'Mumbai',
      locality: 'Goregaon East',
      featured: false,
      approval_status: 'approved',
      posted_by: adminId,
      images: [
        'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=1200&auto=format&fit=crop'
      ]
    }
  ];

  for (const prop of properties) {
    const { images, ...data } = prop;
    
    // Check if property exists to avoid duplicates on re-run
    const existing = await prisma.property.findFirst({ where: { title: prop.title } });
    if (!existing) {
      await prisma.property.create({
        data: {
          ...data,
          images: {
            create: images.map((url, i) => ({
              image_url: url,
              is_primary: i === 0
            }))
          }
        }
      });
      console.log(`Created property: ${prop.title}`);
    } else {
      console.log(`Property already exists: ${prop.title}`);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
