import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  inverted?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  inverted = false,
}) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';
  const taglineSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Dynamic CSS/SVG Mark */}
      <div
        className={`${iconSize} rounded-xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-2 shadow-md shadow-purple-600/25 relative group transition-transform duration-200 hover:scale-105 border border-purple-400/30`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" strokeWidth="2">
          {/* Isometric box top */}
          <path
            d="M12 2L3 7L12 12L21 7L12 2Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Isometric box left */}
          <path
            d="M3 7V17L12 22V12L3 7Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.75"
          />
          {/* Isometric box right */}
          <path
            d="M21 7V17L12 22V12L21 7Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.9"
          />
          {/* Reality core sensing pulse dot (Pink/Magenta) */}
          <circle cx="12" cy="12" r="2.2" fill="#f43f5e" className="animate-pulse" />
        </svg>
      </div>

      <div>
        <div className={`font-black tracking-wider ${titleSize} ${inverted ? 'text-white' : 'text-slate-900'} leading-none`}>
          STOCK<span className="text-purple-600 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">SENSE</span>
        </div>
        {showTagline && (
          <span
            className={`block ${taglineSize} font-mono uppercase tracking-widest ${
              inverted ? 'text-purple-200/70' : 'text-slate-500'
            } mt-1`}
          >
            Inventory Reality OS
          </span>
        )}
      </div>
    </div>
  );
};
