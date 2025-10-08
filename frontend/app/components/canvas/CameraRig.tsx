import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import * as THREE from 'three';

interface CameraRigProps {
  children: ReactNode;
}

const CameraRig = ({ children }: CameraRigProps) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const isBreakpoint = window.innerWidth <= 1260;
    const isMobile = window.innerWidth <= 600;

    // Set camera position based on screen size
    let targetPosition: [number, number, number] = [0, 0, 2];
    
    if (isMobile) {
      targetPosition = [0, 0.2, 2.5];
    } else if (!isBreakpoint) {
      targetPosition = [0, 0, 2];
    }

    // Smoothly move camera to target position
    easing.damp3(state.camera.position, targetPosition, 0.25, delta);

    // Rotate model based on mouse position for interactive feel
    if (groupRef.current) {
      easing.dampE(
        groupRef.current.rotation,
        [state.pointer.y / 10, -state.pointer.x / 5, 0],
        0.25,
        delta
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

export default CameraRig;

