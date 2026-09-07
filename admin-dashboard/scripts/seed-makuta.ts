import prisma from '../src/lib/prisma';
import * as xlsx from 'xlsx';

const horizonImages = [
  "https://static.wixstatic.com/media/5d256e_b827830b5365439a9162beaaf6e6cb95~mv2.jpg/v1/fill/w_980%2Ch_653%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_b827830b5365439a9162beaaf6e6cb95~mv2.jpg",
  "https://static.wixstatic.com/media/5d256e_563ca2fcaeba4f6cb9468c79d4e15891~mv2.jpg/v1/crop/x_0%2Cy_176%2Cw_1319%2Ch_1411/fill/w_490%2Ch_525%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/Apartment%20pic%20New.jpg",
  "https://static.wixstatic.com/media/5d256e_0dfc9f2423bf4772a828149217dd8610~mv2.jpeg/v1/fill/w_980%2Ch_490%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_0dfc9f2423bf4772a828149217dd8610~mv2.jpeg",
  "https://static.wixstatic.com/media/5d256e_0e7ffef925be4f80903ff3b0f458a6c7~mv2.jpg/v1/fill/w_980%2Ch_754%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_0e7ffef925be4f80903ff3b0f458a6c7~mv2.jpg",
  "https://static.wixstatic.com/media/5d256e_9f12a628d89c4b868da292b24f193646~mv2.png/v1/crop/x_40%2Cy_56%2Cw_923%2Ch_934/fill/w_490%2Ch_496%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/makuta_horizon%20%20MAp.png",
  "https://static.wixstatic.com/media/5d256e_6b63078bcbd34a15b0bfb644bdd2f88b~mv2.png/v1/fill/w_980%2Ch_1072%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_6b63078bcbd34a15b0bfb644bdd2f88b~mv2.png",
  "https://static.wixstatic.com/media/5d256e_8d2198646e444b94bbcf217878f71c99~mv2.png/v1/fill/w_980%2Ch_884%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_8d2198646e444b94bbcf217878f71c99~mv2.png",
  "https://static.wixstatic.com/media/5d256e_ba20b14bf999418b80429ced5b6dbfa9~mv2.png/v1/fill/w_980%2Ch_801%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_ba20b14bf999418b80429ced5b6dbfa9~mv2.png",
  "https://static.wixstatic.com/media/5d256e_6948ea809666487d9bed9a2f3efbdf12~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_6948ea809666487d9bed9a2f3efbdf12~mv2.png",
  "https://static.wixstatic.com/media/5d256e_8afa0eee5eaa48b1b65765f77cb2175a~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_8afa0eee5eaa48b1b65765f77cb2175a~mv2.png",
  "https://static.wixstatic.com/media/5d256e_eafc976bfede464797bab7a6655d14a1~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_eafc976bfede464797bab7a6655d14a1~mv2.png",
  "https://static.wixstatic.com/media/5d256e_2762ee6e6422463db42fb71c70a220c5~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_2762ee6e6422463db42fb71c70a220c5~mv2.png",
  "https://static.wixstatic.com/media/5d256e_91a19e8af87a4b379aea3136bd745f4e~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_91a19e8af87a4b379aea3136bd745f4e~mv2.png",
  "https://static.wixstatic.com/media/5d256e_c90de09100b646bbba9d281c9a1566d4~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_c90de09100b646bbba9d281c9a1566d4~mv2.png",
  "https://static.wixstatic.com/media/5d256e_d0be6fb021094dc388bebc83badfbb6e~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_d0be6fb021094dc388bebc83badfbb6e~mv2.png",
  "https://static.wixstatic.com/media/5d256e_037a51f531b8416d8cb00430ab1f6b0c~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_037a51f531b8416d8cb00430ab1f6b0c~mv2.png",
  "https://static.wixstatic.com/media/5d256e_367dc38362384cbb8ead4892fdc796a3~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_367dc38362384cbb8ead4892fdc796a3~mv2.png",
  "https://static.wixstatic.com/media/5d256e_ed63cdf7f4664c08bfebc389fafe9b0f~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_ed63cdf7f4664c08bfebc389fafe9b0f~mv2.png",
  "https://static.wixstatic.com/media/5d256e_1430e6f11c48410ab00abe8f95ce39ef~mv2.png/v1/fill/w_128%2Ch_128%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/5d256e_1430e6f11c48410ab00abe8f95ce39ef~mv2.png",
  "https://static.wixstatic.com/media/5d256e_34881b1b939e4cb69b38c80a6b16cff4~mv2.jpg/v1/fill/w_980%2Ch_544%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_34881b1b939e4cb69b38c80a6b16cff4~mv2.jpg",
  "https://static.wixstatic.com/media/5d256e_075c78179b9f4dd59a6b422a574d0250~mv2.jpg/v1/fill/w_980%2Ch_490%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_075c78179b9f4dd59a6b422a574d0250~mv2.jpg",
  "https://static.wixstatic.com/media/5d256e_4fd06f4edd6a46f893369c4f87db3317~mv2.jpg/v1/fill/w_980%2Ch_544%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_4fd06f4edd6a46f893369c4f87db3317~mv2.jpg",
  "https://static.wixstatic.com/media/5d256e_193484b263ca43428c143ad4987f1a19~mv2.jpeg/v1/fill/w_980%2Ch_666%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_193484b263ca43428c143ad4987f1a19~mv2.jpeg",
  "https://static.wixstatic.com/media/5d256e_94bdaf2456494871b8d249d379488b44~mv2.jpg/v1/fill/w_980%2Ch_784%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_94bdaf2456494871b8d249d379488b44~mv2.jpg",
  "https://static.wixstatic.com/media/5d256e_bda86effbe114b9a8f7289738aaa5737~mv2.jpeg/v1/fill/w_980%2Ch_488%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/5d256e_bda86effbe114b9a8f7289738aaa5737~mv2.jpeg",
  "https://static.wixstatic.com/media/5d256e_c809ea3a0041431c8402756301713642~mv2.png/v1/fill/w_600%2Ch_621%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/map.png"
];

