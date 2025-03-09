import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Monitor from './Monitor3D';
import Joystick from './Joystick3D';
import Buttons from './Buttons3D';

function ArcadeCabinet3D({ children }) {
  return (
    <div className="canvas-container h-screen">
      <Canvas shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[0, 5, 8]} intensity={1} castShadow />
        <spotLight position={[0, 5, 10]} angle={0.3} penumbra={0.8} intensity={1.5} castShadow />
        
        {/* Adjusted camera position and angle to look down at the setup */}
        <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={40} />
        
        {/* Monitor positioned higher, like it's on a desk */}
        <group position={[0, 4.5, 0]}>
          <Monitor>
            {children}
          </Monitor>
        </group>
        
        {/* Desk surface */}
        <mesh receiveShadow position={[0, 2.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 14]} />
          <meshStandardMaterial color="white" />
        </mesh>
        
        {/* Controls positioned in front of the monitor on the desk surface */}
        <group position={[-2, 0.3, 3]}>
          {/* Buttons on the left */}
          <Buttons position={[-2.5, -1, 0.5]} />
          
          {/* Joystick on the right */}
          <Joystick position={[-2, 0.3, 3]} />
        </group>
      </Canvas>
    </div>
  );
}

export default ArcadeCabinet3D;