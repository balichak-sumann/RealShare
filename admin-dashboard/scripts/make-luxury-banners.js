import sharp from 'sharp';
import path from 'path';

const bgPath = '/Users/indusinnovate/.gemini/antigravity-ide/brain/a692d308-a76f-4621-aa2b-aed0a51807e0/realshare_luxury_banner_1788777544399.jpg';
const logoPath = '/Users/indusinnovate/Desktop/RealShare/android-app/assets/images/realshare-logo.png';
const outDir = '/Users/indusinnovate/Desktop/playstore-assets';

async function createBanners() {
  console.log('Processing luxury architectural feature banners (1024x500)...');

  // 1. Pure Luxury Photographic Banner (1024 x 500, no text - stunning modern city skyline)
  await sharp(bgPath)
    .resize(1024, 500, { fit: 'cover', position: 'center' })
    .png({ quality: 95 })
    .toFile(path.join(outDir, 'feature-graphic-luxury-pure.png'));
  console.log('Created feature-graphic-luxury-pure.png');

  // 2. Branded Luxury Banner (1024 x 500 with sleek dark gradient vignette + gold RealShare branding)
  const resizedBg = await sharp(bgPath)
    .resize(1024, 500, { fit: 'cover', position: 'center' })
    .toBuffer();

  const logoBuffer = await sharp(logoPath)
    .resize({ width: 220, height: 120, fit: 'inside' })
    .toBuffer();

  const overlaySvg = Buffer.from(`
    <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0B132B" stop-opacity="0.92"/>
          <stop offset="45%" stop-color="#0B132B" stop-opacity="0.75"/>
          <stop offset="75%" stop-color="#0B132B" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#0B132B" stop-opacity="0.05"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="50%" stop-color="#FCD34D" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>

      <!-- Gradient overlay on the left -->
      <rect width="1024" height="500" fill="url(#scrim)"/>

      <!-- Text Branding -->
      <text x="70" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="48" font-weight="800" fill="#FFFFFF" letter-spacing="1.5">RealShare</text>
      <text x="70" y="285" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="url(#gold)">Prime Real Estate Investments</text>
      <text x="70" y="325" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="400" fill="#CBD5E1">Curated High-Yield Commercial &amp; Residential Assets</text>

      <!-- Luxury tag badge -->
      <g transform="translate(70, 365)">
        <rect width="165" height="34" rx="17" fill="rgba(245, 158, 11, 0.2)" stroke="#F59E0B" stroke-width="1.2"/>
        <text x="82" y="22" font-family="sans-serif" font-size="12" font-weight="700" fill="#FDE68A" text-anchor="middle">★ RERA VERIFIED</text>
      </g>
    </svg>
  `);

  await sharp(resizedBg)
    .composite([
      { input: overlaySvg, top: 0, left: 0 },
    ])
    .png({ quality: 95 })
    .toFile(path.join(outDir, 'feature-graphic-1024x500.png'));
  console.log('Updated feature-graphic-1024x500.png with luxury architectural backdrop');
}

createBanners().catch(console.error);
