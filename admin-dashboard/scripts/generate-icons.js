import sharp from 'sharp';
import path from 'path';

async function main() {
  const sourceImage = '../android-app/assets/images/realshare-logo.png';
  const adaptiveIconPath = '../android-app/assets/images/adaptive-icon.png';
  const splashIconPath = '../android-app/assets/images/splash-icon.png';

  // 1. Create adaptive-icon.png (padded logo)
  // Adaptive icons are 108dp x 108dp, with a 72dp safe zone.
  // We'll create a 1024x1024 image, and composite the logo resized to 600x600 in the center.
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    {
      input: await sharp(sourceImage).resize(600, 600, { fit: 'inside' }).toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(adaptiveIconPath);

  console.log('Created adaptive-icon.png');

  // 2. Create splash-icon.png (200x200 fully transparent)
  await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .png()
  .toFile(splashIconPath);

  console.log('Created splash-icon.png');
}

main().catch(console.error);
