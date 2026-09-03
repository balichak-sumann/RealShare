import 'dotenv/config';
import { createPrismaClient } from './db'

const prisma = createPrismaClient()

const demoProperties = [
  {
    title: 'Goa Beachfront Villa',
    description: 'A stunning luxury villa located just 200 meters from the pristine beaches of South Goa. This premium fractional ownership opportunity features 4 bedrooms, a private infinity pool, lush tropical gardens, and panoramic ocean views. The villa is professionally managed with premium amenities including a private chef service, spa facilities, and 24/7 concierge. Ideal for investors seeking high rental yields from the booming Goa tourism market. Expected annual occupancy rate of 75% with premium nightly rates during peak season.',
    property_type: 'holiday',
    total_fractions: 100,
    available_fractions: 33,
    sold_fractions: 67,
    price_per_fraction: 150000,
    booking_amount: 50000,
    assured_yield: 9.5,
    target_irr: 16.8,
    state: 'Goa',
    district: 'South Goa',
    locality: 'Benaulim Beach Road',
    full_address: 'Plot 42, Benaulim Beach Road, Salcete, South Goa, Goa 403716',
    lat: 15.2645,
    lng: 73.9285,
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    featured: true,
    images: [
      { image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', is_primary: true },
      { image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', is_primary: false },
    ],
  },
  {
    title: 'Cyber Pearl Tech Park',
    description: 'Premium Grade-A commercial office space in the heart of Hyderabad\'s HITEC City. This fully-leased IT park spans 50,000 sq ft across 3 floors with blue-chip tenants including Fortune 500 companies. Features include 24/7 power backup, high-speed fiber connectivity, modern HVAC systems, and IGBC Gold certification for sustainability. Located in the most sought-after commercial corridor with excellent metro connectivity and proximity to major IT hubs. Long-term lease agreements ensure stable and predictable rental income.',
    property_type: 'commercial',
    total_fractions: 200,
    available_fractions: 48,
    sold_fractions: 152,
    price_per_fraction: 500000,
    booking_amount: 100000,
    assured_yield: 8.2,
    target_irr: 14.5,
    state: 'Telangana',
    district: 'Hyderabad',
    locality: 'HITEC City, Madhapur',
    full_address: 'Survey No. 64, HITEC City Main Road, Madhapur, Hyderabad, Telangana 500081',
    lat: 17.4435,
    lng: 78.3772,
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    featured: true,
    images: [
      { image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', is_primary: true },
      { image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80', is_primary: false },
    ],
  },
  {
    title: 'Marina Bay Luxury Condo',
    description: 'An ultra-luxury 3BHK sea-facing condominium in Mumbai\'s most prestigious waterfront development. This 2,800 sq ft apartment boasts floor-to-ceiling windows with unobstructed Arabian Sea views, Italian marble flooring, a modular kitchen with Bosch appliances, and access to world-class amenities including a rooftop infinity pool, sky lounge, private theater, and residents-only spa. Located in Worli with direct sea link access, making it one of Mumbai\'s most coveted addresses. High capital appreciation potential driven by limited sea-facing inventory.',
    property_type: 'residential',
    total_fractions: 50,
    available_fractions: 20,
    sold_fractions: 30,
    price_per_fraction: 2500000,
    booking_amount: 500000,
    assured_yield: 6.8,
    target_irr: 18.2,
    state: 'Maharashtra',
    district: 'Mumbai',
    locality: 'Worli Sea Face',
    full_address: 'Tower B, Floor 28, Worli Sea Face Road, Worli, Mumbai, Maharashtra 400018',
    lat: 19.0048,
    lng: 72.8155,
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    featured: true,
    images: [
      { image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', is_primary: true },
      { image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', is_primary: false },
    ],
  },
  {
    title: 'Mountain View Resort & Spa',
    description: 'A boutique luxury resort nestled in the scenic hills of Shimla with breathtaking Himalayan views. This 20-room property features Swiss-chalet inspired architecture, each room with a private balcony overlooking snow-capped peaks. Amenities include a full-service Ayurvedic spa, multi-cuisine restaurant, heated indoor pool, and adventure sports facilities. The resort benefits from year-round tourism with peak seasons in summer and winter. Professional hospitality management ensures hassle-free ownership with quarterly rental payouts.',
    property_type: 'holiday',
    total_fractions: 80,
    available_fractions: 11,
    sold_fractions: 69,
    price_per_fraction: 200000,
    booking_amount: 50000,
    assured_yield: 10.2,
    target_irr: 15.5,
    state: 'Himachal Pradesh',
    district: 'Shimla',
    locality: 'Kufri Road',
    full_address: 'NH 22, Kufri Road, Near Fagu, Shimla, Himachal Pradesh 171012',
    lat: 31.1048,
    lng: 77.1734,
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    featured: true,
    images: [
      { image_url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80', is_primary: true },
      { image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', is_primary: false },
    ],
  },
  {
    title: 'Bangalore Startup Hub',
    description: 'A modern co-working and tech office space in Bangalore\'s thriving Koramangala district. This 35,000 sq ft property is designed for the new-age workforce with open floor plans, private cabins, meeting pods, a rooftop cafeteria, and high-speed dedicated internet. Currently 92% occupied with a diverse mix of funded startups and SMEs on 2-3 year leases. Located near the Koramangala 5th Block commercial hub with excellent connectivity to HSR Layout and Indiranagar. Strong demand from the tech ecosystem ensures minimal vacancy risk.',
    property_type: 'commercial',
    total_fractions: 150,
    available_fractions: 65,
    sold_fractions: 85,
    price_per_fraction: 350000,
    booking_amount: 75000,
    assured_yield: 9.0,
    target_irr: 15.0,
    state: 'Karnataka',
    district: 'Bangalore',
    locality: 'Koramangala',
    full_address: '5th Block, 80 Feet Road, Koramangala, Bangalore, Karnataka 560095',
    lat: 12.9352,
    lng: 77.6245,
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    featured: false,
    images: [
      { image_url: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80', is_primary: true },
      { image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80', is_primary: false },
    ],
  },
  {
    title: 'Jaipur Heritage Haveli',
    description: 'A beautifully restored 200-year-old heritage haveli in the heart of Jaipur\'s Pink City. This architectural masterpiece has been converted into a 15-room boutique heritage hotel while preserving its original Rajasthani craftsmanship including hand-painted frescoes, jharokha balconies, and intricate mirror work. The property features a central courtyard with a fountain, rooftop restaurant with Nahargarh Fort views, and curated cultural experiences for guests. Located near Hawa Mahal and City Palace, it attracts premium international tourists seeking authentic royal Rajasthan experiences.',
    property_type: 'holiday',
    total_fractions: 60,
    available_fractions: 42,
    sold_fractions: 18,
    price_per_fraction: 180000,
    booking_amount: 50000,
    assured_yield: 11.0,
    target_irr: 17.2,
    state: 'Rajasthan',
    district: 'Jaipur',
    locality: 'Pink City, Near Hawa Mahal',
    full_address: 'Gangapole Lane, Near Hawa Mahal, Pink City, Jaipur, Rajasthan 302002',
    lat: 26.9239,
    lng: 75.8267,
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    featured: false,
    images: [
      { image_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80', is_primary: true },
      { image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&q=80', is_primary: false },
      { image_url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80', is_primary: false },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding demo properties...\n');

  for (const prop of demoProperties) {
    const { images, ...propertyData } = prop;

    const created = await prisma.property.create({
      data: {
        ...propertyData,
        approval_status: 'approved',
        images: {
          create: images,
        },
      },
      include: { images: true },
    });

    console.log(`✅ Created: ${created.title} (${created.images.length} images)`);
  }

  console.log('\n🎉 Done! 6 demo properties seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
