const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

process.env.DATABASE_URL = "postgresql://indusinnovate:VXpHjQItUpG7lOJSbDkFJTNMKfsmvZCY@dpg-dad7lnqjnfac73ept4tg-a.oregon-postgres.render.com/realshare_qn3n?sslmode=require&connection_limit=5";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const properties = await prisma.property.findMany({
    where: {
      title: 'Makuta MySpace'
    }
  });

  if (properties.length === 0) {
    console.log("Property not found!");
    return;
  }

  const myspace = properties[0];
  console.log("Found property:", myspace.title, myspace.id);

  // Clear images for Makuta MySpace2 as well since it was mistakenly updated
  await prisma.property.update({
    where: { id: "39297060-8d15-447e-a184-6871878f3e35" }, // ID of Makuta MySpace2
    data: {
      images: {
        deleteMany: {}
      }
    }
  });


  // Images directory
  const destDir = path.join(__dirname, '../public/uploads/myspace');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy images
  const srcDir = '/tmp/myspace_brochure/word/media';
  const files = fs.readdirSync(srcDir);
  const validImages = files.filter(f => {
    const p = path.join(srcDir, f);
    return fs.statSync(p).size > 10240; // > 10KB to filter out tiny invalid images
  });

  const imageUrls = validImages.map((f, i) => {
    const newName = `myspace-${i+1}.png`;
    fs.copyFileSync(path.join(srcDir, f), path.join(destDir, newName));
    return `/uploads/myspace/${newName}`;
  });

  console.log("Extracted images:", imageUrls);
  
  // Format as objects { image_url: "..." }
  const formattedImages = imageUrls.map(url => ({ image_url: url }));

  await prisma.property.update({
    where: { id: myspace.id },
    data: {
      images: {
        deleteMany: {},
        create: formattedImages
      }
    }
  });

  console.log("Successfully updated property images in production DB.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
