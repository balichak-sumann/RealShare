const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminProfile = await prisma.profile.findFirst({ where: { role: 'admin' } });
  const adminId = adminProfile ? adminProfile.id : 'test-admin-id';

  const props = [
    {
      title: 'Global Tech Park',
      description: 'Prime commercial office space in the heart of the IT corridor.',
      property_type: 'commercial',
      listing_type: 'resale',
      price: 50000000,
      total_fractions: 1,
      available_fractions: 1,
      price_per_fraction: 50000000,
      locality: 'Whitefield',
      district: 'Bengaluru',
      state: 'Karnataka',
      approval_status: 'approved',
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
      owner_id: adminId
    },
    {
      title: 'Prestige Lakeside Habitat',
      description: 'Luxury 4BHK villa with lake view.',
      property_type: 'residential',
      listing_type: 'resale',
      price: 35000000,
      total_fractions: 1,
      available_fractions: 1,
      price_per_fraction: 35000000,
      locality: 'Varthur',
      district: 'Bengaluru',
      state: 'Karnataka',
      approval_status: 'approved',
      image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
      owner_id: adminId
    },
    {
      title: 'Mindspace IT Park',
      description: 'Premium grade A office spaces.',
      property_type: 'commercial',
      listing_type: 'resale',
      price: 80000000,
      total_fractions: 1,
      available_fractions: 1,
      price_per_fraction: 80000000,
      locality: 'HITEC City',
      district: 'Hyderabad',
      state: 'Telangana',
      approval_status: 'approved',
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
      owner_id: adminId
    }
  ];

  for (const p of props) {
    const res = await prisma.property.create({ data: p });
    console.log('Created:', res.title, 'in', res.district);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
