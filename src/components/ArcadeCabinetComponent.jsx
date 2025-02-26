import React, { useEffect, useRef, useState } from 'react';
import ArcadeCabinet from '../three/ArcadeCabinet';

const ArcadeCabinetComponent = () => {
  const containerRef = useRef(null);
  const arcadeCabinetRef = useRef(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [gameList, setGameList] = useState([
    { id: 'aesteroids', name: 'AESTEROIDS', available: true },
    { id: 'spaceinvaders', name: 'SPACE INVADERS', available: false },
    { id: 'galaga', name: 'GALAGA', available: false }
  ]);

  useEffect(() => {
    // Initialize the 3D cabinet
    if (containerRef.current && !arcadeCabinetRef.current) {
      arcadeCabinetRef.current = new ArcadeCabinet(containerRef.current);
    }

    // Clean up function
    return () => {
      if (arcadeCabinetRef.current) {
        // Perform any necessary cleanup
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        arcadeCabinetRef.current = null;
      }
    };
  }, []);

  // Function to load a game in the arcade cabinet
  const loadGame = (gameId) => {
    if (gameId === 'aesteroids') {
      // Create an iframe to load the game
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = '/aesteroids/index.html';
      iframe.onload = () => {
        // Once the game loads, get its canvas
        const gameCanvas = iframe.contentDocument.getElementById('gameCanvas');
        if (gameCanvas && arcadeCabinetRef.current) {
          // Connect the game canvas to the 3D cabinet
          arcadeCabinetRef.current.connectGame(gameCanvas);
          setCurrentGame('aesteroids');
        }
      };
      document.body.appendChild(iframe);
    }
  };

  // Display loading state while 3D model initializes
  return (
    <div className="arcade-cabinet-container">
      <div 
        ref={containerRef} 
        className="cabinet-3d-container" 
        style={{ width: '100%', height: '80vh' }}
      ></div>
      
      {/* Game selection UI outside of 3D view (for development) */}
      <div className="game-selection-ui">
        <h3>Select Game:</h3>
        <div className="game-buttons">
          {gameList.map(game => (
            <button 
              key={game.id}
              onClick={() => game.available && loadGame(game.id)}
              disabled={!game.available}
              className={`game-button ${currentGame === game.id ? 'active' : ''}`}
            >
              {game.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArcadeCabinetComponent;