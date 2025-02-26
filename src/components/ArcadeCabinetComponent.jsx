import React, { useEffect, useRef, useState } from 'react';
import ArcadeCabinet from '../three/ArcadeCabinet';
import './ArcadeCabinet.css';

const ArcadeCabinetComponent = () => {
  const containerRef = useRef(null);
  const arcadeCabinetRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('ArcadeCabinetComponent mounted');
    
    // Initialize the 3D cabinet
    if (containerRef.current && !arcadeCabinetRef.current) {
      try {
        console.log('Creating new ArcadeCabinet instance');
        arcadeCabinetRef.current = new ArcadeCabinet(containerRef.current);
        
        // Initialize with game menu
        setTimeout(() => {
          if (arcadeCabinetRef.current && arcadeCabinetRef.current.screenMesh) {
            arcadeCabinetRef.current.selectedGameIndex = 0;
            arcadeCabinetRef.current.createGameMenu();
            setLoading(false);
          }
        }, 2000); // Give time for the model to load
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
        // Clean up event listeners
        document.removeEventListener('keydown', arcadeCabinetRef.current.handleKeyPress);
        document.removeEventListener('wheel', arcadeCabinetRef.current.handleScroll);
        
        // Clean up container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        arcadeCabinetRef.current = null;
      }
    };
  }, []);

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
      
      <div className="arcade-instructions">
        <p>Use <span className="key">↑</span> <span className="key">↓</span> arrow keys or scroll to select games</p>
        <p>Press <span className="key">Enter</span> to play Enders Game</p>
      </div>
    </div>
  );
};

export default ArcadeCabinetComponent;