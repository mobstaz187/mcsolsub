import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Character } from './components/Character';
import { Projectile } from './components/Projectile';
import { Enemy } from './components/Enemy';
import { GameControls } from './components/GameControls';
import { Copy, Twitter } from 'lucide-react';

// Game constants
const GAME_WIDTH = 1000; // Increased from 800
const GAME_HEIGHT = 700; // Increased from 600
const CHARACTER_SPEED = 1.5; // 50% slower
const PROJECTILE_SPEED = 3.5; // 50% slower
const ENEMY_SPEED = 0.5; // 75% slower (50% slower than the original 1)
const INITIAL_SPAWN_INTERVAL = 2000; // Starting spawn interval
const MIN_SPAWN_INTERVAL = 500; // Minimum spawn interval (fastest spawn rate)
const SPAWN_DECREASE_RATE = 50; // How much to decrease spawn interval every 30 seconds
const INITIAL_FIRE_INTERVAL = 500; // Initial fire interval (every 0.5 seconds)
const MIN_FIRE_INTERVAL = 50; // Minimum fire interval (fastest fire rate)

// Configurable difficulty settings
const DIFFICULTY_INTERVAL = 15; // Seconds between difficulty increases (default: 15)
const MAX_DIFFICULTY = 100; // Maximum difficulty level (1-100)
const FIRE_RATE_INCREASE = 0.2; // 20% faster fire rate per difficulty level
const ENEMY_COUNT_MULTIPLIER = 1.3; // Increase enemy count by 20% per level

// Configurable enemy hitbox size
const ENEMY_HITBOX_SIZE = 20; // Size in pixels (previously hardcoded as 10)

// Configurable projectile size and hitbox
const PROJECTILE_SIZE = 40; // Size in pixels for the projectile image
const PROJECTILE_HITBOX_SIZE = 20; // Size in pixels for the projectile hitbox

// Configurable character size and hitbox
const CHARACTER_SIZE = 100; // Size in pixels (increased from 60)
const CHARACTER_HITBOX_SIZE = 20; // Size in pixels for character hitbox

// Debug option to show hitboxes
const SHOW_HITBOXES = false; // Set to false to hide hitbox visualization

// Configurable social links and wallet address
const WALLET_ADDRESS = "Updating...";
const X_PROFILE_URL = "https://x.com";

// Direction types
type Direction = 'up' | 'down' | 'left' | 'right' | null;
type Position = { x: number; y: number };
type ProjectileType = {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  id: number;
};
type EnemyType = Position & { id: number };

