import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  await prisma.property.deleteMany()

  const properties = [
    {
      title: 'Skyline Heights',
      description: 'A premium commercial office space in the heart of Gachibowli, featuring modern amenities and guaranteed tenants.',
      property_type: 'commercial',
      total_fractions: 10000,
      available_fractions: 4250,
      sold_fractions: 5750,
      price_per_fraction: 12500,
      booking_amount: 50000,
      assured_yield: 12.0,
      target_irr: 18.5,
      state: 'Telangana',
      district: 'Hyderabad',
      locality: 'Gachibowli',
      lat: 17.4401,
      lng: 78.3489,
      featured: true,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', is_primary: true }
        ]
      }
    },
    {
      title: 'Green Valley Villas',
      description: 'Exclusive holiday villas in Kokapet offering high rental yields and weekend getaway benefits.',
      property_type: 'holiday',
      total_fractions: 5000,
      available_fractions: 1200,
      sold_fractions: 3800,
      price_per_fraction: 25000,
      booking_amount: 100000,
      assured_yield: 9.5,
      target_irr: 15.0,
      state: 'Telangana',
      district: 'Hyderabad',
      locality: 'Kokapet',
      lat: 17.3940,
      lng: 78.3370,
      featured: true,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', is_primary: true }
        ]
      }
    },
    {
      title: 'Urban Elite IT Park',
      description: 'Grade-A IT park space in Financial District. Pre-leased to Fortune 500 companies.',
      property_type: 'commercial',
      total_fractions: 20000,
      available_fractions: 15000,
      sold_fractions: 5000,
      price_per_fraction: 10000,
      booking_amount: 50000,
      assured_yield: 10.5,
      target_irr: 16.2,
      state: 'Telangana',
      district: 'Hyderabad',
      locality: 'Financial District',
      lat: 17.4156,
      lng: 78.3424,
      featured: false,
      images: {
        create: [
          { image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', is_primary: true }
        ]
      }
    }
  ]

  for (const prop of properties) {
    await prisma.property.create({
      data: prop
    })
  }

  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
