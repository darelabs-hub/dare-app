import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Precise Vector SVG representing the authentic DARE Crown & Brush Logo from the user's attachment
const dareLogoSvg = `<svg 
  width="1000" 
  height="500" 
  viewBox="0 0 1000 500" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <!-- Hot Magenta Crown & Underline Glow Filter -->
    <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#FF007F" flood-opacity="0.75" />
    </filter>

    <!-- 'E' Letter Magenta Fade Gradient -->
    <linearGradient id="eGradient" x1="680" y1="280" x2="840" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="45%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#FF007F" />
      <stop offset="100%" stop-color="#E000B8" />
    </linearGradient>

    <!-- Hot Magenta Crown Linear Gradient -->
    <linearGradient id="crownGrad" x1="320" y1="50" x2="480" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF2A9D" />
      <stop offset="100%" stop-color="#FF007F" />
    </linearGradient>

    <!-- Underline Swoosh Gradient -->
    <linearGradient id="swooshGrad" x1="240" y1="380" x2="760" y2="340" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF007F" />
      <stop offset="100%" stop-color="#FF1493" />
    </linearGradient>
  </defs>

  <!-- === 1. HOT PINK BRUSH CROWN ABOVE 'D' === -->
  <g transform="translate(10, 5)" filter="url(#pinkGlow)">
    <!-- Crown 3-Point Outline Path with hand-drawn brush energy -->
    <path 
      d="M 335 185 
         L 325 95 
         L 378 135 
         L 415 65 
         L 442 135 
         L 485 110 
         L 470 145
         C 460 155, 410 175, 335 185 Z" 
      fill="none" 
      stroke="url(#crownGrad)" 
      stroke-width="16" 
      stroke-linecap="round" 
      stroke-linejoin="miter" 
      stroke-miterlimit="3"
    />
    <!-- Crown Inner Fill Accents -->
    <path 
      d="M 345 170 
         L 338 115 
         L 378 142 
         L 412 90 
         L 438 142 
         L 470 125 
         L 460 148 
         Z" 
      fill="#FF007F" 
      opacity="0.25"
    />
  </g>

  <!-- === 2. BOLD BRUSH-STROKE WORD 'DARE' === -->
  
  <!-- LETTER 'D' -->
  <g fill="#FFFFFF">
    <!-- Left Stems & Spines with brush fray -->
    <path d="M 160 380 L 210 195 L 218 198 L 225 190 L 235 220 L 245 195 L 285 205 L 270 240 L 290 235 L 255 365 L 230 360 L 215 390 L 195 375 L 180 395 Z" />
    <!-- Main Outer D Arc -->
    <path d="M 210 195 C 290 185, 395 210, 375 305 C 360 375, 280 385, 215 385 L 205 380 L 210 350 C 265 350, 320 345, 330 295 C 342 240, 275 225, 225 228 Z" />
  </g>

  <!-- LETTER 'A' -->
  <g fill="#FFFFFF">
    <!-- Left Leg -->
    <path d="M 370 380 L 440 160 L 475 160 L 420 375 L 390 380 L 380 390 Z" />
    <!-- Right Leg -->
    <path d="M 450 160 L 485 160 L 515 320 L 525 315 L 530 360 L 480 370 L 450 160 Z" />
    <!-- Center Apex & Bar -->
    <polygon points="430,285 490,275 480,310 420,320" />
    <polygon points="445,215 470,215 460,255 438,255" />
    <!-- Distressed Frays -->
    <path d="M 480 370 L 490 385 L 482 390 L 475 375 Z" />
    <path d="M 525 360 L 535 370 L 518 375 Z" />
  </g>

  <!-- LETTER 'R' -->
  <g fill="#FFFFFF">
    <!-- Left Upright -->
    <path d="M 535 340 L 575 165 L 620 165 L 575 360 L 545 355 L 535 370 Z" />
    <!-- Upper Loop -->
    <path d="M 580 165 C 650 155, 715 185, 700 240 C 685 285, 630 295, 570 295 L 565 265 C 610 265, 655 260, 665 230 C 672 195, 625 190, 585 192 Z" />
    <!-- Dynamic Kick Leg -->
    <path d="M 610 280 L 685 360 L 720 350 L 640 265 Z" />
    <path d="M 685 360 L 705 375 L 725 370 L 710 350 Z" />
  </g>

  <!-- LETTER 'E' (With Hot Magenta / Pink Gradient Fade on upper wing) -->
  <g fill="url(#eGradient)">
    <!-- Back Spine -->
    <path d="M 700 330 L 735 155 L 780 155 L 740 355 L 710 350 L 700 365 Z" />
    <!-- Top Arm (Fading to Hot Pink Brush) -->
    <path d="M 735 155 L 850 145 L 870 170 L 840 185 L 755 190 Z" />
    <path d="M 850 145 L 880 140 L 875 160 Z" />
    <path d="M 870 170 L 890 165 L 865 185 Z" />
    <!-- Mid Arm -->
    <polygon points="730,245 815,240 805,275 725,280" />
    <path d="M 815 240 L 830 248 L 818 265 Z" />
    <!-- Bottom Arm -->
    <path d="M 720 325 L 825 315 L 845 340 L 815 360 L 710 365 Z" />
    <path d="M 825 315 L 855 318 L 840 335 Z" />
  </g>

  <!-- === 3. DYNAMIC HOT PINK BRUSH-STROKE SWOOSH UNDERLINE === -->
  <g filter="url(#pinkGlow)">
    <path 
      d="M 245 465 
         C 280 435, 340 420, 420 395 
         C 520 365, 640 340, 770 335 
         L 765 350 
         C 630 360, 510 390, 410 425 
         C 330 450, 270 475, 245 465 Z" 
      fill="url(#swooshGrad)" 
    />
    <!-- Frayed Brush Ends on Swoosh Left -->
    <path d="M 255 450 L 240 460 L 265 442 Z" fill="#FF007F" />
    <path d="M 270 440 L 250 452 L 285 432 Z" fill="#FF007F" />
    <!-- Frayed Brush Ends on Swoosh Right -->
    <path d="M 750 338 L 785 332 L 760 348 Z" fill="#FF007F" />
    <path d="M 735 345 L 770 338 L 748 355 Z" fill="#FF007F" />
  </g>
</svg>`;

