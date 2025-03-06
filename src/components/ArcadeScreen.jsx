import React, { useState, useEffect, useRef } from 'react';
import GameMenu from './GameMenu';

// IntroScreen Component
const IntroScreen = ({ onStartClick }) => {
  const [blinking, setBlinking] = useState(true);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking((prev) => !prev);
    }, 800);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-[90vh] bg-black">
      <div className="relative w-full max-w-5xl aspect-video bg-black p-2 border-2 border-black">
        <div className="absolute inset-0 border-4 border-fuchsia-500 opacity-100"></div>
        <div className="absolute inset-0 m-1 border-2 border-cyan-400 opacity-100"></div>
        <div className="flex flex-col items-center justify-center h-full">
          <div
            className="mb-8 text-6xl font-bold text-fuchsia-500 tracking-wider"
            style={{
              textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff',
            }}
          >
            XARCADE
          </div>
          <div
            className={`text-xl font-bold text-cyan-400 cursor-pointer ${
              blinking ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff',
              transition: 'opacity 0.2s ease-in-out',
            }}
            onClick={onStartClick}
          >
            INSERT COIN
          </div>
        </div>
      </div>
    </div>
  );
};

// MenuScreen Component
const MenuScreen = ({ onHomeClick, onGameSelect }) => (
  <div className="flex items-center justify-center w-full h-[90vh] bg-black">
    <div className="relative w-full max-w-5xl aspect-video bg-black p-2 border-2 border-black overflow-hidden">
      <div className="absolute inset-0 border-4 border-fuchsia-500 opacity-100"></div>
      <div className="absolute inset-0 m-1 border-2 border-cyan-400 opacity-100"></div>
      <button
        className="absolute top-4 left-4 z-10 px-3 py-1 bg-fuchsia-500 text-black font-bold rounded hover:bg-fuchsia-400 transition-colors"
        onClick={onHomeClick}
      >
        HOME
      </button>
      <div className="absolute inset-0 mt-12 p-4 overflow-auto">
        <GameMenu onGameSelect={onGameSelect} />
      </div>
    </div>
  </div>
);

// GamePlayScreen Component
const GamePlayScreen = ({ onHomeClick, currentGame, canvasRef }) => (
  <div className="flex items-center justify-center w-full h-[90vh] bg-black">
    <div className="relative w-full max-w-5xl aspect-video bg-black p-2 border-2 border-black overflow-hidden">
      <div className="absolute inset-0 border-4 border-fuchsia-500 opacity-100"></div>
      <div className="absolute inset-0 m-1 border-2 border-cyan-400 opacity-100"></div>
      <button
        className="absolute top-4 left-4 z-10 px-3 py-1 bg-fuchsia-500 text-black font-bold rounded hover:bg-fuchsia-400 transition-colors"
        onClick={onHomeClick}
      >
        HOME
      </button>
      {currentGame && (
        <div className="absolute top-4 left-20 z-10 text-fuchsia-500 font-bold">
          {currentGame.title}
        </div>
      )}
      <div className="absolute inset-0 p-8 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          id="gameCanvas"
          className="max-w-full max-h-full border-2 border-cyan-400 shadow-lg shadow-fuchsia-500/50"
          width="800"
          height="600"
        ></canvas>
      </div>
    </div>
  </div>
);

// ArcadeScreen Component
const ArcadeScreen = () => {
  const [gameState, setGameState] = useState('intro');
  const [currentGame, setCurrentGame] = useState(null);
  const gameCanvasRef = useRef(null);
  const gameInstanceRef = useRef(null);

  // Game initialization and cleanup
  useEffect(() => {
    let isMounted = true;

    if (gameState === 'playing' && currentGame && gameCanvasRef.current) {
      const initGame = async () => {
        try {
          if (currentGame.id === 'game1') {
            const { default: gameModule } = await import('../../public/endersgame/endersgame.js');
            if (!isMounted) return;
            const gameInstance = gameModule.init(gameCanvasRef.current);
            gameInstanceRef.current = gameInstance;
          }
        } catch (error) {
          console.error('Failed to load game module:', error);
        }
      };
      initGame();
    }

    return () => {
      isMounted = false;
      if (gameInstanceRef.current && typeof gameInstanceRef.current.cleanup === 'function') {
        gameInstanceRef.current.cleanup();
        gameInstanceRef.current = null;
      }
    };
  }, [gameState, currentGame]);

  // Escape key handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && gameState === 'playing') {
        handleHomeClick();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  const handleStartClick = () => setGameState('menu');

  const handleHomeClick = () => {
    setGameState('intro');
    setCurrentGame(null);
  };

  const handleGameSelect = (game) => {
    setCurrentGame(game);
    setGameState('playing');
  };

  return (
    <div className="w-full h-[90vh] bg-black">
      {gameState === 'intro' && <IntroScreen onStartClick={handleStartClick} />}
      {gameState === 'menu' && <MenuScreen onHomeClick={handleHomeClick} onGameSelect={handleGameSelect} />}
      {gameState === 'playing' && (
        <GamePlayScreen onHomeClick={handleHomeClick} currentGame={currentGame} canvasRef={gameCanvasRef} />
      )}
    </div>
  );
};

export default ArcadeScreen;