import prisma from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function seedMakutaFinal() {
  console.log('--- Starting Final Makuta Database Seeding ---');

  // 1. Wipe existing properties
  console.log('Wiping existing properties...');
  await prisma.propertyImage.deleteMany({});
  await prisma.property.deleteMany({});
  console.log('Database properties wiped clean.');

  // 2. Ensure Developer exists
  let dev = await prisma.developer.findUnique({
    where: { name: 'Makuta Developers' }
  });
  
  if (!dev) {
    dev = await prisma.developer.create({
      data: {
        name: 'Makuta Developers',
        bio: 'Makuta Developers is a premier real estate developer focused on luxury properties.',
        established_year: 2010
      }
    });
  }

  const finalDir = '/Users/indusinnovate/Downloads/makuta-final';

  // 3. Parse Verified Image URLs
  console.log('Parsing ALL_VERIFIED_IMAGE_URLS.txt...');
  const imagesContent = fs.readFileSync(path.join(finalDir, 'ALL_VERIFIED_IMAGE_URLS.txt'), 'utf8');
  const imageLines = imagesContent.split('\n').map(l => l.trim());
  
  const projectImages: Record<string, string[]> = {};
  let currentProject = '';

  for (const line of imageLines) {
    if (line.startsWith('===') || line.length === 0 || line.includes('ALL VERIFIED IMAGE URLS')) {
      continue;
    }
    // If it doesn't start with http, it's likely a header (e.g. HORIZON)
    if (!line.startsWith('http')) {
      // It's a project name
      currentProject = line;
      projectImages[currentProject] = [];
    } else {
      if (currentProject) {
        projectImages[currentProject].push(line);
      }
    }
  }

  // 4. Parse PROJECT_INDEX.csv
  console.log('Parsing PROJECT_INDEX.csv...');
  const indexContent = fs.readFileSync(path.join(finalDir, 'PROJECT_INDEX.csv'), 'utf8');
  const indexLines = indexContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  indexLines.shift(); // remove header

  let insertedCount = 0;

  for (const row of indexLines) {
    const parts = row.split(',');
    const projectTitleRaw = parts[0]; // e.g. "Horizon" or "Makuta Mall"
    if (!projectTitleRaw) continue;

    const title = projectTitleRaw.includes('Makuta') ? projectTitleRaw : `Makuta ${projectTitleRaw}`;
    const category = parts[1];
    const infoFilePath = parts[3];

    // 5. Read Markdown file
    const mdPath = path.join(finalDir, infoFilePath);
    let mdContent = '';
    try {
      mdContent = fs.readFileSync(mdPath, 'utf8');
    } catch (e) {
      console.error(`Could not read ${mdPath}`);
      continue;
    }

    // Extract Description (Full information)
    let description = '';
    const descMatch = mdContent.match(/## Full information\n([\s\S]*?)(?=\n##|$)/);
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
    }

    // Extract Location
    let locality = 'Hyderabad';
    const locMatch = mdContent.match(/Location: (.*)/);
    if (locMatch && locMatch[1]) {
      const locStr = locMatch[1].trim();
      locality = locStr.split(',')[1]?.trim() || locStr.split(',')[0].trim();
    }

    const newProperty = await prisma.property.create({
      data: {
        title: title,
        description: description,
        property_type: category || 'Residential',
        listing_type: 'outright',
        total_fractions: 1,
        available_fractions: 1,
        price_per_fraction: 0,
        booking_amount: 0,
        state: 'Telangana',
        district: 'Hyderabad',
        locality: locality,
        developer_id: dev.id,
        approval_status: 'approved'
      }
    });

    console.log(`Created property: ${title}`);
    insertedCount++;

    // 6. Attach Images
    // Match the project key from ALL_VERIFIED_IMAGE_URLS.txt
    // For example, "Horizon" matches "HORIZON" or "Makuta Horizon"
    const matchingKey = Object.keys(projectImages).find(
      key => key.toLowerCase() === projectTitleRaw.toLowerCase() || title.toLowerCase().includes(key.toLowerCase())
    );

    if (matchingKey && projectImages[matchingKey]) {
      const urls = projectImages[matchingKey];
      for (const [index, url] of urls.entries()) {
        await prisma.propertyImage.create({
          data: {
            property_id: newProperty.id,
            image_url: url,
            is_primary: index === 0
          }
        });
      }
      console.log(`  -> Attached ${urls.length} images to ${title}`);
    } else {
      console.log(`  -> No images found for ${title}`);
    }
  }

  console.log(`\nSuccessfully inserted ${insertedCount} properties!`);
}

seedMakutaFinal()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
