import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `<svg 
  width="512" 
  height="512" 
  viewBox="0 0 200 200" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <!-- Outer Ring & Main Gradient: Sunset Orange to Neon Pink -->
    <linearGradient id="ddGlowGrad" x1="10" y1="20" x2="190" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF5533" />
      <stop offset="50%" stop-color="#FF007F" />
      <stop offset="100%" stop-color="#E000B8" />
    </linearGradient>

    <!-- Fold Shader Gradient for 3D Ribbon Effect -->
    <linearGradient id="ddFoldGrad" x1="50" y1="40" x2="90" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#D9005B" />
      <stop offset="100%" stop-color="#990042" />
    </linearGradient>

    <!-- Inner Highlights -->
    <linearGradient id="ddLightGrad" x1="70" y1="40" x2="160" y2="140" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF7744" />
      <stop offset="60%" stop-color="#FF007F" />
      <stop offset="100%" stop-color="#C800A1" />
    </linearGradient>
  </defs>

  <!-- Background Dark Circle -->
  <rect width="200" height="200" rx="40" fill="#080B14" />
  <circle cx="100" cy="100" r="92" fill="#080B14" />

  <!-- Outer Glowing Gradient Ring -->
  <circle 
    cx="100" 
    cy="100" 
    r="88" 
    stroke="url(#ddGlowGrad)" 
    stroke-width="7" 
    fill="none" 
  />

  <!-- STYLIZED GEOMETRIC D BRANDMARK -->
  <!-- Main D Outer Body -->
  <path 
    d="M 68 45 H 112 C 148 45, 168 68, 168 100 C 168 132, 148 155, 112 155 H 68 Z" 
    fill="url(#ddLightGrad)" 
  />

  <!-- Folded Ribbon Back Spine Shading for 3D Dimension -->
  <path 
    d="M 68 45 L 92 68 V 132 L 68 155 Z" 
    fill="url(#ddFoldGrad)" 
    opacity="0.9" 
  />

  <!-- Negative Space Center Cutout with Play Arrow Notch -->
  <path 
    d="M 92 72 H 108 C 126 72, 138 84, 138 100 C 138 116, 126 128, 108 128 H 92 Z" 
    fill="#080B14" 
  />

  <!-- Play Triangle Notch entering from left of cutout -->
  <path 
    d="M 88 84 L 116 100 L 88 116 Z" 
    fill="url(#ddLightGrad)" 
  />
</svg>`;

async function run() {
  const publicDir = path.resolve('public');
  
  // Save icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  
  // 512x512
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
    
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Successfully generated exact header logos to public/*.png');
}

run();