const nirvanaImages = [
  "https://makutanirvana.in/assets/renders/outdoor-1.jpg",
  "https://makutanirvana.in/assets/renders/outdoor-2.jpg",
  "https://makutanirvana.in/assets/renders/outdoor-3.jpg",
  "https://makutanirvana.in/assets/renders/outdoor-4.jpg",
  "https://makutanirvana.in/assets/renders/outdoor-5.jpg",
  "https://makutanirvana.in/assets/renders/indoor-1.jpg",
  "https://makutanirvana.in/assets/renders/indoor-2.jpg",
  "https://makutanirvana.in/assets/renders/indoor-3.jpg",
  "https://makutanirvana.in/assets/renders/indoor-4.jpg",
  "https://makutanirvana.in/assets/renders/indoor-5.jpg",
  "https://makutanirvana.in/assets/renders/clubhouse-1.jpg",
  "https://makutanirvana.in/assets/renders/clubhouse-2.jpg",
  "https://makutanirvana.in/assets/renders/clubhouse-3.jpg",
  "https://makutanirvana.in/assets/renders/clubhouse-4.jpg",
  "https://makutanirvana.in/assets/renders/clubhouse-alt-pool-day.jpg",
  "https://makutanirvana.in/assets/renders/clubhouse-alt-gym.jpg",
  "https://makutanirvana.in/assets/renders/clubhouse-alt-badminton.jpg"
];

async function seedMakuta() {
  console.log('Seeding Makuta properties from Excel...');
  
  // 1. Ensure Developer exists
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

  // 2. Parse Excel
  const workbook = xlsx.readFile('/Users/indusinnovate/.gemini/antigravity-ide/brain/a692d308-a76f-4621-aa2b-aed0a51807e0/scratch/makuta/Makuta_Developers_COMPLETE_Public_Extraction/Makuta_Developers_COMPLETE_Database.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const properties = xlsx.utils.sheet_to_json(sheet) as any[];

  let insertedCount = 0;

  for (const row of properties) {
    const title = row['Project'];
    if (!title) continue;

    // Check if property exists
    const existing = await prisma.property.findFirst({
      where: { title }
    });

    if (existing) {
      console.log(`Skipping ${title}, already exists.`);
      continue;
    }

    let locality = 'Hyderabad';
    const locField = row['Location'];
    if (locField) {
      locality = String(locField).split(',')[0].trim();
    }

    const newProperty = await prisma.property.create({
      data: {
        title: title,
        description: row['Full Description'] || '',
        property_type: row['Category'] || 'Residential',
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

    // Add Images if it is Horizon or Nirvana
    if (title.toLowerCase().includes('horizon')) {
      for (const [index, url] of horizonImages.entries()) {
        await prisma.propertyImage.create({
          data: {
            property_id: newProperty.id,
            image_url: url,
            is_primary: index === 0
          }
        });
      }
      console.log(`Attached ${horizonImages.length} images to ${title}`);
    } else if (title.toLowerCase().includes('nirvana')) {
      for (const [index, url] of nirvanaImages.entries()) {
        await prisma.propertyImage.create({
          data: {
            property_id: newProperty.id,
            image_url: url,
            is_primary: index === 0
          }
        });
      }
      console.log(`Attached ${nirvanaImages.length} images to ${title}`);
    }
  }

  console.log(`\nSuccess! Inserted ${insertedCount} new properties.`);
}

seedMakuta()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