function App() {
  // Character state
  const [position, setPosition] = useState<Position>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  
  // Track multiple directions at once for diagonal movement
  const [activeDirections, setActiveDirections] = useState<Set<Direction>>(new Set());
  
  // Game elements state
  const [projectiles, setProjectiles] = useState<ProjectileType[]>([]);
  const [enemies, setEnemies] = useState<EnemyType[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL);
  const [fireInterval, setFireInterval] = useState(INITIAL_FIRE_INTERVAL);
  const [gameTime, setGameTime] = useState(0); // Track game time in seconds
  const [difficultyLevel, setDifficultyLevel] = useState(1); // Current difficulty level (1-100)
  const [showLevelUp, setShowLevelUp] = useState(false); // Show level up notification
  const [lastLevelUp, setLastLevelUp] = useState(0); // Track last level up
  const [copySuccess, setCopySuccess] = useState(false); // Track copy success
  const [enemySpawnCount, setEnemySpawnCount] = useState(1); // Number of enemies to spawn at once
  
  // Use a ref to track animation frame and last shot time
  const animationFrameRef = useRef<number | null>(null);
  const lastShotTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const removedProjectilesRef = useRef<Set<number>>(new Set()); // Track removed projectiles
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize background music
  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/src/Assets/Track001.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.7;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle keyboard input - add direction to active set
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let direction: Direction = null;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        direction = 'up';
        break;
      case 'ArrowDown':
      case 's':
        direction = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
        direction = 'right';
        break;
      case ' ':
        shoot();
        break;
      default:
        break;
    }
    
    if (direction) {
      setActiveDirections(prev => {
        const newDirections = new Set(prev);
        newDirections.add(direction);
        return newDirections;
      });
    }
  }, []);

  // Handle key up - remove direction from active set
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    let direction: Direction = null;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        direction = 'up';
        break;
      case 'ArrowDown':
      case 's':
        direction = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
        direction = 'right';
        break;
      default:
        break;
    }
    
    if (direction) {
      setActiveDirections(prev => {
        const newDirections = new Set(prev);
        newDirections.delete(direction);
        return newDirections;
      });
    }
  }, []);

  // Shooting mechanism
  const shoot = useCallback(() => {
    if (!gameStarted || gameOver) return;
    
    // Shoot in all four directions
    const timestamp = Date.now();
    const halfSize = CHARACTER_SIZE / 2;
    const newProjectiles = [
      { x: position.x + halfSize - PROJECTILE_SIZE/2, y: position.y, speedX: 0, speedY: -PROJECTILE_SPEED, id: timestamp + 1 }, // up
      { x: position.x + halfSize - PROJECTILE_SIZE/2, y: position.y + CHARACTER_SIZE, speedX: 0, speedY: PROJECTILE_SPEED, id: timestamp + 2 }, // down
      { x: position.x, y: position.y + halfSize - PROJECTILE_SIZE/2, speedX: -PROJECTILE_SPEED, speedY: 0, id: timestamp + 3 }, // left
      { x: position.x + CHARACTER_SIZE, y: position.y + halfSize - PROJECTILE_SIZE/2, speedX: PROJECTILE_SPEED, speedY: 0, id: timestamp + 4 } // right
    ];
    
    setProjectiles(prev => [...prev, ...newProjectiles]);
    lastShotTimeRef.current = timestamp;
  }, [position, gameStarted, gameOver]);

  // Check if it's time to shoot based on the current fire interval
  const checkAndShoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotTimeRef.current >= fireInterval) {
      shoot();
    }
  }, [shoot, fireInterval]);

  // Spawn enemies randomly
  const spawnEnemy = useCallback(() => {
    if (!gameStarted || gameOver) return;
    
    // Spawn multiple enemies based on current enemy spawn count
    const newEnemies = [];
    
    for (let i = 0; i < enemySpawnCount; i++) {
      // Randomly choose a side to spawn from
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch (side) {
        case 0: // Top
          x = Math.random() * GAME_WIDTH;
          y = -30;
          break;
        case 1: // Right
          x = GAME_WIDTH + 30;
          y = Math.random() * GAME_HEIGHT;
          break;
        case 2: // Bottom
          x = Math.random() * GAME_WIDTH;
          y = GAME_HEIGHT + 30;
          break;
        case 3: // Left
          x = -30;
          y = Math.random() * GAME_HEIGHT;
          break;
        default:
          x = 0;
          y = 0;
      }
      
      newEnemies.push({ x, y, id: Date.now() + i });
    }
    
    setEnemies(prev => [...prev, ...newEnemies]);
  }, [gameStarted, gameOver, enemySpawnCount]);

  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setGameTime(0);
    setDifficultyLevel(1);
    setSpawnInterval(INITIAL_SPAWN_INTERVAL);
    setFireInterval(INITIAL_FIRE_INTERVAL);
    setPosition({ x: GAME_WIDTH / 2 - CHARACTER_SIZE / 2, y: GAME_HEIGHT / 2 - CHARACTER_SIZE / 2 });
    setActiveDirections(new Set());
    setEnemies([]);
    setProjectiles([]);
    setShowLevelUp(false);
    setLastLevelUp(0);
    setEnemySpawnCount(1);
    lastShotTimeRef.current = Date.now();
    removedProjectilesRef.current.clear();
    
    // Play background music
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Start the animation frame if it's not already running
    if (!animationFrameRef.current) {
      gameLoop();
    }
  };
  
  // Helper function to check collision between projectile and enemy
  const checkCollision = (projectile: ProjectileType, enemy: EnemyType) => {
    // Calculate centers
    const projectileCenter = {
      x: projectile.x + PROJECTILE_SIZE / 2,
      y: projectile.y + PROJECTILE_SIZE / 2
    };
    
    const enemyCenter = {
      x: enemy.x + 22.5, // Half of enemy width (45px)
      y: enemy.y + 22.5  // Half of enemy height (45px)
    };
    
    // Calculate distance between centers
    const dx = projectileCenter.x - enemyCenter.x;
    const dy = projectileCenter.y - enemyCenter.y;
    
    // Check if distance is less than sum of hitbox radii
    return Math.sqrt(dx * dx + dy * dy) < (PROJECTILE_HITBOX_SIZE + ENEMY_HITBOX_SIZE);
  };
  
  // Game loop using requestAnimationFrame instead of setInterval
  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) {
      animationFrameRef.current = null;
      return;
    }
    
    // Check if it's time to shoot
    checkAndShoot();
    
    // Move character based on active directions
    setPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      // Calculate movement based on active directions
      // This allows diagonal movement when multiple keys are pressed
      if (activeDirections.has('up')) {
        newY = Math.max(0, prev.y - CHARACTER_SPEED);
      }
      if (activeDirections.has('down')) {
        newY = Math.min(GAME_HEIGHT - CHARACTER_SIZE, prev.y + CHARACTER_SPEED);
      }
      if (activeDirections.has('left')) {
        newX = Math.max(0, prev.x - CHARACTER_SPEED);
      }
      if (activeDirections.has('right')) {
        newX = Math.min(GAME_WIDTH - CHARACTER_SIZE, prev.x + CHARACTER_SPEED);
      }
      
      return { x: newX, y: newY };
    });
    
    // Move projectiles with velocity
    setProjectiles(prev => {
      return prev
        .map(projectile => ({
          ...projectile,
          x: projectile.x + projectile.speedX,
          y: projectile.y + projectile.speedY
        }))
        .filter(
          projectile =>
            projectile.x >= -20 &&
            projectile.x <= GAME_WIDTH + 20 &&
            projectile.y >= -20 &&
            projectile.y <= GAME_HEIGHT + 20 &&
            !removedProjectilesRef.current.has(projectile.id)
        );
    });
    
    // Move enemies towards player
    setEnemies(prev => {
      return prev.map(enemy => {
        const dx = position.x + CHARACTER_SIZE/2 - enemy.x;
        const dy = position.y + CHARACTER_SIZE/2 - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const vx = (dx / distance) * ENEMY_SPEED;
        const vy = (dy / distance) * ENEMY_SPEED;
        
        return {
          ...enemy,
          x: enemy.x + vx,
          y: enemy.y + vy
        };
      });
    });
    
    // Check collisions - improved collision detection
    const enemyIdsToRemove = new Set<number>();
    const projectileIdsToRemove = new Set<number>();
    
    // Check each projectile against each enemy
    projectiles.forEach(projectile => {
      // Skip already marked projectiles
      if (projectileIdsToRemove.has(projectile.id)) return;
      
      enemies.forEach(enemy => {
        // Skip already marked enemies
        if (enemyIdsToRemove.has(enemy.id)) return;
        
        // Check collision using the improved collision detection
        if (checkCollision(projectile, enemy)) {
          enemyIdsToRemove.add(enemy.id);
          projectileIdsToRemove.add(projectile.id);
          // Add to score
          setScore(prev => prev + 10);
        }
      });
    });
    
    // Update enemies - remove the ones that were hit
    if (enemyIdsToRemove.size > 0) {
      setEnemies(prev => prev.filter(enemy => !enemyIdsToRemove.has(enemy.id)));
    }
    
    // Update projectiles - remove the ones that hit enemies
    if (projectileIdsToRemove.size > 0) {
      // Add to our ref to ensure they're removed in the next frame too
      projectileIdsToRemove.forEach(id => removedProjectilesRef.current.add(id));
      setProjectiles(prev => prev.filter(projectile => !projectileIdsToRemove.has(projectile.id)));
    }
    
    // Check for character collision with enemies
    for (const enemy of enemies) {
      // Calculate centers
      const characterCenter = {
        x: position.x + CHARACTER_SIZE / 2,
        y: position.y + CHARACTER_SIZE / 2
      };
      
      const enemyCenter = {
        x: enemy.x + 22.5, // Half of enemy width (45px)
        y: enemy.y + 22.5  // Half of enemy height (45px)
      };
      
      // Calculate distance between centers
      const dx = characterCenter.x - enemyCenter.x;
      const dy = characterCenter.y - enemyCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if distance is less than sum of character and enemy radii
      if (distance < CHARACTER_HITBOX_SIZE + ENEMY_HITBOX_SIZE) {
        setGameOver(true);
        // Stop music on game over
        if (audioRef.current) {
          audioRef.current.pause();
        }
        break;
      }
    }
    
    // Continue the game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [activeDirections, position, enemies, projectiles, gameStarted, gameOver, checkAndShoot]);

  // Start/stop game loop based on game state
  useEffect(() => {
    if (gameStarted && !gameOver) {
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gameLoop, gameStarted, gameOver]);

  // Game timer and difficulty scaling
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    // Increment game time every second
    const gameTimer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(gameTimer);
  }, [gameStarted, gameOver]);
  
  // Update difficulty level and game parameters based on game time
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    // Every DIFFICULTY_INTERVAL seconds, increase difficulty
    if (gameTime > 0 && gameTime % DIFFICULTY_INTERVAL === 0 && gameTime !== lastLevelUp) {
      // Increase difficulty level up to MAX_DIFFICULTY
      setDifficultyLevel(prev => Math.min(MAX_DIFFICULTY, prev + 1));
      setLastLevelUp(gameTime);
      
      // Increase enemy spawn count based on difficulty level
      setEnemySpawnCount(prev => Math.ceil(prev * ENEMY_COUNT_MULTIPLIER));
      
      // Show level up notification
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [gameTime, gameStarted, gameOver, lastLevelUp]);
  
  // Update spawn interval and fire rate when difficulty changes
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    // Calculate new spawn interval based on difficulty
    const newSpawnInterval = Math.max(
      MIN_SPAWN_INTERVAL,
      INITIAL_SPAWN_INTERVAL - ((difficultyLevel - 1) * SPAWN_DECREASE_RATE)
    );
    setSpawnInterval(newSpawnInterval);
    
    // Calculate new fire interval based on difficulty (20% faster per level)
    // Formula: initial * (1 - increase)^(level-1)
    // This gives a diminishing returns effect so it doesn't get too fast too quickly
    const fireRateMultiplier = Math.pow(1 - FIRE_RATE_INCREASE, difficultyLevel - 1);
    const newFireInterval = Math.max(
      MIN_FIRE_INTERVAL,
      Math.round(INITIAL_FIRE_INTERVAL * fireRateMultiplier)
    );
    setFireInterval(newFireInterval);
    
  }, [difficultyLevel, gameStarted, gameOver]);

  // Enemy spawning with dynamic interval
  useEffect(() => {
    if (!gameStarted || gameOver) {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
      return;
    }
    
    // Clear previous interval if it exists
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
    }
    
    // Set new interval with current spawn rate
    spawnTimerRef.current = setInterval(spawnEnemy, spawnInterval);
    
    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, [spawnInterval, spawnEnemy, gameStarted, gameOver]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Helper function for mobile controls
  const handleMobileDirectionChange = useCallback((direction: Direction) => {
    if (direction === null) {
      setActiveDirections(new Set());
    } else {
      setActiveDirections(new Set([direction]));
    }
  }, []);

  // Calculate difficulty percentage (1-100)
  const getDifficultyPercentage = () => {
    return difficultyLevel;
  };

  // Calculate fire rate increase percentage
  const getFireRatePercentage = () => {
    const baseFireRate = 1000 / INITIAL_FIRE_INTERVAL; // Shots per second at level 1
    const currentFireRate = 1000 / fireInterval; // Current shots per second
    const increasePercentage = Math.round(((currentFireRate / baseFireRate) - 1) * 100);
    return increasePercentage;
  };

  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(WALLET_ADDRESS)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Render hitbox visualization for enemies and projectiles
  const renderHitboxes = () => {
    if (!SHOW_HITBOXES) return null;
    
    return (
      <>
        {/* Character hitbox */}
        <div
          className="absolute border-2 border-red-500"
          style={{
            left: `${position.x + CHARACTER_SIZE/2 - CHARACTER_HITBOX_SIZE}px`,
            top: `${position.y + CHARACTER_SIZE/2 - CHARACTER_HITBOX_SIZE}px`,
            width: `${CHARACTER_HITBOX_SIZE * 2}px`,
            height: `${CHARACTER_HITBOX_SIZE * 2}px`,
            zIndex: 20,
            pointerEvents: 'none',
            borderRadius: '50%'
          }}
        />
        
        {/* Enemy hitboxes */}
        {enemies.map(enemy => (
          <div
            key={`hitbox-enemy-${enemy.id}`}
            className="absolute border-2 border-green-500"
            style={{
              // Center the hitbox on the enemy's center point
              left: `${enemy.x + 22.5 - ENEMY_HITBOX_SIZE}px`, // 22.5 is half of enemy width (45px)
              top: `${enemy.y + 22.5 - ENEMY_HITBOX_SIZE}px`, // 22.5 is half of enemy height (45px)
              width: `${ENEMY_HITBOX_SIZE * 2}px`,
              height: `${ENEMY_HITBOX_SIZE * 2}px`,
              zIndex: 20,
              pointerEvents: 'none',
              borderRadius: '50%'
            }}
          />
        ))}
        
        {/* Projectile hitboxes */}
        {projectiles.map(projectile => (
          <div
            key={`hitbox-projectile-${projectile.id}`}
            className="absolute border-2 border-blue-500"
            style={{
              // Center the hitbox on the projectile's center point
              left: `${projectile.x + PROJECTILE_SIZE/2 - PROJECTILE_HITBOX_SIZE}px`,
              top: `${projectile.y + PROJECTILE_SIZE/2 - PROJECTILE_HITBOX_SIZE}px`,
              width: `${PROJECTILE_HITBOX_SIZE * 2}px`,
              height: `${PROJECTILE_HITBOX_SIZE * 2}px`,
              zIndex: 20,
              pointerEvents: 'none',
              borderRadius: '50%'
            }}
          />
        ))}
      </>
    );
  };

  // Render the level up notification
  const renderLevelUp = () => {
    if (!showLevelUp) return null;
    
    return (
      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <div className="pixel-border bg-cream p-2 text-center" style={{ maxWidth: '200px' }}>
          <div className="pixel-text text-sm">
            <span className="text-black">YOU FIRE </span>
            <span className="text-red-600">{getFireRatePercentage()}%</span>
            <span className="text-black"> FASTER</span>
          </div>
        </div>
      </div>
    );
  };

  // Render social buttons
  const renderSocialButtons = () => {
    return (
      <div className="fixed top-4 right-4 flex flex-col items-end space-y-2 z-50">
        <div className="relative">
          <button 
            onClick={copyToClipboard}
            className="pixel-button flex items-center space-x-2 bg-solana-purple text-white text-xs py-1 px-2"
          >
            <Copy size={12} />
            <span>COPY CA</span>
          </button>
          {copySuccess && (
            <div className="absolute -bottom-8 right-0 bg-black text-white px-2 py-1 rounded text-xs">
              Copied!
            </div>
          )}
        </div>
        
        <div className="pixel-button bg-black text-white text-xs py-1 px-2 flex justify-center items-center">
          <code className="font-mono text-[10px] break-all max-w-[150px] block">
            {WALLET_ADDRESS}
          </code>
        </div>
        
        <a 
          href={X_PROFILE_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="pixel-button flex items-center space-x-2 bg-black text-white text-xs py-1 px-2"
        >
          <Twitter size={12} />
          <span>FOLLOW</span>
        </a>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 pixel-font">
      {/* Social buttons */}
      {renderSocialButtons()}
      
      {/* Game header with pixel art styling */}
      <div className="mb-4 text-white w-full max-w-[1000px]">
        <h1 className="text-3xl font-bold mb-2 text-center pixel-title text-solana-purple">SOLANA SURVIVOR</h1>
        {gameStarted && (
          <div className="flex justify-between items-center px-4 py-2 pixel-border bg-cream">
            <div className="flex items-center">
              
              <p className="text-xl text-black pixel-text">SCORE: {score}</p>
            </div>
            
            <div className="flex items-center">
              
              <p className="text-xl text-black pixel-text">TIME: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</p>
            </div>
            
            <div className="flex items-center">
              
              <p className="text-xl text-black pixel-text">LVL: {getDifficultyPercentage()}/100</p>
            </div>
          </div>
        )}
      </div>
      
      <div 
        className="relative overflow-hidden pixel-border"
        style={{ 
          width: GAME_WIDTH, 
          height: GAME_HEIGHT,
          backgroundImage: "url('/src/Assets/Background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center pixel-border bg-cream p-8 max-w-[600px]">
              <h2 className="text-3xl font-bold text-solana-purple mb-4 pixel-title">SOLANA SURVIVOR</h2>
              <p className="text-black mb-6 pixel-text">
                MOVE WITH WASD OR ARROW KEYS.<br/>
                SHOOT WITH SPACEBAR.<br/>
                <br/>
                DEFEND YOURSELF FROM THE SOLANA COINS!<br/>
                <br/>
                <span className="text-red-600">WARNING: ENEMIES WILL SPAWN FASTER AS TIME PASSES!</span>
              </p>
              <button
                className="pixel-button"
                onClick={startGame}
              >
                START GAME
              </button>
            </div>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center pixel-border bg-cream p-8">
              <h2 className="text-3xl font-bold text-red-600 mb-4 pixel-title">GAME OVER</h2>
              <p className="text-2xl text-black mb-2 pixel-text">YOUR SCORE: {score}</p>
              <p className="text-xl text-black mb-6 pixel-text">SURVIVED: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</p>
              <button
                className="pixel-button"
                onClick={startGame}
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
        
        {gameStarted && !gameOver && (
          <>
            <Character x={position.x} y={position.y} size={CHARACTER_SIZE} />
            
            {projectiles.map((projectile) => (
              <Projectile
                key={projectile.id}
                x={projectile.x}
                y={projectile.y}
                size={PROJECTILE_SIZE}
              />
            ))}
            
            {enemies.map(enemy => (
              <Enemy
                key={enemy.id}
                x={enemy.x}
                y={enemy.y}
              />
            ))}
            
            {/* Render hitboxes if enabled */}
            {renderHitboxes()}
            
            {/* Render level up notification */}
            {renderLevelUp()}
          </>
        )}
      </div>
      
      {gameStarted && !gameOver && (
        <GameControls
          onMove={handleMobileDirectionChange}
          onShoot={shoot}
        />
      )}
      
      <div className="mt-4 text-white text-sm max-w-[1000px] pixel-border bg-cream p-4">
        <p className="text-black pixel-text">USE WASD OR ARROW KEYS TO MOVE (INCLUDING DIAGONALLY). BULLETS FIRE AUTOMATICALLY EVERY {(fireInterval / 1000).toFixed(2)} SECONDS.</p>
        <p className="text-black pixel-text">DIFFICULTY INCREASES EVERY {DIFFICULTY_INTERVAL} SECONDS - ENEMIES WILL SPAWN MORE FREQUENTLY AND BULLETS WILL FIRE FASTER!</p>
        {SHOW_HITBOXES && (
          <div className="text-green-500 mt-2">
            <p className="pixel-text">Debug: Character size: {CHARACTER_SIZE}px, hitbox: {CHARACTER_HITBOX_SIZE}px</p>
            <p className="pixel-text">Debug: Enemy hitbox size: {ENEMY_HITBOX_SIZE}px</p>
            <p className="pixel-text">Debug: Projectile size: {PROJECTILE_SIZE}px, hitbox: {PROJECTILE_HITBOX_SIZE}px</p>
            <p className="pixel-text">Debug: Fire interval: {fireInterval}ms (Initial: {INITIAL_FIRE_INTERVAL}ms)</p>
            <p className="pixel-text">Debug: Spawn interval: {spawnInterval}ms (Initial: {INITIAL_SPAWN_INTERVAL}ms)</p>
          </div>
        )}
      </div>
      
      {/* Copyright footer */}
      <div className="mt-4 mb-4 text-center">
        <p className="text-white text-xs pixel-text">© 2025, SOLANA SURVIVOR</p>
      </div>
    </div>
  );
}

export default App;