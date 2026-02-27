import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size * 0.2} 
      viewBox="0 0 600 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ENVISION text */}
      <text 
        x="0" 
        y="85" 
        fill="white" 
        style={{ font: '900 72px sans-serif', letterSpacing: '-1px' }}
      >
        ENVISION
      </text>
      
      {/* PATHS text */}
      <text 
        x="380" 
        y="85" 
        fill="#DC2626" 
        style={{ font: '900 72px sans-serif', letterSpacing: '-1px' }}
      >
        PATHS
      </text>

      {/* Red Arrow Swoosh - Positioned over the 'I' in ENVISION */}
      <path 
        d="M235 85 C235 85 245 40 285 15 L270 35 L295 15 L275 5 L285 15 Z" 
        fill="#DC2626" 
      />
      
      {/* Bottom Red Line */}
      <rect x="0" y="110" width="600" height="6" fill="#DC2626" />
    </svg>
  );
};

export const BrandLogoText: React.FC = () => {
  return (
    <div className="flex items-center">
      <BrandLogo size={280} className="drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
    </div>
  );
};
