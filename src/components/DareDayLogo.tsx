import React from 'react';

interface DareDayLogoProps {
  className?: string;
  size?: number; // Size in px for the mark
  showText?: boolean;
}

export const DareDayLogo: React.FC<DareDayLogoProps> = ({ 
  className = '', 
  size = 56,
  showText = false 
}) => {
  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {/* Razor-sharp Vector SVG Logo Emblem */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_16px_rgba(255,0,127,0.45)] transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Outer Ring & Main Gradient: Sunset Orange to Neon Pink */}
            <linearGradient id="ddGlowGrad" x1="10" y1="20" x2="190" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF5533" />
              <stop offset="50%" stopColor="#FF007F" />
              <stop offset="100%" stopColor="#E000B8" />
            </linearGradient>

            {/* Fold Shader Gradient for 3D Ribbon Effect */}
            <linearGradient id="ddFoldGrad" x1="50" y1="40" x2="90" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D9005B" />
              <stop offset="100%" stopColor="#990042" />
            </linearGradient>

            {/* Inner Highlights */}
            <linearGradient id="ddLightGrad" x1="70" y1="40" x2="160" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF7744" />
              <stop offset="60%" stopColor="#FF007F" />
              <stop offset="100%" stopColor="#C800A1" />
            </linearGradient>
          </defs>

          {/* Background Dark Circle */}
          <circle cx="100" cy="100" r="92" fill="#080B14" />

          {/* Outer Glowing Gradient Ring */}
          <circle 
            cx="100" 
            cy="100" 
            r="88" 
            stroke="url(#ddGlowGrad)" 
            strokeWidth="7" 
            fill="none" 
          />

          {/* --- STYLIZED GEOMETRIC 'D' BRANDMARK --- */}
          {/* Main 'D' Outer Body */}
          <path 
            d="M 68 45 
               H 112 
               C 148 45, 168 68, 168 100 
               C 168 132, 148 155, 112 155 
               H 68 
               Z" 
            fill="url(#ddLightGrad)" 
          />

          {/* Folded Ribbon Back Spine Shading for 3D Dimension */}
          <path 
            d="M 68 45 
               L 92 68 
               V 132 
               L 68 155 
               Z" 
            fill="url(#ddFoldGrad)" 
            opacity="0.9"
          />

          {/* Negative Space Center Cutout with Play Arrow Notch */}
          <path 
            d="M 92 72 
               H 108 
               C 126 72, 138 84, 138 100 
               C 138 116, 126 128, 108 128 
               H 92 
               Z" 
            fill="#080B14" 
          />

          {/* Play Triangle Notch entering from left of cutout */}
          <path 
            d="M 88 84 
               L 116 100 
               L 88 116 
               Z" 
            fill="url(#ddLightGrad)" 
          />
        </svg>
      </div>

      {/* Optional Integrated Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-fuchsia-300 font-tech [-webkit-text-stroke:1px_rgba(236,72,153,0.8)] [text-shadow:_0_0_20px_rgba(236,72,153,0.5)]">
              DARE
            </span>
            <span className="hidden xs:inline-flex rounded border border-pink-500/30 bg-pink-950/40 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-widest text-pink-400 uppercase">
              PRO
            </span>
          </div>
          <span className="inline text-[8px] sm:text-[9px] font-bold tracking-[0.18em] sm:tracking-[0.22em] text-slate-400 uppercase mt-0.5">
            PEER CHALLENGE PROTOCOL
          </span>
        </div>
      )}
    </div>
  );
};
