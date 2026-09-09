import prisma from '../src/lib/prisma';
import * as fs from 'fs';

async function seedRemainingImages() {
  console.log('Seeding remaining Makuta images...');

  const csvPath = '/Users/indusinnovate/Downloads/makuta-images/Makuta_ALL_10_Properties_Image_Index.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
  
  // Skip header
  lines.shift();

  let insertedCount = 0;
  let missingProjects = new Set<string>();

  for (const line of lines) {
    // Split by comma, but be careful with commas in URLs or names.
    // Fortunately the format looks fairly simple:
    // Project,Image / Gallery Item,Direct Image URL (verified),Image / Gallery Source Page,Source Type
    const parts = line.split(',');
    const project = parts[0];
    const url = parts[2];
    
    if (!project || !url || !url.startsWith('http')) {
      continue;
    }

    // Skip Horizon and Nirvana as we already seeded them
    if (project.includes('Horizon') || project.includes('Nirvana')) {
      continue;
    }

    const property = await prisma.property.findFirst({
      where: { title: project }
    });

    if (!property) {
      missingProjects.add(project);
      continue;
    }

    // Check if we already have images for this property to set is_primary
    const existingImages = await prisma.propertyImage.count({
      where: { property_id: property.id }
    });

    const isPrimary = existingImages === 0;

    await prisma.propertyImage.create({
      data: {
        property_id: property.id,
        image_url: url,
        is_primary: isPrimary
      }
    });

    console.log(`Attached image to ${project}`);
    insertedCount++;
  }

  console.log(`\nSuccessfully attached ${insertedCount} new images!`);
  if (missingProjects.size > 0) {
    console.log('Could not find these properties in DB:', Array.from(missingProjects));
  }
}

seedRemainingImages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
