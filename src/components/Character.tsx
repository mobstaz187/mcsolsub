import React from 'react';

interface CharacterProps {
  x: number;
  y: number;
  size?: number;
}

export const Character: React.FC<CharacterProps> = ({ x, y, size = 60 }) => {
  return (
    <div
      className="absolute pixel-character"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: "url('./src/Assets/Character.png')",
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        zIndex: 10,
        imageRendering: 'pixelated'
      }}
    />
  );
};