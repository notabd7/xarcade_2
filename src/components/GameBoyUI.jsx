import React, { useRef, useEffect } from 'react';
import ButtonInteractivity from './ButtonInteractivity';

const GameBoyUI = ({ children }) => {
  const canvasRef = useRef(null);
  
  // Initialize the screen with GameBoy background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Match canvas dimensions to its container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0066CC');
    gradient.addColorStop(1, '#003366');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="gba-container">
      <div className="screen-bezel">
        {/* The canvas serves as the background */}
        <canvas ref={canvasRef} id="screen" className="screen" width="667" height="500"></canvas>
        
        {/* Overlay for child components (game menu, gameplay) */}
        <div className="screen-content">
          {children}
        </div>
      </div>
      
      {/* D-pad */}
      <div className="d-pad">
        <div className="d-pad-button d-pad-up" data-key="ArrowUp"></div>
        <div className="d-pad-button d-pad-right" data-key="ArrowRight"></div>
        <div className="d-pad-button d-pad-down" data-key="ArrowDown"></div>
        <div className="d-pad-button d-pad-left" data-key="ArrowLeft"></div>
      </div>
      
      {/* Action buttons */}
      <div className="a-button" data-key="a">A</div>
      <div className="b-button" data-key="b">B</div>
      
      {/* Start and Select buttons */}
      <div className="start-button" data-key="Enter"></div>
      <div className="select-button" data-key="Shift"></div>
      
      {/* Shoulder buttons */}
      <div className="shoulder-button-area left">
        <div className="shoulder-curve left"></div>
        <div className="l-button" data-key="q"></div>
      </div>
      
      <div className="shoulder-button-area right">
        <div className="shoulder-curve right"></div>
        <div className="r-button" data-key="e"></div>
      </div>
      
      <div className="logo">GAME BOY ADVANCE</div>
      <div className="speaker-grille"></div>
      
      {/* Add button interactivity */}
      <ButtonInteractivity />
    </div>
  );
};

export default GameBoyUI;