import React, { useState, useEffect, useRef } from 'react';
import GameMenu from './GameMenu';

// GamePlayScreen Component
const GamePlayScreen = ({ onHomeClick, currentGame, canvasRef }) => (
  <div className="gameboy-game-screen w-full h-full bg-black">
    <div className="relative w-full h-full bg-black overflow-hidden">
      <button
        className="absolute top-2 left-2 z-10 px-2 py-1 bg-fuchsia-500 text-black text-xs font-bold rounded hover:bg-fuchsia-400 transition-colors"
        onClick={onHomeClick}
      >
        MENU
      </button>
      {currentGame && (
        <div className="absolute top-2 left-16 z-10 text-fuchsia-500 text-xs font-bold">
          {currentGame.title}
        </div>
      )}
      <div className="absolute inset-0 p-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          id="gameCanvas"
          className="max-w-full max-h-full border border-cyan-400 shadow-md shadow-fuchsia-500/30"
          width="600"
          height="360"
        ></canvas>
      </div>
    </div>
  </div>
);

// ArcadeScreen Component
const ArcadeScreen = () => {
  // Start directly with menu state instead of intro
  const [gameState, setGameState] = useState('menu');
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

  const handleHomeClick = () => {
    setGameState('menu');
    setCurrentGame(null);
  };

  const handleGameSelect = (game) => {
    setCurrentGame(game);
    setGameState('playing');
  };

  return (
    <div className="w-full h-full gameboy-screen-content">
      {gameState === 'menu' && (
        <div className="w-full h-full gameboy-game-menu">
          <GameMenu onGameSelect={handleGameSelect} />
        </div>
      )}
      {gameState === 'playing' && (
        <GamePlayScreen 
          onHomeClick={handleHomeClick} 
          currentGame={currentGame} 
          canvasRef={gameCanvasRef} 
        />
      )}
    </div>
  );
};

export default ArcadeScreen;