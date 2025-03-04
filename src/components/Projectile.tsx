import React from 'react';

interface ProjectileProps {
  x: number;
  y: number;
  size?: number;
}

export const Projectile: React.FC<ProjectileProps> = ({ x, y, size = 20 }) => {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: "url('./src/Assets/Bullets.png')",
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        zIndex: 5,
        transition: 'none', // Ensure no CSS transitions are affecting movement
        imageRendering: 'pixelated'
      }}
    />
  );
};