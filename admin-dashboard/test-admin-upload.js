const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Creating test properties with Capitalized property_type...");

  const prop1 = await prisma.property.create({
    data: {
      title: "Admin Test Commercial Hub",
      description: "A premium commercial hub created to test the Admin UI capital letter bug.",
      property_type: "Commercial", // Capital C
      listing_type: "fractional",
      total_fractions: 100,
      available_fractions: 100,
      price_per_fraction: 500000,
      state: "Telangana",
      district: "Hyderabad",
      locality: "HITEC City",
      approval_status: "approved",
      images: {
        create: {
          image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800",
          is_primary: true
        }
      }
    }
  });

  const prop2 = await prisma.property.create({
    data: {
      title: "Admin Test Residential Villa",
      description: "A luxury residential villa created to test the Admin UI capital letter bug.",
      property_type: "Residential", // Capital R
      listing_type: "outright",
      total_fractions: 1,
      available_fractions: 1,
      price_per_fraction: 25000000,
      state: "Telangana",
      district: "Hyderabad",
      locality: "Jubilee Hills",
      approval_status: "approved",
      images: {
        create: {
          image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800",
          is_primary: true
        }
      }
    }
  });

  console.log("Success! Created 2 test properties.");
  console.log("- " + prop1.title + " (" + prop1.property_type + ")");
  console.log("- " + prop2.title + " (" + prop2.property_type + ")");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
