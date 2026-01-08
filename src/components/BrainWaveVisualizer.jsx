import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import NeuralEngine from '../utils/NeuralEngine';

const BrainWaveVisualizer = ({ couplingStrength = 0 }) => {
  const count = 500;
  const engine = useMemo(() => new NeuralEngine(count), [count]);
  const mesh = useRef();
  
  // Create particles arranged in a spherical brain-like structure
  const [dummy] = useState(() => new THREE.Object3D());
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 4 + (Math.random() - 0.5); // Radius fluctuation
        
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  });

  const colorArray = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(() => {
    // 1. Update Physics
    engine.setCoupling(couplingStrength);
    const { phases, coherence } = engine.update();

    if (mesh.current) {
      // 2. Update Visualization based on Physics
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Position
        dummy.position.set(positions[i3], positions[i3+1], positions[i3+2]);
        
        // Scale pulses with phase (firing neuron effect)
        // Phase is [0, 2PI]. Sin(phase) gives -1 to 1.
        // We want 'firing' at peak.
        const signal = Math.sin(phases[i]); 
        const scale = 0.5 + (signal > 0.8 ? 0.3 : 0); 
        dummy.scale.set(scale, scale, scale);
        
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);

        // Color Update: Sync = Uniform Color, Chaos = Random Colors
        // Map phase to Hue
        const hue = (phases[i] / (Math.PI * 2)); 
        const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
        mesh.current.setColorAt(i, color);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
      mesh.current.instanceColor.needsUpdate = true; // Use instanceColor for per-particle color
    }
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[null, null, count]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial toneMapped={false} vertexColors />
      </instancedMesh>
      
      {/* Visual Connections (optional, heavy for performance if too many) */}
    </>
  );
};

export default BrainWaveVisualizer;
