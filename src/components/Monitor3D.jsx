import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

function Monitor({ children }) {
  const monitorRef = useRef();
  
  return (
    <group ref={monitorRef}>
      {/* Monitor base */}
      <mesh position={[0, -1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.1, 0.8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Monitor stand */}
      <mesh position={[0, -1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Monitor outer frame - with glow effect */}
      <mesh position={[0, 0, -0.01]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 2.6, 0.05]} />
        <meshStandardMaterial 
          color="#ff00ff" 
          emissive="#ff00ff"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Monitor inner frame */}
      <mesh position={[0, 0, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.4, 0.1]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      
      {/* Screen using Html with proper scaling to fill the monitor */}
      <Html
        transform
        position={[0, 0, 0.08]}
        // Using a transform matrix to fit the content properly
        // This scales the content to fit the entire monitor frame
        scale={[0.1135, 0.1055, 0.003]}
        style={{
          width: '100%', 
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'black',
            transform: 'scale(1)',
            transformOrigin: 'center center'
          }}
        >
          {children}
        </div>
      </Html>
      
      {/* Screen glass effect */}
      <mesh position={[0, 0, 0.09]} receiveShadow>
        <planeGeometry args={[3.1, 2.3]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          transparent={true} 
          opacity={0.05} 
          roughness={0.2} 
          clearcoat={1} 
          reflectivity={1}
        />
      </mesh>
    </group>
  );
}

export default Monitor;