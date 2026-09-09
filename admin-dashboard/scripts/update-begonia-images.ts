import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find the begonia property
  const properties = await prisma.property.findMany({
    where: {
      title: {
        contains: 'begonia',
        mode: 'insensitive',
      },
    },
  });

  if (properties.length === 0) {
    console.log('No property found with title containing "begonia"');
    return;
  }

  const begonia = properties[0];
  console.log(`Found property: ${begonia.title} (ID: ${begonia.id})`);

  const imageNames = [
    'image3.png', 'image4.png', 'image5.png', 'image6.png', 'image7.png',
    'image8.png', 'image9.png', 'image10.png', 'image11.png', 'image12.png',
    'image13.png', 'image14.png', 'image15.png', 'image16.png', 'image17.png'
  ];

  // Delete existing images for this property
  await prisma.propertyImage.deleteMany({
    where: { property_id: begonia.id }
  });

  // Create new images
  for (let i = 0; i < imageNames.length; i++) {
    const isPrimary = imageNames[i] === 'image11.png'; // Make image11 the primary image
    await prisma.propertyImage.create({
      data: {
        property_id: begonia.id,
        image_url: `/uploads/begonia/${imageNames[i]}`,
        is_primary: isPrimary
      }
    });
  }

  console.log('Successfully updated images for', begonia.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
