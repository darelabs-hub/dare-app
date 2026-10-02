import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface ProductImageSpec {
  filename: string;
  name: string;
  badge?: string;
  badgeBg: string;
  badgeText: string;
  credText: string;
  subText: string;
  metalColor: string;
  visualSvg: string;
}

const specs: ProductImageSpec[] = [
  {
    filename: 'cred_starter_pack.png',
    name: 'Starter Pack',
    badge: 'STARTER',
    badgeBg: '#1E293B',
    badgeText: '#94A3B8',
    credText: '150 CRED',
    subText: 'DARE STARTER PACK',
    metalColor: '#38BDF8',
    visualSvg: `
      <!-- Single Heavy Titanium & Silver Medallion with Milled Edge -->
      <g transform="translate(256, 212)">
        <!-- Natural Studio Soft Drop Shadow -->
        <ellipse cx="0" cy="105" rx="90" ry="18" fill="#000000" opacity="0.6" filter="url(#studioShadow)" />
        
        <!-- Outer 3D Coin Edge (Bevel) -->
        <circle cx="0" cy="8" r="92" fill="#1E293B" stroke="#334155" stroke-width="2" />
        
        <!-- Main Coin Body (Brushed Platinum & Silver) -->
        <circle cx="0" cy="0" r="92" fill="url(#silverCoinGrad)" stroke="#64748B" stroke-width="3" />
        
        <!-- Precision Milled Edge Ring -->
        <circle cx="0" cy="0" r="82" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="4,3" opacity="0.7" />
        
        <!-- Debossed Inner Coin Face -->
        <circle cx="0" cy="0" r="74" fill="url(#silverInnerFace)" stroke="#1E293B" stroke-width="1.5" />
        
        <!-- Crisp Embossed DARE Emblem -->
        <path d="M-28 -40 L0 -40 C24 -40, 38 -24, 38 0 C38 24, 24 40, 0 40 L-28 40 Z M-12 -24 L-12 24 L0 24 C14 24, 22 13, 22 0 C22 -13, 14 -24, 0 -24 Z" fill="url(#silverEmblemGrad)" filter="url(#subtleRelief)" />
        <!-- Minimalist directional arrow inside emblem -->
        <polygon points="-6,-10 14,0 -6,10" fill="#38BDF8" opacity="0.9" />

        <!-- Crisp Light Reflection Arc -->
        <path d="M-60 -50 A 74 74 0 0 1 60 -50" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.35" stroke-linecap="round" />
      </g>
    `,
  },
  {
    filename: 'cred_booster_pack.png',
    name: 'Booster Pack',
    badge: '+10% BONUS CRED',
    badgeBg: '#1E1B4B',
    badgeText: '#C084FC',
    credText: '550 CRED',
    subText: 'DARE BOOSTER PACK',
    metalColor: '#A855F7',
    visualSvg: `
      <!-- Tiered Duo of Stacked Platinum and Violet Coins -->
      <g transform="translate(256, 212)">
        <!-- Natural Studio Soft Drop Shadow -->
        <ellipse cx="0" cy="108" rx="105" ry="20" fill="#000000" opacity="0.65" filter="url(#studioShadow)" />
        
        <!-- Back Stack Coin -->
        <g transform="translate(-32, -18) scale(0.92)">
          <circle cx="0" cy="7" r="82" fill="#18181B" />
          <circle cx="0" cy="0" r="82" fill="url(#violetCoinGrad)" stroke="#6B21A8" stroke-width="2.5" />
          <circle cx="0" cy="0" r="70" fill="url(#violetInnerFace)" />
          <path d="M-22 -30 L0 -30 C18 -30, 28 -18, 28 0 C28 18, 18 30, 0 30 L-22 30 Z M-10 -18 L-10 18 L0 18 C11 18, 16 10, 16 0 C16 -10, 11 -18, 0 -18 Z" fill="#E9D5FF" opacity="0.85" />
        </g>

        <!-- Front Main Coin -->
        <g transform="translate(24, 12)">
          <circle cx="0" cy="8" r="86" fill="#1E1B4B" stroke="#312E81" stroke-width="2" />
          <circle cx="0" cy="0" r="86" fill="url(#silverCoinGrad)" stroke="#C084FC" stroke-width="3" />
          <circle cx="0" cy="0" r="76" fill="none" stroke="#6B21A8" stroke-width="2" stroke-dasharray="4,3" opacity="0.8" />
          <circle cx="0" cy="0" r="68" fill="url(#silverInnerFace)" />
          <path d="M-26 -36 L0 -36 C22 -36, 34 -22, 34 0 C34 22, 22 36, 0 36 L-26 36 Z M-12 -22 L-12 22 L0 22 C13 22, 20 12, 20 0 C20 -12, 13 -22, 0 -22 Z" fill="url(#silverEmblemGrad)" filter="url(#subtleRelief)" />
          <polygon points="-5,-9 12,0 -5,9" fill="#A855F7" />
          <!-- Light Sheen -->
          <path d="M-55 -45 A 68 68 0 0 1 55 -45" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.35" stroke-linecap="round" />
        </g>
      </g>
    `,
  },
  {
    filename: 'cred_creator_pack.png',
    name: 'Popular Creator Pack',
    badge: 'MOST POPULAR • +25% BONUS',
    badgeBg: '#4C0519',
    badgeText: '#FDA4AF',
    credText: '1,250 CRED',
    subText: 'POPULAR CREATOR PACK',
    metalColor: '#F43F5E',
    visualSvg: `
      <!-- Elegant Tiered Tri-Stack of Polished 24k Gold & Rose Coins -->
      <g transform="translate(256, 212)">
        <!-- Natural Studio Soft Drop Shadow -->
        <ellipse cx="0" cy="112" rx="115" ry="22" fill="#000000" opacity="0.7" filter="url(#studioShadow)" />
        
        <!-- Left Coin -->
        <g transform="translate(-46, -12) scale(0.88)">
          <circle cx="0" cy="7" r="82" fill="#451A03" />
          <circle cx="0" cy="0" r="82" fill="url(#goldCoinGrad)" stroke="#B45309" stroke-width="2.5" />
          <circle cx="0" cy="0" r="70" fill="url(#goldInnerFace)" />
          <path d="M-22 -30 L0 -30 C18 -30, 28 -18, 28 0 C28 18, 18 30, 0 30 L-22 30 Z M-10 -18 L-10 18 L0 18 C11 18, 16 10, 16 0 C16 -10, 11 -18, 0 -18 Z" fill="#FEF08A" opacity="0.85" />
        </g>

        <!-- Right Coin -->
        <g transform="translate(46, -12) scale(0.88)">
          <circle cx="0" cy="7" r="82" fill="#451A03" />
          <circle cx="0" cy="0" r="82" fill="url(#goldCoinGrad)" stroke="#B45309" stroke-width="2.5" />
          <circle cx="0" cy="0" r="70" fill="url(#goldInnerFace)" />
          <path d="M-22 -30 L0 -30 C18 -30, 28 -18, 28 0 C28 18, 18 30, 0 30 L-22 30 Z M-10 -18 L-10 18 L0 18 C11 18, 16 10, 16 0 C16 -10, 11 -18, 0 -18 Z" fill="#FEF08A" opacity="0.85" />
        </g>

        <!-- Front Center Main Gold Medallion -->
        <g transform="translate(0, 16)">
          <circle cx="0" cy="8" r="88" fill="#451A03" stroke="#78350F" stroke-width="2" />
          <circle cx="0" cy="0" r="88" fill="url(#goldCoinGrad)" stroke="#FDE047" stroke-width="3" />
          <circle cx="0" cy="0" r="78" fill="none" stroke="#CA8A04" stroke-width="2" stroke-dasharray="4,3" opacity="0.75" />
          <circle cx="0" cy="0" r="70" fill="url(#goldInnerFace)" />
          <path d="M-26 -36 L0 -36 C22 -36, 34 -22, 34 0 C34 22, 22 36, 0 36 L-26 36 Z M-12 -22 L-12 22 L0 22 C13 22, 20 12, 20 0 C20 -12, 13 -22, 0 -22 Z" fill="url(#goldEmblemGrad)" filter="url(#subtleRelief)" />
          <polygon points="-5,-9 12,0 -5,9" fill="#FB7185" />
          <!-- Light Sheen -->
          <path d="M-58 -48 A 70 70 0 0 1 58 -48" fill="none" stroke="#FFFFFF" stroke-width="3.5" opacity="0.45" stroke-linecap="round" />
        </g>
      </g>
    `,
  },
  {
    filename: 'cred_influencer_pack.png',
    name: 'Influencer Pack',
    badge: 'BEST VALUE • +35% BONUS',
    badgeBg: '#451A03',
    badgeText: '#FDE047',
    credText: '3,350 CRED',
    subText: 'INFLUENCER VALUE PACK',
    metalColor: '#EAB308',
    visualSvg: `
      <!-- Royal Gold Heavy Medallion with Minimalist Geometric Crown Crest -->
      <g transform="translate(256, 212)">
        <!-- Natural Studio Soft Drop Shadow -->
        <ellipse cx="0" cy="115" rx="120" ry="24" fill="#000000" opacity="0.75" filter="url(#studioShadow)" />
        
        <!-- Left Side Coin Stack Accent -->
        <g transform="translate(-48, -14) scale(0.85)">
          <circle cx="0" cy="7" r="82" fill="#291302" />
          <circle cx="0" cy="0" r="82" fill="url(#goldCoinGrad)" stroke="#B45309" stroke-width="2" />
          <circle cx="0" cy="0" r="70" fill="url(#goldInnerFace)" />
        </g>

        <!-- Right Side Coin Stack Accent -->
        <g transform="translate(48, -14) scale(0.85)">
          <circle cx="0" cy="7" r="82" fill="#291302" />
          <circle cx="0" cy="0" r="82" fill="url(#goldCoinGrad)" stroke="#B45309" stroke-width="2" />
          <circle cx="0" cy="0" r="70" fill="url(#goldInnerFace)" />
        </g>

        <!-- Main Executive Heavy Gold Coin -->
        <g transform="translate(0, 16)">
          <circle cx="0" cy="9" r="92" fill="#291302" stroke="#78350F" stroke-width="2.5" />
          <circle cx="0" cy="0" r="92" fill="url(#goldCoinGrad)" stroke="#FEF08A" stroke-width="3.5" />
          <circle cx="0" cy="0" r="82" fill="none" stroke="#CA8A04" stroke-width="2" stroke-dasharray="4,3" opacity="0.8" />
          <circle cx="0" cy="0" r="74" fill="url(#goldInnerFace)" />
          
          <!-- Minimalist Geometric Crown Crest Above Logo -->
          <path d="M-24 -46 L-16 -34 L0 -42 L16 -34 L24 -46 L20 -28 L-20 -28 Z" fill="#FDE047" opacity="0.9" />
          <circle cx="-24" cy="-46" r="2.5" fill="#FFFFFF" />
          <circle cx="0" cy="-42" r="3" fill="#FFFFFF" />
          <circle cx="24" cy="-46" r="2.5" fill="#FFFFFF" />

          <!-- DARE Logo -->
          <path d="M-26 -20 L0 -20 C22 -20, 34 -8, 34 12 C34 32, 22 44, 0 44 L-26 44 Z M-12 -6 L-12 30 L0 30 C13 30, 20 21, 20 12 C20 3, 13 -6, 0 -6 Z" fill="url(#goldEmblemGrad)" filter="url(#subtleRelief)" />
          <polygon points="-5,3 12,12 -5,21" fill="#FFFFFF" opacity="0.9" />
          
          <!-- Crisp Light Sheen -->
          <path d="M-62 -52 A 74 74 0 0 1 62 -52" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.5" stroke-linecap="round" />
        </g>
      </g>
    `,
  },
];

