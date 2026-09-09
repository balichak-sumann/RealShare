import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/indusinnovate/Desktop/playstore-assets';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('Generating Play Store visual assets...');

  // 1. App Icon: 512 x 512 px PNG (max 1MB)
  // Google Play app icon specifications: 512x512, fully opaque (white background recommended for clean display)
  const logoPath = '/Users/indusinnovate/Desktop/RealShare/android-app/assets/images/realshare-logo.png';
  
  // Resize logo nicely to fit within ~360x360 box
  const logoResized = await sharp(logoPath)
    .resize({ width: 380, height: 380, fit: 'inside' })
    .toBuffer();

  const iconSvgBackground = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#FFFFFF"/>
    </svg>
  `);

  await sharp(iconSvgBackground)
    .composite([{ input: logoResized, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, 'app-icon-512x512.png'));
  console.log('Created app-icon-512x512.png');

  // 2. Feature Graphic: 1024 x 500 px PNG (no alpha, max 15MB)
  // Modern, sleek gradient with RealShare branding, gold accents, and property tagline
  const featureLogo = await sharp(logoPath)
    .resize({ width: 280, height: 160, fit: 'inside' })
    .toBuffer();

  const featureSvg = Buffer.from(`
    <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="50%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#0B132B" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="50%" stop-color="#FBBF24" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.08)" />
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.02)" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1024" height="500" fill="url(#bgGrad)" />

      <!-- Subtle background architectural lines / glow -->
      <circle cx="850" cy="250" r="320" fill="#3B82F6" opacity="0.08" filter="blur(60px)" />
      <circle cx="200" cy="400" r="280" fill="#F59E0B" opacity="0.06" filter="blur(80px)" />

      <!-- RealShare Typography / Badge -->
      <text x="80" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#FFFFFF" letter-spacing="1">RealShare</text>
      
      <text x="80" y="285" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="url(#goldGrad)">Prime Real Estate &amp; Fractional Investments</text>
      
      <text x="80" y="330" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="400" fill="#94A3B8">Verified Developers • High Rental Yields • Seamless Site Visits</text>

      <!-- Badges on the left -->
      <g transform="translate(80, 370)">
        <rect width="140" height="38" rx="19" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" stroke-width="1.5" />
        <text x="70" y="24" font-family="sans-serif" font-size="13" font-weight="700" fill="#FBBF24" text-anchor="middle">★ Verified RERA</text>

        <rect x="155" width="160" height="38" rx="19" fill="rgba(59, 130, 246, 0.15)" stroke="#3B82F6" stroke-width="1.5" />
        <text x="235" y="24" font-family="sans-serif" font-size="13" font-weight="700" fill="#60A5FA" text-anchor="middle">Premium Properties</text>
      </g>

      <!-- Right Card Preview Showcase -->
      <g transform="translate(640, 80)">
        <rect width="320" height="340" rx="20" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        
        <!-- Header badge inside card -->
        <rect x="25" y="25" width="110" height="26" rx="13" fill="#10B981" />
        <text x="80" y="42" font-family="sans-serif" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">FEATURED</text>

        <text x="25" y="90" font-family="sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">Makuta Begonia</text>
        <text x="25" y="115" font-family="sans-serif" font-size="14" font-weight="500" fill="#94A3B8">Gachibowli, Hyderabad</text>

        <line x1="25" y1="140" x2="295" y2="140" stroke="rgba(255,255,255,0.1)" stroke-width="1" />

        <text x="25" y="180" font-family="sans-serif" font-size="12" font-weight="500" fill="#64748B">Expected IRR</text>
        <text x="25" y="210" font-family="sans-serif" font-size="24" font-weight="800" fill="#10B981">14.2%</text>

        <text x="170" y="180" font-family="sans-serif" font-size="12" font-weight="500" fill="#64748B">Min. Investment</text>
        <text x="170" y="210" font-family="sans-serif" font-size="24" font-weight="800" fill="#FBBF24">₹ 10 Lakhs</text>

        <!-- Button -->
        <rect x="25" y="250" width="270" height="46" rx="23" fill="url(#goldGrad)" />
        <text x="160" y="278" font-family="sans-serif" font-size="14" font-weight="700" fill="#0F172A" text-anchor="middle">Explore Property →</text>
      </g>
    </svg>
  `);

  await sharp(featureSvg)
    .png()
    .toFile(path.join(outDir, 'feature-graphic-1024x500.png'));
  console.log('Created feature-graphic-1024x500.png');

  // 3. Phone Screenshots: 1080 x 1920 (9:16 aspect ratio, meets Play Store 1080px min side requirement)
  // Screenshot 1: Discover Prime Real Estate
  const screen1Svg = Buffer.from(`
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgS1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="100%" stop-color="#1E293B" />
        </linearGradient>
        <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#0F172A" />
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>

      <rect width="1080" height="1920" fill="url(#bgS1)"/>

      <!-- Header Title Banner -->
      <text x="540" y="160" font-family="sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" text-anchor="middle">Discover Prime Real Estate</text>
      <text x="540" y="230" font-family="sans-serif" font-size="30" font-weight="500" fill="#FBBF24" text-anchor="middle">Verified Commercial &amp; Residential Projects</text>

      <!-- Mock Phone Frame -->
      <g transform="translate(100, 310)">
        <rect width="880" height="1480" rx="48" fill="#111827" stroke="#374151" stroke-width="6"/>

        <!-- Top Status Bar -->
        <text x="60" y="60" font-family="sans-serif" font-size="24" font-weight="600" fill="#9CA3AF">9:41</text>
        <text x="820" y="60" font-family="sans-serif" font-size="24" font-weight="600" fill="#9CA3AF" text-anchor="end">5G 100%</text>

        <!-- App Search Bar -->
        <rect x="50" y="100" width="780" height="70" rx="35" fill="#1F2937" stroke="#374151" stroke-width="2"/>
        <text x="100" y="145" font-family="sans-serif" font-size="24" fill="#9CA3AF">🔍 Search luxury homes, commercial towers...</text>

        <!-- Property Card 1 -->
        <g transform="translate(50, 210)">
          <rect width="780" height="520" rx="28" fill="#1E293B" stroke="#334155" stroke-width="2"/>
          
          <!-- Image area -->
          <rect x="0" y="0" width="780" height="280" rx="28" fill="#0284C7"/>
          <text x="390" y="150" font-family="sans-serif" font-size="32" font-weight="700" fill="#FFFFFF" text-anchor="middle">Makuta Begonia • Luxury Towers</text>
          <rect x="30" y="30" width="160" height="40" rx="20" fill="#10B981"/>
          <text x="110" y="56" font-family="sans-serif" font-size="18" font-weight="700" fill="#FFFFFF" text-anchor="middle">RERA APPROVED</text>

          <text x="40" y="340" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF">Makuta Begonia</text>
          <text x="40" y="380" font-family="sans-serif" font-size="24" fill="#94A3B8">📍 Financial District, Hyderabad</text>
          
          <text x="40" y="440" font-family="sans-serif" font-size="22" fill="#64748B">Target IRR</text>
          <text x="40" y="480" font-family="sans-serif" font-size="32" font-weight="800" fill="#10B981">14.8% p.a.</text>

          <text x="450" y="440" font-family="sans-serif" font-size="22" fill="#64748B">Min. Investment</text>
          <text x="450" y="480" font-family="sans-serif" font-size="32" font-weight="800" fill="#FBBF24">₹ 15,00,000</text>
        </g>

        <!-- Property Card 2 -->
        <g transform="translate(50, 770)">
          <rect width="780" height="520" rx="28" fill="#1E293B" stroke="#334155" stroke-width="2"/>
          <rect x="0" y="0" width="780" height="280" rx="28" fill="#475569"/>
          <text x="390" y="150" font-family="sans-serif" font-size="32" font-weight="700" fill="#FFFFFF" text-anchor="middle">Makuta Horizon • Commercial Hub</text>
          <rect x="30" y="30" width="160" height="40" rx="20" fill="#3B82F6"/>
          <text x="110" y="56" font-family="sans-serif" font-size="18" font-weight="700" fill="#FFFFFF" text-anchor="middle">GRADE A ASSET</text>

          <text x="40" y="340" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF">Makuta Horizon</text>
          <text x="40" y="380" font-family="sans-serif" font-size="24" fill="#94A3B8">📍 Hitec City, Hyderabad</text>
          
          <text x="40" y="440" font-family="sans-serif" font-size="22" fill="#64748B">Target IRR</text>
          <text x="40" y="480" font-family="sans-serif" font-size="32" font-weight="800" fill="#10B981">16.2% p.a.</text>

          <text x="450" y="440" font-family="sans-serif" font-size="22" fill="#64748B">Min. Investment</text>
          <text x="450" y="480" font-family="sans-serif" font-size="32" font-weight="800" fill="#FBBF24">₹ 25,00,000</text>
        </g>

        <!-- Bottom Tab Bar -->
        <g transform="translate(0, 1370)">
          <rect width="880" height="110" fill="#0F172A" />
          <text x="150" y="65" font-family="sans-serif" font-size="22" font-weight="700" fill="#FBBF24" text-anchor="middle">🏠 Explore</text>
          <text x="440" y="65" font-family="sans-serif" font-size="22" font-weight="500" fill="#64748B" text-anchor="middle">🏢 Portfolio</text>
          <text x="730" y="65" font-family="sans-serif" font-size="22" font-weight="500" fill="#64748B" text-anchor="middle">👤 Profile</text>
        </g>
      </g>
    </svg>
  `);

  await sharp(screen1Svg)
    .png()
    .toFile(path.join(outDir, 'screenshot-1.png'));
  console.log('Created screenshot-1.png');

  // Screenshot 2: Book Site Visits & Consult Experts
  const screen2Svg = Buffer.from(`
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgS2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#091E3A" />
          <stop offset="100%" stop-color="#0F172A" />
        </linearGradient>
        <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>

      <rect width="1080" height="1920" fill="url(#bgS2)"/>

      <!-- Header Title Banner -->
      <text x="540" y="160" font-family="sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" text-anchor="middle">Schedule Free Site Visits</text>
      <text x="540" y="230" font-family="sans-serif" font-size="30" font-weight="500" fill="#38BDF8" text-anchor="middle">Direct Consultation with Real Estate Specialists</text>

      <!-- Mock Phone Frame -->
      <g transform="translate(100, 310)">
        <rect width="880" height="1480" rx="48" fill="#111827" stroke="#374151" stroke-width="6"/>

        <!-- Top Navigation -->
        <text x="60" y="70" font-family="sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">← Book Inspection</text>

        <!-- Form Card -->
        <g transform="translate(50, 130)">
          <rect width="780" height="1180" rx="28" fill="#1E293B" stroke="#334155" stroke-width="2"/>

          <!-- Selected Property Details -->
          <text x="40" y="60" font-family="sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">Selected Project</text>
          <rect x="40" y="80" width="700" height="100" rx="16" fill="#0F172A"/>
          <text x="70" y="130" font-family="sans-serif" font-size="24" font-weight="700" fill="#FBBF24">Makuta Begonia</text>
          <text x="70" y="160" font-family="sans-serif" font-size="18" fill="#94A3B8">Luxury 3 &amp; 4 BHK Apartments</text>

          <!-- Date Picker -->
          <text x="40" y="240" font-family="sans-serif" font-size="24" font-weight="600" fill="#FFFFFF">Select Date</text>
          <g transform="translate(40, 260)">
            <rect width="130" height="90" rx="16" fill="#F59E0B"/>
            <text x="65" y="42" font-family="sans-serif" font-size="18" font-weight="700" fill="#0F172A" text-anchor="middle">TODAY</text>
            <text x="65" y="72" font-family="sans-serif" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">7 Sep</text>

            <rect x="150" width="130" height="90" rx="16" fill="#0F172A"/>
            <text x="215" y="42" font-family="sans-serif" font-size="18" font-weight="500" fill="#94A3B8" text-anchor="middle">TUE</text>
            <text x="215" y="72" font-family="sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" text-anchor="middle">8 Sep</text>

            <rect x="300" width="130" height="90" rx="16" fill="#0F172A"/>
            <text x="365" y="42" font-family="sans-serif" font-size="18" font-weight="500" fill="#94A3B8" text-anchor="middle">WED</text>
            <text x="365" y="72" font-family="sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" text-anchor="middle">9 Sep</text>

            <rect x="450" width="130" height="90" rx="16" fill="#0F172A"/>
            <text x="515" y="42" font-family="sans-serif" font-size="18" font-weight="500" fill="#94A3B8" text-anchor="middle">THU</text>
            <text x="515" y="72" font-family="sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" text-anchor="middle">10 Sep</text>
          </g>

          <!-- Time Slot -->
          <text x="40" y="410" font-family="sans-serif" font-size="24" font-weight="600" fill="#FFFFFF">Select Time Slot</text>
          <g transform="translate(40, 430)">
            <rect width="210" height="60" rx="14" fill="#0F172A" stroke="#334155" stroke-width="2"/>
            <text x="105" y="38" font-family="sans-serif" font-size="20" fill="#FFFFFF" text-anchor="middle">10:00 AM</text>

            <rect x="230" width="210" height="60" rx="14" fill="#3B82F6"/>
            <text x="335" y="38" font-family="sans-serif" font-size="20" font-weight="700" fill="#FFFFFF" text-anchor="middle">02:30 PM</text>

            <rect x="460" width="210" height="60" rx="14" fill="#0F172A" stroke="#334155" stroke-width="2"/>
            <text x="565" y="38" font-family="sans-serif" font-size="20" fill="#FFFFFF" text-anchor="middle">05:00 PM</text>
          </g>

          <!-- Contact Inputs -->
          <text x="40" y="560" font-family="sans-serif" font-size="24" font-weight="600" fill="#FFFFFF">Contact Information</text>
          <rect x="40" y="590" width="700" height="70" rx="14" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
          <text x="70" y="635" font-family="sans-serif" font-size="22" fill="#94A3B8">Name: Sumanth Varma</text>

          <rect x="40" y="680" width="700" height="70" rx="14" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
          <text x="70" y="725" font-family="sans-serif" font-size="22" fill="#94A3B8">Phone: +91 98765 43210</text>

          <!-- Perks -->
          <g transform="translate(40, 790)">
            <text x="0" y="30" font-family="sans-serif" font-size="20" fill="#10B981">✓ Free Dedicated Cab Pickup Available</text>
            <text x="0" y="75" font-family="sans-serif" font-size="20" fill="#10B981">✓ 1-on-1 Guided Tour with Project Manager</text>
            <text x="0" y="120" font-family="sans-serif" font-size="20" fill="#10B981">✓ Zero Commission &amp; Instant Documentation</text>
          </g>

          <!-- Confirm Button -->
          <rect x="40" y="1000" width="700" height="90" rx="20" fill="url(#gold2)"/>
          <text x="390" y="1055" font-family="sans-serif" font-size="28" font-weight="800" fill="#0F172A" text-anchor="middle">Confirm Site Visit</text>
        </g>

        <!-- Bottom Tab Bar -->
        <g transform="translate(0, 1370)">
          <rect width="880" height="110" fill="#0F172A" />
          <text x="150" y="65" font-family="sans-serif" font-size="22" font-weight="500" fill="#64748B" text-anchor="middle">🏠 Explore</text>
          <text x="440" y="65" font-family="sans-serif" font-size="22" font-weight="700" fill="#FBBF24" text-anchor="middle">🏢 Portfolio</text>
          <text x="730" y="65" font-family="sans-serif" font-size="22" font-weight="500" fill="#64748B" text-anchor="middle">👤 Profile</text>
        </g>
      </g>
    </svg>
  `);

  await sharp(screen2Svg)
    .png()
    .toFile(path.join(outDir, 'screenshot-2.png'));
  console.log('Created screenshot-2.png');

  console.log('All Play Store visual assets generated successfully in:', outDir);
}

run().catch(console.error);
