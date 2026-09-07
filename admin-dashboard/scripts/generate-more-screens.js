import sharp from 'sharp';
import path from 'path';

const outDir = '/Users/indusinnovate/Desktop/playstore-assets';

async function addMoreScreens() {
  // Screenshot 3: Real-Time Investment & Yield Tracking
  const screen3Svg = Buffer.from(`
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgS3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0B1528" />
          <stop offset="100%" stop-color="#1E293B" />
        </linearGradient>
        <linearGradient id="gold3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>

      <rect width="1080" height="1920" fill="url(#bgS3)"/>

      <text x="540" y="160" font-family="sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" text-anchor="middle">Track High-Yield Investments</text>
      <text x="540" y="230" font-family="sans-serif" font-size="30" font-weight="500" fill="#10B981" text-anchor="middle">Transparent Financial Returns &amp; Rental Payouts</text>

      <g transform="translate(100, 310)">
        <rect width="880" height="1480" rx="48" fill="#111827" stroke="#374151" stroke-width="6"/>
        <text x="60" y="70" font-family="sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">Investment Analytics</text>

        <!-- Portfolio Summary Card -->
        <g transform="translate(50, 120)">
          <rect width="780" height="320" rx="24" fill="#1E293B" stroke="#334155" stroke-width="2"/>
          <text x="40" y="60" font-family="sans-serif" font-size="22" fill="#94A3B8">Total Portfolio Value</text>
          <text x="40" y="120" font-family="sans-serif" font-size="46" font-weight="800" fill="#FFFFFF">₹ 42,50,000</text>
          <rect x="40" y="150" width="160" height="36" rx="18" fill="rgba(16,185,129,0.2)"/>
          <text x="120" y="174" font-family="sans-serif" font-size="18" font-weight="700" fill="#10B981" text-anchor="middle">+14.6% Returns</text>

          <line x1="40" y1="210" x2="740" y2="210" stroke="#334155" stroke-width="1"/>

          <text x="40" y="260" font-family="sans-serif" font-size="20" fill="#94A3B8">Monthly Rental Income</text>
          <text x="40" y="295" font-family="sans-serif" font-size="26" font-weight="700" fill="#FBBF24">₹ 38,400 / mo</text>

          <text x="450" y="260" font-family="sans-serif" font-size="20" fill="#94A3B8">Active Assets</text>
          <text x="450" y="295" font-family="sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">3 Properties</text>
        </g>

        <!-- Property Breakdown -->
        <g transform="translate(50, 480)">
          <text x="10" y="40" font-family="sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">Your Asset Allocations</text>

          <!-- Item 1 -->
          <g transform="translate(0, 70)">
            <rect width="780" height="180" rx="20" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
            <text x="40" y="60" font-family="sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">Makuta Begonia (Tower A)</text>
            <text x="40" y="100" font-family="sans-serif" font-size="20" fill="#94A3B8">Residential • Gachibowli</text>
            <text x="40" y="145" font-family="sans-serif" font-size="24" font-weight="800" fill="#10B981">₹ 20,00,000 invested</text>
            <text x="740" y="80" font-family="sans-serif" font-size="24" font-weight="700" fill="#FBBF24" text-anchor="end">14.2% IRR</text>
          </g>

          <!-- Item 2 -->
          <g transform="translate(0, 280)">
            <rect width="780" height="180" rx="20" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
            <text x="40" y="60" font-family="sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">Makuta Horizon Commercial</text>
            <text x="40" y="100" font-family="sans-serif" font-size="20" fill="#94A3B8">Commercial Grade A • Hitec City</text>
            <text x="40" y="145" font-family="sans-serif" font-size="24" font-weight="800" fill="#10B981">₹ 15,00,000 invested</text>
            <text x="740" y="80" font-family="sans-serif" font-size="24" font-weight="700" fill="#FBBF24" text-anchor="end">16.0% IRR</text>
          </g>

          <!-- Item 3 -->
          <g transform="translate(0, 490)">
            <rect width="780" height="180" rx="20" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
            <text x="40" y="60" font-family="sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">Aruna Arcade Commercial</text>
            <text x="40" y="100" font-family="sans-serif" font-size="20" fill="#94A3B8">Retail Hub • Jubilee Hills</text>
            <text x="40" y="145" font-family="sans-serif" font-size="24" font-weight="800" fill="#10B981">₹ 7,50,000 invested</text>
            <text x="740" y="80" font-family="sans-serif" font-size="24" font-weight="700" fill="#FBBF24" text-anchor="end">13.8% IRR</text>
          </g>
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

  await sharp(screen3Svg)
    .png()
    .toFile(path.join(outDir, 'screenshot-3.png'));
  console.log('Created screenshot-3.png');

  // Screenshot 4: Verified Top Developers & RERA Compliance
  const screen4Svg = Buffer.from(`
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgS4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="100%" stop-color="#1A202C" />
        </linearGradient>
      </defs>

      <rect width="1080" height="1920" fill="url(#bgS4)"/>

      <text x="540" y="160" font-family="sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" text-anchor="middle">Verified Developer Network</text>
      <text x="540" y="230" font-family="sans-serif" font-size="30" font-weight="500" fill="#FBBF24" text-anchor="middle">100% RERA Registered &amp; Legally Vetted</text>

      <g transform="translate(100, 310)">
        <rect width="880" height="1480" rx="48" fill="#111827" stroke="#374151" stroke-width="6"/>
        <text x="60" y="70" font-family="sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">Featured Developers</text>

        <!-- Developer 1 -->
        <g transform="translate(50, 130)">
          <rect width="780" height="240" rx="24" fill="#1E293B" stroke="#334155" stroke-width="2"/>
          <circle cx="100" cy="120" r="60" fill="#F59E0B"/>
          <text x="100" y="130" font-family="sans-serif" font-size="36" font-weight="800" fill="#0F172A" text-anchor="middle">M</text>
          <text x="190" y="90" font-family="sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">Makuta Developers</text>
          <text x="190" y="130" font-family="sans-serif" font-size="20" fill="#94A3B8">15+ Years • 24 Projects Completed</text>
          <text x="190" y="170" font-family="sans-serif" font-size="20" font-weight="700" fill="#10B981">★ 4.9 Rating (1,240 Reviews)</text>
        </g>

        <!-- Developer 2 -->
        <g transform="translate(50, 410)">
          <rect width="780" height="240" rx="24" fill="#1E293B" stroke="#334155" stroke-width="2"/>
          <circle cx="100" cy="120" r="60" fill="#3B82F6"/>
          <text x="100" y="130" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF" text-anchor="middle">A</text>
          <text x="190" y="90" font-family="sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">Aruna Constructions</text>
          <text x="190" y="130" font-family="sans-serif" font-size="20" fill="#94A3B8">Commercial Specialists • 12 Projects</text>
          <text x="190" y="170" font-family="sans-serif" font-size="20" font-weight="700" fill="#10B981">★ 4.8 Rating (820 Reviews)</text>
        </g>

        <!-- Developer 3 -->
        <g transform="translate(50, 690)">
          <rect width="780" height="240" rx="24" fill="#1E293B" stroke="#334155" stroke-width="2"/>
          <circle cx="100" cy="120" r="60" fill="#8B5CF6"/>
          <text x="100" y="130" font-family="sans-serif" font-size="36" font-weight="800" fill="#FFFFFF" text-anchor="middle">N</text>
          <text x="190" y="90" font-family="sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">Nirvana Infra</text>
          <text x="190" y="130" font-family="sans-serif" font-size="20" fill="#94A3B8">Luxury Villas &amp; Gated Communities</text>
          <text x="190" y="170" font-family="sans-serif" font-size="20" font-weight="700" fill="#10B981">★ 4.9 Rating (640 Reviews)</text>
        </g>

        <!-- Guarantee Banner -->
        <g transform="translate(50, 970)">
          <rect width="780" height="280" rx="24" fill="rgba(245, 158, 11, 0.1)" stroke="#F59E0B" stroke-width="2"/>
          <text x="390" y="80" font-family="sans-serif" font-size="28" font-weight="800" fill="#FBBF24" text-anchor="middle">RealShare Trust Guarantee</text>
          <text x="390" y="140" font-family="sans-serif" font-size="22" fill="#E2E8F0" text-anchor="middle">Every project on RealShare undergoes</text>
          <text x="390" y="180" font-family="sans-serif" font-size="22" fill="#E2E8F0" text-anchor="middle">stringent 30-point legal &amp; title clearance.</text>
        </g>

        <!-- Bottom Tab Bar -->
        <g transform="translate(0, 1370)">
          <rect width="880" height="110" fill="#0F172A" />
          <text x="150" y="65" font-family="sans-serif" font-size="22" font-weight="500" fill="#64748B" text-anchor="middle">🏠 Explore</text>
          <text x="440" y="65" font-family="sans-serif" font-size="22" font-weight="500" fill="#64748B" text-anchor="middle">🏢 Portfolio</text>
          <text x="730" y="65" font-family="sans-serif" font-size="22" font-weight="700" fill="#FBBF24" text-anchor="middle">👤 Profile</text>
        </g>
      </g>
    </svg>
  `);

  await sharp(screen4Svg)
    .png()
    .toFile(path.join(outDir, 'screenshot-4.png'));
  console.log('Created screenshot-4.png');
}

addMoreScreens().catch(console.error);
