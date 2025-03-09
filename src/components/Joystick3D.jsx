import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';

function Joystick({ position = [0, 0, 0] }) {
  const joystickRef = useRef();
  const [joystickState, setJoystickState] = useState({ x: 0, y: 0 });
  
  // Handle joystick movement
  const bind = useDrag(({ offset: [x, y] }) => {
    // Limit range of motion
    const clampedX = Math.max(-15, Math.min(15, x));
    const clampedY = Math.max(-15, Math.min(15, y));
    
    setJoystickState({ x: clampedX / 15, y: clampedY / 15 });
    
    // Trigger game controls (arrow keys)
    if (Math.abs(clampedX) > 7) {
      const keyEvent = new KeyboardEvent('keydown', { 
        key: clampedX > 0 ? 'ArrowRight' : 'ArrowLeft',
        bubbles: true 
      });
      window.dispatchEvent(keyEvent);
    }
    
    if (Math.abs(clampedY) > 7) {
      const keyEvent = new KeyboardEvent('keydown', { 
        key: clampedY > 0 ? 'ArrowDown' : 'ArrowUp',
        bubbles: true 
      });
      window.dispatchEvent(keyEvent);
    }
  });
  
  // Animate joystick position
  useFrame(() => {
    if (joystickRef.current) {
      joystickRef.current.rotation.x = joystickState.y * 0.3;
      joystickRef.current.rotation.z = -joystickState.x * 0.3;
    }
  });
  
  return (
    <group position={position}>
      {/* Joystick panel */}
      <mesh receiveShadow position={[0, 0, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Joystick base - smaller */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.1, 32]} />
        <meshStandardMaterial 
          color="#444444"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Joystick handle - smaller */}
      <group ref={joystickRef} position={[0, 0.15, 0]} {...bind()}>
        <mesh castShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.5, 16]} />
          <meshStandardMaterial 
            color="red"
            emissive="red"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh castShadow position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial 
            color="red"
            emissive="red"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}

export default Joystick;