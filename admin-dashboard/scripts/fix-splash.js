import sharp from 'sharp';
import path from 'path';

const logoPath = '/Users/indusinnovate/Desktop/RealShare/android-app/assets/images/realshare-logo.png';
const outPath = '/Users/indusinnovate/Desktop/RealShare/android-app/assets/images/splash-icon.png';

async function main() {
  // Create a proper 288x288 splash icon with the RealShare logo on a white background.
  // Android 12+ SplashScreen API requires a real, visible, reasonably-sized image.
  const logo = await sharp(logoPath)
    .resize({ width: 220, height: 220, fit: 'inside' })
    .toBuffer();

  // White background canvas
  const bg = Buffer.from(`
    <svg width="288" height="288" viewBox="0 0 288 288" xmlns="http://www.w3.org/2000/svg">
      <rect width="288" height="288" fill="#FFFFFF"/>
    </svg>
  `);

  await sharp(bg)
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(outPath);

  console.log('Created proper splash-icon.png (288x288 with logo on white bg)');
}

main().catch(console.error);
