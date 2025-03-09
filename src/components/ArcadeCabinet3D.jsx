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
        
        {/* Fixed camera position for front view only - no OrbitControls */}
        <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={50} />
        
        <Monitor>
          {children}
        </Monitor>
        
        {/* Buttons and joystick moved further away from the monitor */}
        <Buttons position={[-2.5, -1, 0.5]} />
        <Joystick position={[2.5, -1, 0.5]} />
      </Canvas>
    </div>
  );
}

export default ArcadeCabinet3D;