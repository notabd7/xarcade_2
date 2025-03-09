import React, { useState } from 'react';

function Buttons({ position = [0, 0, 0] }) {
  const [pressedButton, setPressedButton] = useState(null);
  
  const handleButtonPress = (button) => {
    setPressedButton(button);
    
    // Map buttons to keyboard events
    let key;
    switch (button) {
      case 'a': key = ' '; break; // Space/fire
      case 'b': key = 'f'; break; // Alternative fire
      default: key = null;
    }
    
    if (key) {
      const keyEvent = new KeyboardEvent('keydown', { key, bubbles: true });
      window.dispatchEvent(keyEvent);
      
      // Release after 200ms
      setTimeout(() => {
        setPressedButton(null);
        const keyUpEvent = new KeyboardEvent('keyup', { key, bubbles: true });
        window.dispatchEvent(keyUpEvent);
      }, 200);
    }
  };
  
  // Brighter, more visible colors
  const buttonColors = {
    a: "#ff3333",
    b: "#3366ff"
  };
  
  // Emissive colors for glow effect
  const buttonEmissive = {
    a: "#ff0000",
    b: "#0033ff"
  };
  
  return (
    <group position={position}>
      {/* Control panel */}
      <mesh receiveShadow position={[0, 0, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Just two buttons - larger and more visible */}
      {['a', 'b'].map((button, i) => (
        <mesh
          key={button}
          position={[
            i === 0 ? -0.3 : 0.3,
            0.15,
            0
          ]}
          scale={[1, pressedButton === button ? 0.7 : 1, 1]}
          castShadow
          onClick={() => handleButtonPress(button)}
        >
          <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
          <meshStandardMaterial 
            color={buttonColors[button]} 
            emissive={buttonEmissive[button]}
            emissiveIntensity={0.5}
            metalness={0.1}
            roughness={0.3}
          />
        </mesh>
      ))}
      
      {/* Text labels directly on buttons for better visibility */}
      {['A', 'B'].map((label, i) => (
        <group 
          key={label} 
          position={[i === 0 ? -0.3 : 0.3, 0.2, 0]} 
          rotation={[-Math.PI/2, 0, 0]}
        >
          {/* Use simple meshes for letters instead of TextGeometry */}
          <mesh>
            <planeGeometry args={[0.15, 0.15]} />
            <meshBasicMaterial 
              color="white" 
              transparent 
              opacity={0.9}
              side={2} // Double-sided
            />
          </mesh>
          
          {/* Letter meshes */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshBasicMaterial 
              color="black"
              transparent
              opacity={1}
              side={2} // Double-sided
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default Buttons;