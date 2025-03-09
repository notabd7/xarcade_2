import React, { useState, useEffect } from 'react';

// Game data with GIFs
const games = [
  {
    id: 'game1',
    title: 'Enders Game',
    description: 'Classic arcade shooter',
    imageUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGZ5eDlqa2R3b3FmZW5iem1laHU0ODE5Y2ZpaDEycXU5dnd1bXlmcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2QDNEIwuqlSFjWYo/giphy.gif',
    available: true,
  },
  {
    id: 'game2',
    title: 'Pac-Man',
    description: 'Navigate mazes and collect dots',
    imageUrl: 'https://media.tenor.com/tKU0dI2GrWEAAAAC/pacman-video-game.gif',
    available: true,
  },
];

const GameCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [gameInstance, setGameInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameCanvasRef = React.useRef(null);

  // Handle D-pad navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPlaying) return; // Don't navigate while playing
      
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev === 0 ? games.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev === games.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'Enter') {
        handlePlayGame(games[currentIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isPlaying]);

  // Handle click events on D-pad buttons and A button
  useEffect(() => {
    if (isPlaying) return;

    const leftButton = document.querySelector('.d-pad-left');
    const rightButton = document.querySelector('.d-pad-right');
    const aButton = document.querySelector('.a-button');

    const handleLeftClick = () => setCurrentIndex(prev => (prev === 0 ? games.length - 1 : prev - 1));
    const handleRightClick = () => setCurrentIndex(prev => (prev === games.length - 1 ? 0 : prev + 1));
    const handleAClick = () => handlePlayGame(games[currentIndex]);

    if (leftButton) leftButton.addEventListener('click', handleLeftClick);
    if (rightButton) rightButton.addEventListener('click', handleRightClick);
    if (aButton) aButton.addEventListener('click', handleAClick);

    return () => {
      if (leftButton) leftButton.removeEventListener('click', handleLeftClick);
      if (rightButton) rightButton.removeEventListener('click', handleRightClick);
      if (aButton) aButton.removeEventListener('click', handleAClick);
    };
  }, [currentIndex, isPlaying]);

  const handlePlayGame = async (game) => {
    if (!game.available || isInitializing) return;
    
    setIsInitializing(true);
    setIsPlaying(true);
    
    try {
      if (game.id === 'game1') {
        const { default: gameModule } = await import('../../public/endersgame/endersgame.js');
        
        // Wait for the canvas to be in the DOM
        setTimeout(() => {
          const canvas = gameCanvasRef.current;
          if (canvas) {
            const instance = gameModule.init(canvas);
            setGameInstance(instance);
          }
          setIsInitializing(false);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load game module:', error);
      setIsInitializing(false);
      setIsPlaying(false);
    }
  };

  const handleBackToMenu = () => {
    // Clean up game
    if (gameInstance && typeof gameInstance.cleanup === 'function') {
      gameInstance.cleanup();
    }
    setGameInstance(null);
    setIsPlaying(false);
  };

  // Handle escape key to go back to menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPlaying && (e.key === 'Escape' || e.key === 'b' || e.key === 'B')) {
        handleBackToMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameInstance]);

  // Handle B button click to go back
  useEffect(() => {
    if (!isPlaying) return;

    const bButton = document.querySelector('.b-button');
    
    const handleBClick = () => handleBackToMenu();

    if (bButton) bButton.addEventListener('click', handleBClick);

    return () => {
      if (bButton) bButton.removeEventListener('click', handleBClick);
    };
  }, [isPlaying]);

  const currentGame = games[currentIndex];

  if (isPlaying) {
    return (
      <div className="game-screen">
        <canvas
          ref={gameCanvasRef}
          id="gameCanvas"
          className="game-canvas"
          width="600" 
          height="400"
        />
        <div className="game-controls">
          <div className="game-title">{currentGame.title}</div>
          <button onClick={handleBackToMenu} className="back-button">BACK (B)</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-carousel">
      <div className="game-single-card">
        <div className="game-title">{currentGame.title}</div>
        <div className="game-image-container">
          <img 
            src={currentGame.imageUrl} 
            alt={currentGame.title} 
            className="game-image"
          />
          {!currentGame.available && (
            <div className="coming-soon-overlay">
              <span>COMING SOON</span>
            </div>
          )}
        </div>
        <div className="game-description">{currentGame.description}</div>
      </div>
    </div>
  );
};

export default GameCarousel;