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
        <canvas ref={canvasRef} id="screen" className="screen" width="667" height="400"></canvas>
        
        {/* Overlay for child components (game menu, gameplay) */}
        <div className="screen-content">
          {children}
        </div>
      </div>
      
      {/* D-pad */}
      <div className="d-pad">
        <div className="d-pad-button d-pad-up"></div>
        <div className="d-pad-button d-pad-right"></div>
        <div className="d-pad-button d-pad-down"></div>
        <div className="d-pad-button d-pad-left"></div>
      </div>
      
      {/* Action buttons */}
      <div className="a-button">A</div>
      <div className="b-button">B</div>
      
      {/* Start and Select buttons */}
      <div className="start-button"></div>
      <div className="select-button"></div>
      
      {/* Shoulder buttons */}
      <div className="shoulder-button-area left">
        <div className="shoulder-curve left"></div>
        <div className="l-button"></div>
      </div>
      
      <div className="shoulder-button-area right">
        <div className="shoulder-curve right"></div>
        <div className="r-button"></div>
      </div>
      
      <div className="logo">GAME BOY ADVANCE</div>
      <div className="speaker-grille"></div>
      
      {/* Add button interactivity */}
      <ButtonInteractivity />
    </div>
  );
};

export default GameBoyUI;