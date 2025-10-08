import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface TShirt3DProps {
  color: string;
  frontTexture?: string;
  backTexture?: string;
  showFront: boolean;
}

function TShirtMesh({ color, frontTexture, backTexture, showFront }: TShirt3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Create textures with proper settings
  const frontTextureMap = useMemo(() => {
    if (!frontTexture) return null;
    const texture = new THREE.TextureLoader().load(frontTexture);
    texture.needsUpdate = true;
    return texture;
  }, [frontTexture]);
  
  const backTextureMap = useMemo(() => {
    if (!backTexture) return null;
    const texture = new THREE.TextureLoader().load(backTexture);
    texture.needsUpdate = true;
    return texture;
  }, [backTexture]);

  // Smooth rotation animation
  useFrame(() => {
    if (meshRef.current) {
      const targetRotation = showFront ? 0 : Math.PI;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation,
        0.1
      );
    }
  });

  // Create realistic T-shirt geometry
  const createTShirtGeometry = () => {
    const shape = new THREE.Shape();
    
    // Body of T-shirt
    shape.moveTo(-0.8, -1.2);
    shape.lineTo(-0.8, 0.6);
    shape.quadraticCurveTo(-0.8, 0.8, -0.6, 0.8); // Shoulder curve
    shape.lineTo(-0.5, 0.8);
    shape.quadraticCurveTo(-0.4, 0.9, -0.3, 0.9); // Neck curve
    shape.lineTo(0.3, 0.9);
    shape.quadraticCurveTo(0.4, 0.9, 0.5, 0.8);
    shape.lineTo(0.6, 0.8);
    shape.quadraticCurveTo(0.8, 0.8, 0.8, 0.6);
    shape.lineTo(0.8, -1.2);
    shape.quadraticCurveTo(0.8, -1.3, 0.7, -1.3); // Bottom curve
    shape.lineTo(-0.7, -1.3);
    shape.quadraticCurveTo(-0.8, -1.3, -0.8, -1.2);
    
    const extrudeSettings = {
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  };

  const tshirtGeometry = useMemo(() => createTShirtGeometry(), []);

  return (
    <Center>
      <group ref={meshRef} scale={1.5}>
        {/* Main T-shirt body */}
        <mesh 
          geometry={tshirtGeometry}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={color}
            roughness={0.6}
            metalness={0.1}
            map={showFront ? frontTextureMap : backTextureMap}
          />
        </mesh>
        
        {/* Left sleeve */}
        <mesh position={[-1.15, 0.4, 0.075]} rotation={[0, 0, Math.PI / 8]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.15]} />
          <meshStandardMaterial
            color={color}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
        
        {/* Right sleeve */}
        <mesh position={[1.15, 0.4, 0.075]} rotation={[0, 0, -Math.PI / 8]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.15]} />
          <meshStandardMaterial
            color={color}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
        
        {/* Neck collar */}
        <mesh position={[0, 0.9, 0.075]} castShadow>
          <torusGeometry args={[0.15, 0.03, 16, 32, Math.PI]} />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      </group>
    </Center>
  );
}

export default function TShirt3D({ color, frontTexture, backTexture, showFront }: TShirt3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg relative overflow-hidden">
      <Canvas 
        camera={{ position: [0, 0, 4], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting setup for realistic look */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1.2} 
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.5} />
        <spotLight position={[0, 5, 0]} intensity={0.3} angle={0.3} penumbra={1} />
        
        {/* Environment for reflections */}
        <Environment preset="studio" />
        
        {/* T-shirt model */}
        <TShirtMesh
          color={color}
          frontTexture={frontTexture}
          backTexture={backTexture}
          showFront={showFront}
        />
        
        {/* Ground shadow */}
        <ContactShadows
          position={[0, -2, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
        
        {/* Camera controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={6}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* View indicator */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
        {showFront ? '👕 Front View' : '👕 Back View'}
      </div>
    </div>
  );
}
