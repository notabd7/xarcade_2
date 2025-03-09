import React, { useEffect } from 'react';

// This component adds interactivity to the GameBoy buttons
const ButtonInteractivity = () => {
  useEffect(() => {
    // Get all buttons
    const buttons = document.querySelectorAll('.d-pad-button, .a-button, .b-button, .start-button, .select-button, .l-button, .r-button');
    
    const handleMouseDown = (button) => {
      if (button.classList.contains('start-button') || button.classList.contains('select-button')) {
        button.style.transform = 'translateZ(8px) rotate(-30deg)';
      } else if (button.classList.contains('l-button') || button.classList.contains('r-button')) {
        button.style.transform = 'translateZ(-1px)';
      } else if (button.classList.contains('d-pad-button')) {
        button.style.transform = 'translateZ(2px)';
      } else {
        button.style.transform = 'translateZ(8px)';
      }
    };
    
    const handleMouseUp = (button) => {
      if (button.classList.contains('start-button') || button.classList.contains('select-button')) {
        button.style.transform = 'translateZ(12px) rotate(-30deg)';
      } else if (button.classList.contains('l-button') || button.classList.contains('r-button')) {
        button.style.transform = 'translateZ(2px)';
      } else if (button.classList.contains('d-pad-button')) {
        button.style.transform = 'translateZ(6px)';
      } else {
        button.style.transform = 'translateZ(15px)';
      }
    };

    // Add event listeners to all buttons
    buttons.forEach(button => {
      button.addEventListener('mousedown', () => handleMouseDown(button));
      button.addEventListener('mouseup', () => handleMouseUp(button));
      button.addEventListener('mouseleave', () => handleMouseUp(button));
      
      // Add touch support for mobile
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleMouseDown(button);
      });
      
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleMouseUp(button);
      });
    });

    // Clean up event listeners
    return () => {
      buttons.forEach(button => {
        button.removeEventListener('mousedown', () => handleMouseDown(button));
        button.removeEventListener('mouseup', () => handleMouseUp(button));
        button.removeEventListener('mouseleave', () => handleMouseUp(button));
        button.removeEventListener('touchstart', (e) => {
          e.preventDefault();
          handleMouseDown(button);
        });
        button.removeEventListener('touchend', (e) => {
          e.preventDefault();
          handleMouseUp(button);
        });
      });
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ButtonInteractivity;