
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';

const Model = ({ url }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} position={[0, -1, 0]} scale={1.2} />;
};

const AvatarViewer = ({ avatarUrl }) => {
  return (
    <div className="avatar-viewer-container" style={{ width: '500px', height: '500px' }}>
      <Canvas camera={{ position: [0, 1.5, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
            <Model url={avatarUrl} />
            <Environment preset="city" />
        </Suspense>
        <OrbitControls minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} minDistance={2} maxDistance={5} />
      </Canvas>
    </div>
  );
};

export default AvatarViewer;
