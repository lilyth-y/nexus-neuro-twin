
import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Environment, KeyboardControls, useGLTF, useKeyboardControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';

const WorldScene = ({ avatarUrl, onExit, coupling = 0 }) => {
  // Determine environment state based on coupling
  // Coupling 0-3: Chaos (Red, Foggy)
  // Coupling 3-10: Sync (Cyan, Clear)
  const isSync = coupling > 3;
  const t = Math.min(coupling / 10, 1); // 0 to 1

  // Lerp Colors
  // Chaos Color: #ff0000 (Red)
  // Sync Color: #00d4ff (Cyan)
  const r = 255 - (t * 255);
  const g = t * 212;
  const b = t * 255;
  const ambientColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000, background: 'black' }}>
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, color: 'white', textAlign: 'right' }}>
         <h3>NEURAL RESONANCE</h3>
         <h1 style={{ color: isSync ? '#00d4ff' : '#ff0000', fontSize: '3rem' }}>
             {coupling.toFixed(1)} K
         </h1>
         <p>{isSync ? 'HARMONIZED' : 'ENTROPY DETECTED'}</p>
      </div>

      <button 
        onClick={onExit} 
        className="btn btn-secondary glass-effect" 
        style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}
      >
        Exit World
      </button>

      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
          { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
          { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
          { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
          { name: 'jump', keys: ['Space'] },
        ]}
      >
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          {/* Reactive Fog: Density decreases as sync increases */}
          <fog attach="fog" args={[ambientColor, 5, isSync ? 50 : 15]} />
          
          <Sky sunPosition={isSync ? [100, 20, 100] : [0, 0, 0]} inclination={isSync ? 0 : 0.6} azimuth={0.1} />
          <ambientLight intensity={0.5} color={ambientColor} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={isSync ? 1 : 0.2} 
            color={isSync ? "white" : "red"}
            castShadow 
            shadow-mapSize={[1024, 1024]} 
          />
          
          <Physics gravity={[0, -9.81, 0]}>
            <Suspense fallback={null}>
                <PlayerController avatarUrl={avatarUrl} />
            </Suspense>
            
            {/* Ground */}
            <RigidBody type="fixed" friction={2}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1a1a3a" />
              </mesh>
            </RigidBody>

            {/* Neon Buildings - Reactive Emissive */}
            <RigidBody type="fixed" position={[-5, 2, -5]}>
               <mesh castShadow receiveShadow>
                 <boxGeometry args={[4, 6, 4]} />
                 <meshStandardMaterial color="#b026ff" emissive="#b026ff" emissiveIntensity={isSync ? 0.5 : 2} />
               </mesh>
            </RigidBody>

            <RigidBody type="fixed" position={[5, 3, -10]}>
               <mesh castShadow receiveShadow>
                 <boxGeometry args={[6, 8, 6]} />
                 <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={isSync ? 0.5 : 0} />
               </mesh>
            </RigidBody>

             <RigidBody type="fixed" position={[5, 1, 5]}>
               <mesh castShadow receiveShadow>
                 <boxGeometry args={[2, 2, 2]} />
                 <meshStandardMaterial color="#ff00aa" emissive="#ff00aa" emissiveIntensity={0.8} />
               </mesh>
            </RigidBody>
            
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

// Separated Player Logic
function PlayerController({ avatarUrl }) {
    const rigidBody = useRef();
    const [, getKeys] = useKeyboardControls();
    
    // Load Model
    const { scene } = useGLTF(avatarUrl);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useFrame((state, delta) => {
        if(!rigidBody.current) return;

        const { forward, backward, left, right, jump } = getKeys();
        const linvel = rigidBody.current.linvel();
        
        const speed = 5;
        const velocity = { x: linvel.x, y: linvel.y, z: linvel.z };

        if (forward) {
            velocity.z = -speed;
        } else if (backward) {
            velocity.z = speed;
        } else {
            velocity.z = 0; 
        }

        if (left) {
            velocity.x = -speed;
        } else if (right) {
            velocity.x = speed;
        } else {
            velocity.x = 0;
        }

        if (jump && Math.abs(linvel.y) < 0.1) {
            rigidBody.current.applyImpulse({ x: 0, y: 5, z: 0 }, true);
        }

        // Apply
        rigidBody.current.setLinvel({ x: velocity.x, y: linvel.y, z: velocity.z }, true);
        
        // Camera Follow
        const bodyPosition = rigidBody.current.translation();
        const cameraPosition = new Vector3();
        cameraPosition.copy(bodyPosition);
        cameraPosition.y += 3; 
        cameraPosition.z += 6;
        
        state.camera.position.lerp(cameraPosition, 0.1);
        state.camera.lookAt(bodyPosition.x, bodyPosition.y + 1, bodyPosition.z);
    });

    return (
        <RigidBody ref={rigidBody} colliders="hull" enabledRotations={[false, false, false]} position={[0, 5, 0]}>
            <primitive object={clonedScene} position={[0, -0.9, 0]} />
        </RigidBody>
    )
}

export default WorldScene;
