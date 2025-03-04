import React from 'react';

interface EnemyProps {
  x: number;
  y: number;
}

export const Enemy: React.FC<EnemyProps> = ({ x, y }) => {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: '45px', // Increased from 30px
        height: '45px', // Increased from 30px
        backgroundImage: "url('./src/Assets/Enemy.png')",
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        zIndex: 5,
        imageRendering: 'pixelated',
        animation: 'spin 2s linear infinite'
      }}
    />
  );
};