// Square App Icon SVG (512x512) on Dark Background
const dareSquareIconSvg = `<svg 
  width="512" 
  height="512" 
  viewBox="0 0 512 512" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <filter id="iconGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#FF007F" flood-opacity="0.8" />
    </filter>

    <linearGradient id="sqEGrad" x1="330" y1="280" x2="440" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="45%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#FF007F" />
      <stop offset="100%" stop-color="#E000B8" />
    </linearGradient>

    <linearGradient id="sqCrownGrad" x1="160" y1="60" x2="260" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF2A9D" />
      <stop offset="100%" stop-color="#FF007F" />
    </linearGradient>

    <linearGradient id="sqSwooshGrad" x1="120" y1="400" x2="430" y2="350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF007F" />
      <stop offset="100%" stop-color="#FF1493" />
    </linearGradient>
  </defs>

  <!-- Dark Background -->
  <rect width="512" height="512" rx="100" fill="#050509" />

  <!-- Inner Ambient Glow Ring -->
  <rect x="8" y="8" width="496" height="496" rx="92" stroke="#FF007F" stroke-width="3" stroke-opacity="0.3" fill="none" />

  <!-- Group containing the Dare Crown & Lettermark scaled to fit square -->
  <g transform="translate(26, 68) scale(0.46)">
    <!-- Crown -->
    <g transform="translate(10, 5)" filter="url(#iconGlow)">
      <path 
        d="M 335 185 L 325 95 L 378 135 L 415 65 L 442 135 L 485 110 L 470 145 C 460 155, 410 175, 335 185 Z" 
        fill="none" 
        stroke="url(#sqCrownGrad)" 
        stroke-width="18" 
        stroke-linecap="round" 
        stroke-linejoin="miter" 
      />
      <path d="M 345 170 L 338 115 L 378 142 L 412 90 L 438 142 L 470 125 L 460 148 Z" fill="#FF007F" opacity="0.3" />
    </g>

    <!-- Word DARE -->
    <!-- D -->
    <g fill="#FFFFFF">
      <path d="M 160 380 L 210 195 L 285 205 L 270 240 L 290 235 L 255 365 L 230 360 L 215 390 L 195 375 L 180 395 Z" />
      <path d="M 210 195 C 290 185, 395 210, 375 305 C 360 375, 280 385, 215 385 L 205 380 L 210 350 C 265 350, 320 345, 330 295 C 342 240, 275 225, 225 228 Z" />
    </g>
    <!-- A -->
    <g fill="#FFFFFF">
      <path d="M 370 380 L 440 160 L 475 160 L 420 375 L 390 380 L 380 390 Z" />
      <path d="M 450 160 L 485 160 L 515 320 L 530 360 L 480 370 L 450 160 Z" />
      <polygon points="430,285 490,275 480,310 420,320" />
      <polygon points="445,215 470,215 460,255 438,255" />
    </g>
    <!-- R -->
    <g fill="#FFFFFF">
      <path d="M 535 340 L 575 165 L 620 165 L 575 360 L 545 355 L 535 370 Z" />
      <path d="M 580 165 C 650 155, 715 185, 700 240 C 685 285, 630 295, 570 295 L 565 265 C 610 265, 655 260, 665 230 C 672 195, 625 190, 585 192 Z" />
      <path d="M 610 280 L 685 360 L 720 350 L 640 265 Z" />
      <path d="M 685 360 L 705 375 L 725 370 L 710 350 Z" />
    </g>
    <!-- E -->
    <g fill="url(#sqEGrad)">
      <path d="M 700 330 L 735 155 L 780 155 L 740 355 L 710 350 L 700 365 Z" />
      <path d="M 735 155 L 850 145 L 870 170 L 840 185 L 755 190 Z" />
      <path d="M 850 145 L 880 140 L 875 160 Z" />
      <path d="M 870 170 L 890 165 L 865 185 Z" />
      <polygon points="730,245 815,240 805,275 725,280" />
      <path d="M 720 325 L 825 315 L 845 340 L 815 360 L 710 365 Z" />
    </g>

    <!-- Underline Swoosh -->
    <g filter="url(#iconGlow)">
      <path 
        d="M 245 465 C 280 435, 340 420, 420 395 C 520 365, 640 340, 770 335 L 765 350 C 630 360, 510 390, 410 425 C 330 450, 270 475, 245 465 Z" 
        fill="url(#sqSwooshGrad)" 
      />
    </g>
  </g>
</svg>`;

async function run() {
  const publicDir = path.resolve('public');
  
  // 1. Save icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), dareSquareIconSvg);
  
  // 2. Generate crisp PNG assets
  await sharp(Buffer.from(dareSquareIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
    
  await sharp(Buffer.from(dareSquareIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(Buffer.from(dareSquareIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  await sharp(Buffer.from(dareSquareIconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(Buffer.from(dareSquareIconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('✅ Generated official DARE brush logo assets across public/');
}

run().catch(console.error);
