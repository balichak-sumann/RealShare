import { Pool } from 'pg';
import { config } from 'dotenv';
config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Find begonia property
    const res = await pool.query(`SELECT id, title FROM properties WHERE title ILIKE '%begonia%' LIMIT 1`);
    if (res.rows.length === 0) {
      console.log('No begonia property found');
      return;
    }

    const begonia = res.rows[0];
    console.log(`Found property: ${begonia.title} (ID: ${begonia.id})`);

    const imageNames = [
      'image3.png', 'image4.png', 'image5.png', 'image6.png', 'image7.png',
      'image8.png', 'image9.png', 'image10.png', 'image11.png', 'image12.png',
      'image13.png', 'image14.png', 'image15.png', 'image16.png', 'image17.png'
    ];

    // Delete old images
    await pool.query(`DELETE FROM property_images WHERE property_id = $1`, [begonia.id]);

    // Insert new images
    for (let i = 0; i < imageNames.length; i++) {
      const isPrimary = imageNames[i] === 'image11.png';
      await pool.query(
        `INSERT INTO property_images (id, property_id, image_url, is_primary, created_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
        [begonia.id, `/uploads/begonia/${imageNames[i]}`, isPrimary]
      );
    }
    
    console.log('Successfully updated images!');
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
