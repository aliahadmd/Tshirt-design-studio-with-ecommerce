import { Suspense, useRef, useEffect, useState } from 'react';
import { easing } from 'maath';
import { useSnapshot } from 'valtio';
import { useFrame, useThree } from '@react-three/fiber';
import { Decal, useGLTF, useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';

import designState, { layerActions, type Layer } from '../../lib/designStore';

const InteractiveShirt = () => {
  const snap = useSnapshot(designState);
  const { nodes, materials } = useGLTF('/shirt_baked.glb') as any;
  const meshRef = useRef<THREE.Mesh>(null);

  // Smoothly animate color changes
  useFrame((state, delta) => {
    if (materials.lambert1) {
      easing.dampC(materials.lambert1.color, snap.color, 0.25, delta);
    }
  });

  // Create a key that changes when layers are added/removed
  const layersKey = snap.layers.map(l => l.id).join(',');

  return (
    <group>
      <mesh
        key={layersKey} // Re-key mesh when layers change to force cleanup
        ref={meshRef}
        castShadow
        geometry={nodes.T_Shirt_male?.geometry}
        material={materials.lambert1}
        material-roughness={1}
        dispose={null}
      >
        {/* Legacy: Full texture - covers entire shirt (only if no layers) */}
        {snap.layers.length === 0 && snap.isFullTexture && snap.fullDecal && (
          <Suspense fallback={null}>
            <DecalComponent
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              scale={1}
              map={snap.fullDecal}
              opacity={1}
            />
          </Suspense>
        )}
        
        {/* Legacy: Logo texture - small logo on chest (only if no layers) */}
        {snap.layers.length === 0 && snap.isLogoTexture && snap.logoDecal && (
          <Suspense fallback={null}>
            <DecalComponent
              position={[0, 0.04, 0.15]}
              rotation={[0, 0, 0]}
              scale={0.15}
              map={snap.logoDecal}
              opacity={1}
            />
          </Suspense>
        )}

        {/* New Layer System: Render all layers as Decals (must be direct children of mesh) */}
        {snap.layers.map((layer) => (
          <LayerDecalRenderer
            key={layer.id}
            layerId={layer.id}
          />
        ))}
      </mesh>

      {/* Transform controls outside mesh - control helper objects */}
      {snap.selectedLayerId && (
        <TransformControlHelper
          layer={snap.layers.find(l => l.id === snap.selectedLayerId)}
          meshRef={meshRef}
        />
      )}
    </group>
  );
};

interface LayerDecalRendererProps {
  layerId: string;
}

// Component to render individual layers as Decals (must be direct children of mesh)
const LayerDecalRenderer = ({ layerId }: LayerDecalRendererProps) => {
  const snap = useSnapshot(designState);
  const layer = snap.layers.find(l => l.id === layerId);

  // If layer doesn't exist (was deleted), don't render
  if (!layer) return null;

  // If layer is hidden, don't render
  if (!layer.visible) return null;

  // For now, we only render image layers as decals
  // Text layers would need a different approach
  if (layer.type === 'text') {
    // Text cannot be a decal, skip for now
    return null;
  }

  if (!layer.content) return null;

  return (
    <Suspense fallback={null}>
      <DecalComponent
        position={layer.position}
        rotation={layer.rotation}
        scale={layer.scale}
        map={layer.content}
        opacity={layer.opacity}
      />
    </Suspense>
  );
};

// Transform control helper - controls a helper object that updates layer position
interface TransformControlHelperProps {
  layer?: Layer;
  meshRef: React.RefObject<THREE.Mesh | null>;
}

const TransformControlHelper = ({ layer, meshRef }: TransformControlHelperProps) => {
  const helperRef = useRef<THREE.Object3D>(null);
  const { camera, gl } = useThree();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (helperRef.current && layer) {
      // Initialize helper position to match layer
      helperRef.current.position.set(...layer.position);
      helperRef.current.rotation.set(...layer.rotation);
      helperRef.current.scale.setScalar(layer.scale);
      setIsInitialized(true);
    }
  }, [layer?.id]);

  const handleChange = () => {
    if (helperRef.current && layer && !layer.locked) {
      const pos = helperRef.current.position;
      const rot = helperRef.current.rotation;
      const position = [pos.x, pos.y, pos.z] as const;
      const rotation = [rot.x, rot.y, rot.z] as const;
      const scale = helperRef.current.scale.x;
      
      layerActions.updateLayer(layer.id, {
        position,
        rotation,
        scale,
      });
    }
  };

  if (!layer || layer.locked || !isInitialized) return null;

  return (
    <group
      ref={helperRef}
      position={layer.position}
      rotation={layer.rotation}
      scale={layer.scale}
    >
      {/* Invisible helper mesh to visualize selection */}
      <mesh>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.3} />
      </mesh>

      {helperRef.current && (
        <TransformControls
          object={helperRef.current}
          mode="translate"
          size={0.5}
          showX={true}
          showY={true}
          showZ={false}
          camera={camera}
          domElement={gl.domElement}
          onChange={handleChange}
        />
      )}
    </group>
  );
};

// Separate component to handle texture loading
const DecalComponent = ({ map, opacity = 1, ...props }: any) => {
  const texture = useTexture(map);
  return (
    <Decal 
      map={texture} 
      transparent
      opacity={opacity}
      {...props} 
    />
  );
};

export default InteractiveShirt;

// Preload the GLTF model
useGLTF.preload('/shirt_baked.glb');

