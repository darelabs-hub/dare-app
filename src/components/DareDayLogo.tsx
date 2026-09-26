import React from 'react';

interface DareDayLogoProps {
  className?: string;
  size?: number; // Approximate height in px
  showText?: boolean;
}

export const DareDayLogo: React.FC<DareDayLogoProps> = ({ 
  className = '', 
  size = 48,
  showText = false 
}) => {
  // Calculate aspect-ratio dimensions for the wide brush logo (ratio ~ 2.1:1)
  const width = Math.round(size * 2.1);
  const height = size;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Authentic DARE Brush Mark with Crown & Underline */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg 
          width={width} 
          height={height} 
          viewBox="0 0 1000 480" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105 drop-shadow-[0_0_20px_rgba(255,0,127,0.35)]"
        >
          <defs>
            {/* Hot Magenta Crown & Underline Glow Filter */}
            <filter id="darePinkGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#FF007F" floodOpacity="0.8" />
            </filter>

            {/* 'E' Letter Magenta Fade Gradient */}
            <linearGradient id="dareEGrad" x1="680" y1="280" x2="870" y2="220" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="42%" stopColor="#FFFFFF" />
              <stop offset="68%" stopColor="#FF007F" />
              <stop offset="100%" stopColor="#E000B8" />
            </linearGradient>

            {/* Hot Magenta Crown Gradient */}
            <linearGradient id="dareCrownGrad" x1="320" y1="50" x2="480" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF2A9D" />
              <stop offset="100%" stopColor="#FF007F" />
            </linearGradient>

            {/* Underline Swoosh Gradient */}
            <linearGradient id="dareSwooshGrad" x1="240" y1="440" x2="760" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF007F" />
              <stop offset="100%" stopColor="#FF1493" />
            </linearGradient>
          </defs>

          {/* 1. HOT PINK BRUSH CROWN ABOVE 'D' */}
          <g transform="translate(10, -5)" filter="url(#darePinkGlow)">
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
              stroke="url(#dareCrownGrad)" 
              strokeWidth="18" 
              strokeLinecap="round" 
              strokeLinejoin="miter" 
              strokeMiterlimit="3"
            />
            <path 
              d="M 345 170 
                 L 338 115 
                 L 378 142 
                 L 412 90 
                 L 438 142 
                 L 470 125 
                 L 460 148 Z" 
              fill="#FF007F" 
              opacity="0.35"
            />
          </g>

          {/* 2. BOLD BRUSH-STROKE WORD 'DARE' */}
          
          {/* LETTER 'D' */}
          <g fill="#FFFFFF">
            <path d="M 160 380 L 210 195 L 218 198 L 225 190 L 235 220 L 245 195 L 285 205 L 270 240 L 290 235 L 255 365 L 230 360 L 215 390 L 195 375 L 180 395 Z" />
            <path d="M 210 195 C 290 185, 395 210, 375 305 C 360 375, 280 385, 215 385 L 205 380 L 210 350 C 265 350, 320 345, 330 295 C 342 240, 275 225, 225 228 Z" />
          </g>

          {/* LETTER 'A' */}
          <g fill="#FFFFFF">
            <path d="M 370 380 L 440 160 L 475 160 L 420 375 L 390 380 L 380 390 Z" />
            <path d="M 450 160 L 485 160 L 515 320 L 525 315 L 530 360 L 480 370 L 450 160 Z" />
            <polygon points="430,285 490,275 480,310 420,320" />
            <polygon points="445,215 470,215 460,255 438,255" />
            <path d="M 480 370 L 490 385 L 482 390 L 475 375 Z" />
            <path d="M 525 360 L 535 370 L 518 375 Z" />
          </g>

          {/* LETTER 'R' */}
          <g fill="#FFFFFF">
            <path d="M 535 340 L 575 165 L 620 165 L 575 360 L 545 355 L 535 370 Z" />
            <path d="M 580 165 C 650 155, 715 185, 700 240 C 685 285, 630 295, 570 295 L 565 265 C 610 265, 655 260, 665 230 C 672 195, 625 190, 585 192 Z" />
            <path d="M 610 280 L 685 360 L 720 350 L 640 265 Z" />
            <path d="M 685 360 L 705 375 L 725 370 L 710 350 Z" />
          </g>

          {/* LETTER 'E' (With Pink Brush Gradient Fade) */}
          <g fill="url(#dareEGrad)">
            <path d="M 700 330 L 735 155 L 780 155 L 740 355 L 710 350 L 700 365 Z" />
            <path d="M 735 155 L 850 145 L 870 170 L 840 185 L 755 190 Z" />
            <path d="M 850 145 L 880 140 L 875 160 Z" />
            <path d="M 870 170 L 890 165 L 865 185 Z" />
            <polygon points="730,245 815,240 805,275 725,280" />
            <path d="M 815 240 L 830 248 L 818 265 Z" />
            <path d="M 720 325 L 825 315 L 845 340 L 815 360 L 710 365 Z" />
            <path d="M 825 315 L 855 318 L 840 335 Z" />
          </g>

          {/* 3. DYNAMIC HOT PINK BRUSH-STROKE SWOOSH UNDERLINE */}
          <g filter="url(#darePinkGlow)">
            <path 
              d="M 245 445 
                 C 280 415, 340 400, 420 375 
                 C 520 345, 640 320, 770 315 
                 L 765 330 
                 C 630 340, 510 370, 410 405 
                 C 330 430, 270 455, 245 445 Z" 
              fill="url(#dareSwooshGrad)" 
            />
            <path d="M 255 430 L 240 440 L 265 422 Z" fill="#FF007F" />
            <path d="M 270 420 L 250 432 L 285 412 Z" fill="#FF007F" />
            <path d="M 750 318 L 785 312 L 760 328 Z" fill="#FF007F" />
            <path d="M 735 325 L 770 318 L 748 335 Z" fill="#FF007F" />
          </g>
        </svg>
      </div>

      {/* Subtitle / Tagline Badge */}
      {showText && (
        <div className="hidden sm:flex flex-col leading-tight border-l border-slate-800 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-pink-400 uppercase">
              PROTOCOL
            </span>
            <span className="rounded bg-pink-500/20 border border-pink-500/30 px-1 py-0.2 text-[8px] font-mono font-bold text-pink-300">
              PWA
            </span>
          </div>
          <span className="text-[9px] font-bold tracking-[0.16em] text-slate-400 uppercase">
            GOOD HABITS. BETTER FRIENDS.
          </span>
        </div>
      )}
    </div>
  );
};
