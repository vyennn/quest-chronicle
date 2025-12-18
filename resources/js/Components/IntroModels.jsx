import { useRef } from 'react';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { gsap } from 'gsap';

export default function IntroModels({ onFinish }) {
  const planet = useGLTF('/Model/planet01.glb');
  const char1 = useGLTF('/Model/character-employee.glb');
  const char2 = useGLTF('/Model/character-gamer.glb');

  const planetRef = useRef();
  const char1Ref = useRef();
  const char2Ref = useRef();
  const cameraRef = useRef();

  // Slowly rotate models
  useFrame(() => {
    if (planetRef.current) planetRef.current.rotation.y += 0.002;
    if (char1Ref.current) char1Ref.current.rotation.y += 0.004;
    if (char2Ref.current) char2Ref.current.rotation.y -= 0.004;
  });

  // Animate camera forward
  useFrame(() => {
    if (cameraRef.current && cameraRef.current.position.z > 3) {
      cameraRef.current.position.z -= 0.05; // automatic forward movement
    } else if (cameraRef.current && cameraRef.current.position.z <= 3) {
      onFinish(); // trigger main page
    }
  });

  return (
    <>
      <perspectiveCamera ref={cameraRef} fov={60} position={[0, 1, 10]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <primitive ref={planetRef} object={planet.scene} position={[0, 0, 0]} scale={1.5} />
      <primitive ref={char1Ref} object={char1.scene} position={[-2, 0, -2]} scale={0.8} />
      <primitive ref={char2Ref} object={char2.scene} position={[2, 0, -2]} scale={0.8} />

      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
    </>
  );
}