function buildSvg(spec: ProductImageSpec): string {
  return `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Soft Studio Depth Filters (Apple / Nike Clean Style) -->
    <filter id="studioShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="16" />
    </filter>

    <filter id="subtleRelief" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.4" />
    </filter>

    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5" />
    </filter>

    <!-- Matte Dark Studio Backdrop (No Grids, No Lasers) -->
    <radialGradient id="studioBackdrop" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#1E293B" stop-opacity="0.5" />
      <stop offset="65%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#05070D" />
    </radialGradient>

    <!-- Platinum & Silver Metallic Gradients -->
    <linearGradient id="silverCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F1F5F9" />
      <stop offset="25%" stop-color="#CBD5E1" />
      <stop offset="60%" stop-color="#94A3B8" />
      <stop offset="100%" stop-color="#64748B" />
    </linearGradient>

    <linearGradient id="silverInnerFace" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#090D16" />
    </linearGradient>

    <linearGradient id="silverEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>

    <!-- Violet & Silver Gradients -->
    <linearGradient id="violetCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E9D5FF" />
      <stop offset="30%" stop-color="#C084FC" />
      <stop offset="70%" stop-color="#7E22CE" />
      <stop offset="100%" stop-color="#4C1D95" />
    </linearGradient>

    <linearGradient id="violetInnerFace" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2E1065" />
      <stop offset="100%" stop-color="#0F0A1F" />
    </linearGradient>

    <!-- Solid 24k Gold Metallic Gradients -->
    <linearGradient id="goldCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="25%" stop-color="#FDE047" />
      <stop offset="55%" stop-color="#EAB308" />
      <stop offset="85%" stop-color="#CA8A04" />
      <stop offset="100%" stop-color="#854D0E" />
    </linearGradient>

    <linearGradient id="goldInnerFace" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#291502" />
      <stop offset="50%" stop-color="#180C01" />
      <stop offset="100%" stop-color="#0A0501" />
    </linearGradient>

    <linearGradient id="goldEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="35%" stop-color="#FEF08A" />
      <stop offset="70%" stop-color="#EAB308" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>
  </defs>

  <!-- Clean Matte Studio Canvas -->
  <rect width="512" height="512" fill="url(#studioBackdrop)" />

  <!-- Clean Outer Enclosure Frame (Subtle 1px Border, Apple-style) -->
  <rect x="20" y="20" width="472" height="472" rx="24" fill="none" stroke="#1E293B" stroke-width="1.5" />
  <rect x="24" y="24" width="464" height="464" rx="20" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.04" />

  <!-- Top Minimalist Badge -->
  ${
    spec.badge
      ? `
    <g transform="translate(256, 52)">
      <rect x="-105" y="-14" width="210" height="28" rx="14" fill="${spec.badgeBg}" stroke="#334155" stroke-width="1" />
      <text x="0" y="5" fill="${spec.badgeText}" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" letter-spacing="1.5" text-anchor="middle">
        ${spec.badge}
      </text>
    </g>
  `
      : ''
  }

  <!-- Main 3D Artwork -->
  ${spec.visualSvg}

  <!-- Bottom Elegant Clean Typography Banner -->
  <g transform="translate(256, 420)">
    <!-- Polished Base Plate -->
    <rect x="-175" y="-44" width="350" height="76" rx="18" fill="#0B0F19" stroke="#1E293B" stroke-width="1.5" filter="url(#cardShadow)" />
    <rect x="-171" y="-40" width="342" height="68" rx="14" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.05" />
    
    <!-- Denomination Text -->
    <text x="0" y="-10" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="26" letter-spacing="2" text-anchor="middle">
      ${spec.credText}
    </text>
    
    <!-- Category Subtitle -->
    <text x="0" y="16" fill="${spec.metalColor}" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="12" letter-spacing="2" text-anchor="middle">
      ${spec.subText}
    </text>
  </g>
</svg>
  `.trim();
}

async function run() {
  const publicDir = path.resolve('public/assets/products');
  const srcImagesDir = path.resolve('src/assets/images');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(srcImagesDir)) {
    fs.mkdirSync(srcImagesDir, { recursive: true });
  }

  console.log('✨ Generating 4 Clean, Premium Apple/Nike-style Cred Pack Product Images (512x512 PNG)...');

  for (const spec of specs) {
    const svg = buildSvg(spec);
    const pngBuffer = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, quality: 100 })
      .toBuffer();

    const publicOut = path.join(publicDir, spec.filename);
    const srcOut = path.join(srcImagesDir, spec.filename);

    fs.writeFileSync(publicOut, pngBuffer);
    fs.writeFileSync(srcOut, pngBuffer);

    console.log(`  ✓ Generated ${spec.filename} (${(pngBuffer.length / 1024).toFixed(1)} KB) -> saved to public and src`);
  }

  console.log('\n🎉 Successfully created all 4 clean, premium product images!');
}

run().catch((err) => {
  console.error('Failed to generate product images:', err);
  process.exit(1);
});
