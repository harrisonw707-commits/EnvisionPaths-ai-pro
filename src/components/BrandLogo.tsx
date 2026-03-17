import React from 'react';

export default function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EnvisionPaths AI"
    >
      <title>EnvisionPaths AI</title>
      <text
        x="0"
        y="36"
        fontFamily="'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="#ffffff"
        letterSpacing="-1"
        fontStyle="italic"
      >
        ENVISIONPATHS
      </text>
      <text
        x="0"
        y="48"
        fontFamily="'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="12"
        fill="#dc2626"
        letterSpacing="4"
      >
        AI
      </text>
    </svg>
  );
}
