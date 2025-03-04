import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Target } from 'lucide-react';

type Direction = 'up' | 'down' | 'left' | 'right' | null;

interface GameControlsProps {
  onMove: (direction: Direction) => void;
  onShoot: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ onMove, onShoot }) => {
  // Only show on mobile devices
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-between px-4">
      <div className="flex flex-col items-center">
        <button
          className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-full mb-2 flex items-center justify-center pixel-border"
          onTouchStart={() => onMove('up')}
          onTouchEnd={() => onMove(null)}
        >
          <ArrowUp className="text-white" size={24} />
        </button>
        
        <div className="flex justify-between w-full">
          <button
            className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-full mr-2 flex items-center justify-center pixel-border"
            onTouchStart={() => onMove('left')}
            onTouchEnd={() => onMove(null)}
          >
            <ArrowLeft className="text-white" size={24} />
          </button>
          
          <button
            className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center pixel-border"
            onTouchStart={() => onMove('down')}
            onTouchEnd={() => onMove(null)}
          >
            <ArrowDown className="text-white" size={24} />
          </button>
          
          <button
            className="w-16 h-16 bg-gray-800 bg-opacity-70 rounded-full ml-2 flex items-center justify-center pixel-border"
            onTouchStart={() => onMove('right')}
            onTouchEnd={() => onMove(null)}
          >
            <ArrowRight className="text-white" size={24} />
          </button>
        </div>
      </div>
      
      <button
        className="w-20 h-20 bg-red-600 bg-opacity-70 rounded-full flex items-center justify-center pixel-border"
        onTouchStart={onShoot}
      >
        <Target className="text-white" size={32} />
      </button>
    </div>
  );
};