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
      viewBox="0 0 650 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ENVISION text */}
      <text 
        x="0" 
        y="85" 
        fill="white" 
        style={{ font: '900 72px sans-serif', letterSpacing: '-2px' }}
      >
        ENVISION
      </text>
      
      {/* PATHS text */}
      <text 
        x="350" 
        y="85" 
        fill="#dc2626" 
        style={{ font: '900 72px sans-serif', letterSpacing: '-2px' }}
      >
        PATHS
      </text>

      {/* Bottom Red Line */}
      <rect x="0" y="110" width="650" height="6" fill="#dc2626" />
    </svg>
  );
};

export const BrandLogoText: React.FC = () => {
  return (
    <div className="flex items-center">
      <BrandLogo size={300} className="drop-shadow-[0_0_15px_rgba(220,38,36,0.4)]" />
    </div>
  );
};
