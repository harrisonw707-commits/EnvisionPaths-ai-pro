import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size * 0.25} 
      viewBox="0 0 500 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* HIREME text */}
      <text 
        x="0" 
        y="85" 
        fill="white" 
        style={{ font: '900 72px sans-serif', letterSpacing: '-2px' }}
      >
        HIREME
      </text>
      
      {/* AI text */}
      <text 
        x="300" 
        y="85" 
        fill="#facc15" 
        style={{ font: '900 72px sans-serif', letterSpacing: '-2px' }}
      >
        AI
      </text>

      {/* Yellow Arrow Swoosh - Positioned over the 'M' area */}
      <path 
        d="M225 85 C225 85 235 40 275 15 L260 35 L285 15 L265 5 L275 15 Z" 
        fill="#facc15" 
      />
      
      {/* Bottom Yellow Line */}
      <rect x="0" y="110" width="500" height="6" fill="#facc15" />
    </svg>
  );
};

export const BrandLogoText: React.FC = () => {
  return (
    <div className="flex items-center">
      <BrandLogo size={240} className="drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
    </div>
  );
};
