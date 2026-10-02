import React from 'react';

interface DareDayLogoProps {
  className?: string;
  size?: number; // Height or diameter in pixels (e.g. 36, 40, 48, 80)
  variant?: 'inline' | 'emblem' | 'icon' | 'badge';
  showText?: boolean;
  subtitle?: string;
}

// Precision Scaled & Centered SVG of the Streetwear Distressed Neon Circular Badge
export const DareBadgeEmblemSVG: React.FC<{ size: number; className?: string }> = ({ size, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none drop-shadow-[0_0_25px_rgba(0,229,255,0.85)] ${className}`}
    >
      <defs>
        {/* Neon Ring Multi-Layer Glow Filter */}
        <filter id="neonRingBloom" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="blur3" />
          <feMerge>
            <feMergeNode in="blur3" />
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Letter E Smooth White-to-Pink-to-Purple Gradient */}
        <linearGradient id="gradientLetterE" x1="220" y1="90" x2="310" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FF00A8" />
          <stop offset="100%" stopColor="#8A00FF" />
        </linearGradient>

        {/* Hot Neon Pink Brush Gradient for Crown & Underline */}
        <linearGradient id="neonPinkBrushGrad" x1="50" y1="50" x2="350" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF26B9" />
          <stop offset="50%" stopColor="#FF0094" />
          <stop offset="100%" stopColor="#FF0077" />
        </linearGradient>

        {/* Dark Core Vignette Radial Background */}
        <radialGradient id="grungeDarkBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#14021D" />
          <stop offset="65%" stopColor="#08000D" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>

      {/* Dark Base Circle */}
      <circle cx="250" cy="250" r="236" fill="url(#grungeDarkBg)" />

      {/* Distress & Spray Grunge Texture */}
      <g opacity="0.35" fill="#00E5FF">
        {/* Top-Left Splatters */}
        <circle cx="85" cy="180" r="14" filter="blur(2px)" />
        <circle cx="70" cy="220" r="8" />
        <circle cx="100" cy="130" r="6" />
        <circle cx="115" cy="100" r="12" />
        <path d="M55 195 L80 180 L70 215 L45 205 Z" />
        <path d="M90 125 L115 110 L102 140 Z" />
        
        {/* Bottom-Left Splatters */}
        <circle cx="115" cy="370" r="16" filter="blur(2px)" />
        <circle cx="150" cy="405" r="10" />
        <circle cx="90" cy="340" r="7" />
        <path d="M105 390 L135 405 L120 420 L95 405 Z" />

        {/* Top-Right Splatters */}
        <circle cx="395" cy="110" r="12" filter="blur(2px)" />
        <circle cx="420" cy="150" r="15" />
        <circle cx="380" cy="80" r="7" />
        <path d="M405 130 L435 145 L415 160 Z" />

        {/* Bottom-Right Splatters */}
        <circle cx="430" cy="310" r="14" />
        <circle cx="405" cy="360" r="10" />
        <circle cx="445" cy="270" r="8" />
        <path d="M390 355 L425 370 L405 385 Z" />
      </g>

      {/* Outer Glowing Neon Blue Ring */}
      <circle 
        cx="250" 
        cy="250" 
        r="228" 
        stroke="#00E5FF" 
        strokeWidth="10" 
        filter="url(#neonRingBloom)" 
      />
      <circle 
        cx="250" 
        cy="250" 
        r="228" 
        stroke="#FFFFFF" 
        strokeWidth="2.5" 
        opacity="0.85" 
      />

      {/* Centered Tilted Graffiti Art Composition */}
      <g transform="translate(250, 250) rotate(-6) translate(-250, -250)">
        
        {/* 1. BRUSH CROWN (Tilted 3-Point Crown positioned above D & A - Scaled Up) */}
        <g transform="translate(155, 76) scale(1.05)" filter="drop-shadow(0px 0px 8px #FF00A0)">
          <path 
            d="M 18 85 
               C 12 62, 4 40, 0 22 
               C 8 32, 22 45, 36 54 
               C 48 32, 64 0, 75 -18 
               C 84 5, 96 34, 108 56 
               C 122 38, 138 15, 148 2 
               C 145 25, 137 53, 130 80 
               C 110 88, 62 94, 18 85 Z" 
            fill="url(#neonPinkBrushGrad)" 
            stroke="#FF38C2" 
            strokeWidth="3" 
            strokeLinejoin="round" 
          />
          {/* White Brush Bristle Accents */}
          <path d="M 8 30 Q 22 58 30 76" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
          <path d="M 75 -8 Q 78 28 80 76" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
          <path d="M 142 10 Q 134 40 126 70" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
        </g>

        {/* 2. DARE TYPOGRAPHY (Scaled Up & Centered Inside Neon Ring) */}
        <g transform="translate(60, 172) scale(0.88)">
          
          {/* LETTER D */}
          <g filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.9))">
            <path 
              d="M 22 150 
                 L 28 12 
                 C 54 10, 82 14, 102 30 
                 C 126 48, 138 78, 135 108 
                 C 132 140, 112 166, 82 176 
                 C 56 184, 32 180, 22 150 Z 
                 M 58 146 
                 C 74 146, 94 136, 100 112 
                 C 106 86, 98 50, 82 40 
                 C 72 34, 64 36, 58 40 Z" 
              fill="#FFFFFF" 
            />
            {/* Dry Brush Cuts */}
            <path d="M 18 28 L 28 22" stroke="#06010A" strokeWidth="3.5" />
            <path d="M 20 162 L 32 154" stroke="#06010A" strokeWidth="3.5" />
            <path d="M 125 68 L 115 76" stroke="#06010A" strokeWidth="3" />
          </g>

          {/* LETTER A */}
          <g filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.9))">
            <path 
              d="M 148 180 
                 L 194 14 
                 C 204 11, 214 11, 224 14 
                 L 274 180 
                 L 234 180 
                 L 220 134 
                 L 180 134 
                 L 168 180 Z 
                 M 188 100 
                 L 212 100 
                 L 202 50 Z" 
              fill="#FFFFFF" 
            />
            {/* Bristle Cuts */}
            <path d="M 144 188 L 156 176" stroke="#06010A" strokeWidth="3.5" />
            <path d="M 268 188 L 280 174" stroke="#06010A" strokeWidth="3.5" />
          </g>

          {/* LETTER R */}
          <g filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.9))">
            <path 
              d="M 280 180 
                 L 290 14 
                 C 316 11, 350 13, 370 25 
                 C 388 38, 398 60, 394 84 
                 C 388 105, 372 120, 350 126 
                 L 398 180 
                 L 358 180 
                 L 322 132 
                 L 316 132 
                 L 310 180 Z 
                 M 320 102 
                 C 336 102, 360 98, 362 82 
                 C 366 64, 350 40, 326 38 
                 L 320 38 Z" 
              fill="#FFFFFF" 
            />
            {/* Bristle Cuts */}
            <path d="M 392 188 L 406 174" stroke="#06010A" strokeWidth="3.5" />
          </g>

          {/* LETTER E (Smooth White to Pink/Violet Gradient) */}
          <g filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.9))">
            <path 
              d="M 400 180 
                 L 410 14 
                 L 485 14 
                 L 478 48 
                 L 444 48 
                 L 440 80 
                 L 472 80 
                 L 466 112 
                 L 435 112 
                 L 430 146 
                 L 480 146 
                 L 474 180 Z" 
              fill="url(#gradientLetterE)" 
            />
            {/* Bristle Cuts */}
            <path d="M 480 20 L 492 10" stroke="#06010A" strokeWidth="3.5" />
            <path d="M 475 152 L 486 142" stroke="#06010A" strokeWidth="3.5" />
          </g>
        </g>

        {/* 3. DYNAMIC PINK BRUSH UNDERLINE SWOOSH (Scaled Up & Centered) */}
        <g transform="translate(60, 226) scale(0.88)" filter="drop-shadow(0px 0px 10px #FF00A0)">
          <path 
            d="M 65 200 
               C 130 185, 220 155, 340 128 
               C 400 114, 460 95, 500 70 
               C 455 84, 380 108, 310 128 
               C 210 154, 120 180, 50 204 Z" 
            fill="url(#neonPinkBrushGrad)" 
          />
          {/* Secondary Dry Tail Bristles */}
          <path d="M 45 208 Q 120 188 175 176" stroke="#FF00A0" strokeWidth="4" strokeLinecap="round" />
        </g>

      </g>
    </svg>
  );
};

export const DareDayLogo: React.FC<DareDayLogoProps> = ({ 
  className = '', 
  size = 40,
  variant = 'emblem',
  showText = false,
  subtitle,
}) => {
  const logoContent = (
    <div 
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-300 hover:scale-105 rounded-full overflow-hidden border-2 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.8)] bg-black shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src="/logo.png" 
        alt="DARE Logo" 
        className="w-full h-full object-cover rounded-full pointer-events-none select-none"
        style={{
          transform: 'scale(1.36) translate(-1.5%, 10%)',
          transformOrigin: 'center center',
        }}
      />
    </div>
  );

  // If explicitly requested inline with text (e.g. in marketing footer):
  if (variant === 'inline' && showText) {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none group cursor-pointer ${className}`}>
        {logoContent}
        <div className="flex flex-col leading-none">
          <span 
            className="font-black italic tracking-tighter text-white group-hover:text-pink-100 transition-colors drop-shadow-[0_0_12px_rgba(0,229,255,0.5)] leading-none"
            style={{ 
              fontSize: Math.round(size * 0.54), 
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            }}
          >
            DARE
          </span>
          {subtitle && (
            <span className="text-[8px] font-mono font-bold tracking-widest text-[#00E5FF] uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Primary Default Variant: Standalone Circular Badge Emblem
  return logoContent;
};
