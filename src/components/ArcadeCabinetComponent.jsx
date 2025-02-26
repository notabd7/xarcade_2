import React, { useEffect, useRef, useState } from 'react';
import ArcadeCabinet from '../three/ArcadeCabinet';
import './ArcadeCabinet.css';

const ArcadeCabinetComponent = () => {
  const containerRef = useRef(null);
  const arcadeCabinetRef = useRef(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameList, setGameList] = useState([
    { id: 'aesteroids', name: 'AESTEROIDS', available: true },
    { id: 'spaceinvaders', name: 'SPACE INVADERS', available: false },
    { id: 'galaga', name: 'GALAGA', available: false }
  ]);

  useEffect(() => {
    console.log('ArcadeCabinetComponent mounted');
    console.log('Container ref:', containerRef.current);
    
    // Initialize the 3D cabinet
    if (containerRef.current && !arcadeCabinetRef.current) {
      try {
        console.log('Creating new ArcadeCabinet instance');
        arcadeCabinetRef.current = new ArcadeCabinet(containerRef.current);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing ArcadeCabinet:', err);
        setError(`Failed to initialize 3D scene: ${err.message}`);
        setLoading(false);
      }
    }

    // Clean up function
    return () => {
      console.log('ArcadeCabinetComponent unmounting');
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
    console.log(`Loading game: ${gameId}`);
    if (gameId === 'aesteroids') {
      try {
        // Create an iframe to load the game
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = '/aesteroids/index.html';
        iframe.onload = () => {
          // Once the game loads, get its canvas
          console.log('Game iframe loaded');
          try {
            const gameCanvas = iframe.contentDocument.getElementById('gameCanvas');
            if (gameCanvas && arcadeCabinetRef.current) {
              // Connect the game canvas to the 3D cabinet
              arcadeCabinetRef.current.connectGame(gameCanvas);
              setCurrentGame('aesteroids');
              console.log('Game connected to cabinet');
            } else {
              console.error('Game canvas or arcade cabinet not found', {
                gameCanvas: !!gameCanvas,
                arcadeCabinet: !!arcadeCabinetRef.current
              });
            }
          } catch (error) {
            console.error('Error accessing iframe content:', error);
          }
        };
        document.body.appendChild(iframe);
      } catch (error) {
        console.error('Error loading game:', error);
      }
    }
  };

  // Display loading state while 3D model initializes
  return (
    <div className="arcade-cabinet-container">
      <div 
        ref={containerRef} 
        className="cabinet-3d-container" 
        style={{ width: '100%', height: '80vh' }}
      >
        {loading && (
          <div className="loading-overlay">
            <p>Loading 3D Cabinet...</p>
          </div>
        )}
        
        {error && (
          <div className="error-overlay">
            <p>Error: {error}</p>
          </div>
        )}
      </div>
      
      {/* Game selection UI outside of 3D view */}
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