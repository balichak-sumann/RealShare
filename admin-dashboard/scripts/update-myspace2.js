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
  const propertyId = "39297060-8d15-447e-a184-6871878f3e35"; // Makuta MySpace2 ID
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });

  if (!property) {
    console.log("Property not found!");
    return;
  }

  console.log("Found property:", property.title, property.id);

  // Images directory
  const destDir = path.join(__dirname, '../public/uploads/myspace2');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy images
  const srcDir = '/tmp/myspace2_images';
  const files = fs.readdirSync(srcDir);
  const validImages = files.filter(f => {
    const p = path.join(srcDir, f);
    return fs.statSync(p).size > 102400 && f.endsWith('.png'); // > 100KB to ensure high quality
  });

  const imageUrls = validImages.map((f, i) => {
    const newName = `myspace2-${i+1}.png`;
    fs.copyFileSync(path.join(srcDir, f), path.join(destDir, newName));
    return `/uploads/myspace2/${newName}`;
  });

  console.log("Extracted images:", imageUrls);
  
  // Format as objects { image_url: "..." }
  const formattedImages = imageUrls.map(url => ({ image_url: url }));

  await prisma.property.update({
    where: { id: propertyId },
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
