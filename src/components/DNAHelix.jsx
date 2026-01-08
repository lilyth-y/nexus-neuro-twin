import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DNAHelix = ({ count = 40, radius = 2, height = 10, color1 = '#00d4ff', color2 = '#ff00ff' }) => {
  const groupRef = useRef();

  // Generate DNA structure points
  const points = useMemo(() => {
    const tempPoints = [];
    for (let i = 0; i < count; i++) {
        const t = i / count;
        const angle = t * Math.PI * 4; // 2 turns
        const y = (t - 0.5) * height;
        
        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        
        const x2 = Math.cos(angle + Math.PI) * radius; // Opposite strand
        const z2 = Math.sin(angle + Math.PI) * radius;
        
        tempPoints.push({ x: x1, y, z: z1, color: color1 });
        tempPoints.push({ x: x2, y, z: z2, color: color2 });
    }
    return tempPoints;
  }, [count, radius, height, color1, color2]);

  useFrame((state, delta) => {
    if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.5; // Rotate helix
    }
  });

  return (
    <group ref={groupRef}>
        {/* Render Nucleotides */}
        {points.map((point, index) => (
            <mesh key={index} position={[point.x, point.y, point.z]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial 
                    color={point.color} 
                    emissive={point.color} 
                    emissiveIntensity={0.8}
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>
        ))}

        {/* Render Connecting Bonds (Simplified as lines or thin cylinders) */}
        {Array.from({ length: count }).map((_, i) => {
            const p1 = points[i * 2];
            const p2 = points[i * 2 + 1];
            // Calculate midpoint and scale for connector
            return (
                <mesh key={`connector-${i}`} position={[0, p1.y, 0]} rotation={[0, (i / count) * Math.PI * 4, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, radius * 2, 8]} />
                    <meshStandardMaterial 
                        color="white" 
                        transparent 
                        opacity={0.3} 
                        emissive="white"
                        emissiveIntensity={0.2}
                    />
                    <primitive object={new THREE.Object3D()} rotation={[0, 0, Math.PI / 2]} />
                </mesh>
            );
        })}
        {/* Correcting rotation for cylinders to lie horizontally relative to Y axis */}
        {/* Actually, it's easier to just draw lines or simplified geometry for connectors.
            Let's stick to the spheres for the 'cyberpunk' look, maybe skipping explicit bonds for cleaner look if it gets messy, 
            but a central 'ladder' bond adds to the DNA recognition. 
            The cylinder above defaults to vertical (Y-axis). To make it horizontal (X/Z plane), we need to rotate it 90deg on Z or X.
        */}
        {Array.from({ length: count }).map((_, i) => {
             const t = i / count;
             const angle = t * Math.PI * 4;
             return (
                 <mesh key={`bond-${i}`} position={[0, (t - 0.5) * height, 0]} rotation={[0, angle, Math.PI / 2]}>
                     <cylinderGeometry args={[0.03, 0.03, radius * 2, 8]} />
                     <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
                 </mesh>
             )
        })}
    </group>
  );
};

export default DNAHelix;
