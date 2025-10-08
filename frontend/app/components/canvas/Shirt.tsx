import { Suspense } from 'react';
import { easing } from 'maath';
import { useSnapshot } from 'valtio';
import { useFrame } from '@react-three/fiber';
import { Decal, useGLTF, useTexture, Text } from '@react-three/drei';

import designState, { type Layer } from '../../lib/designStore';

const Shirt = () => {
  const snap = useSnapshot(designState);
  const { nodes, materials } = useGLTF('/shirt_baked.glb') as any;

  // Smoothly animate color changes
  useFrame((state, delta) => {
    if (materials.lambert1) {
      easing.dampC(materials.lambert1.color, snap.color, 0.25, delta);
    }
  });

  const stateString = JSON.stringify(snap);

  return (
    <group key={stateString}>
      <mesh
        castShadow
        geometry={nodes.T_Shirt_male?.geometry}
        material={materials.lambert1}
        material-roughness={1}
        dispose={null}
      >
        {/* Legacy: Full texture - covers entire shirt */}
        {snap.isFullTexture && snap.fullDecal && (
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
        
        {/* Legacy: Logo texture - small logo on chest */}
        {snap.isLogoTexture && snap.logoDecal && (
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

        {/* New Layer System: Render all layers */}
        {snap.layers.map((layer) => (
          <LayerRenderer key={layer.id} layer={layer} />
        ))}
      </mesh>
    </group>
  );
};

// Component to render individual layers
const LayerRenderer = ({ layer }: { layer: Layer }) => {
  if (!layer.visible) return null;

  if (layer.type === 'text') {
    return (
      <Suspense fallback={null}>
        <Text
          position={layer.position}
          rotation={layer.rotation}
          scale={layer.scale}
          color="#000000"
          fontSize={0.1}
          maxWidth={0.5}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign="center"
        >
          {layer.content}
        </Text>
      </Suspense>
    );
  }

  // For image layers (logo, full, shape)
  if (layer.content) {
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
  }

  return null;
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

export default Shirt;

// Preload the GLTF model
useGLTF.preload('/shirt_baked.glb');
