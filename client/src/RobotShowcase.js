import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';

// Animated Line Follower Robot
function LineFollowerBot() {
  const wheels = [useRef(), useRef()];
  const body = useRef();

  // Bob the body up and down
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (body.current) body.current.position.y = 0.4 + Math.sin(t * 2) * 0.06;
    // Spin wheels
    wheels.forEach((ref) => {
      if (ref.current) ref.current.rotation.x = t * 2.5;
    });
  });

  return (
    <group ref={body}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[2, 0.5, 1]} />
        <meshStandardMaterial color="#2BC6D1" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Wheels */}
      <mesh ref={wheels[0]} position={[-0.8, -0.32, 0.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />
        <meshStandardMaterial color="#181f2b" />
      </mesh>
      <mesh ref={wheels[1]} position={[0.8, -0.32, 0.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />
        <meshStandardMaterial color="#181f2b" />
      </mesh>
      {/* Sensor bar */}
      <mesh position={[0, 0.31, 0.6]}>
        <boxGeometry args={[1, 0.05, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#2BC6D1" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// Animated Maze Solver Robot
function MazeSolverBot() {
  const head = useRef();
  const wheels = [useRef(), useRef()];
  const body = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (body.current) body.current.position.y = 0.6 + Math.sin(t * 1.2) * 0.09;
    if (head.current) head.current.rotation.y = Math.sin(t * 1.5) * 0.7;
    wheels.forEach((ref) => {
      if (ref.current) ref.current.rotation.x = -t * 2;
    });
  });

  return (
    <group ref={body}>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.6, 0.8, 1.2, 32]} />
        <meshStandardMaterial color="#d12bbf" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Wheels */}
      <mesh ref={wheels[0]} position={[-0.7, -0.6, 0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />
        <meshStandardMaterial color="#181f2b" />
      </mesh>
      <mesh ref={wheels[1]} position={[0.7, -0.6, 0.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />
        <meshStandardMaterial color="#181f2b" />
      </mesh>
      {/* Rotating Head */}
      <group ref={head} position={[0, 0.8, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#fff" emissive="#ff6fff" emissiveIntensity={0.5} />
        </mesh>
        {/* Camera lens */}
        <mesh position={[0, 0, 0.32]}>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 32]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    </group>
  );
}

export default function RobotShowcase() {
  const [showMazeBot, setShowMazeBot] = React.useState(false);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-transparent">
      {/* BLUR OVERLAY */}
      <div className="fixed inset-0 z-10 backdrop-blur-2xl bg-black/40" />
      {/* Main content */}
      <div className="relative z-20 w-full flex flex-col items-center pt-10 pb-6">
        <h1 className="text-5xl font-extrabold text-cyan-300 mb-2 tracking-tight drop-shadow-lg animate-fade-in-down">
          Robot 3D Gallery
        </h1>
        <p className="text-xl text-cyan-100 mb-2 animate-fade-in-up">
          Interactive 3D {showMazeBot ? "Maze Solver" : "Line Follower"} Robot
        </p>
        <div className="h-1 w-20 bg-cyan-400 rounded-full animate-pulse mb-4"></div>
        <div className="w-full max-w-3xl h-[500px] rounded-2xl shadow-2xl overflow-hidden border border-cyan-700 bg-cyan-900/20 animate-zoom-in">
          <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 7]} intensity={0.8} />
            <Stage environment="city" intensity={0.15}>
              {showMazeBot ? <MazeSolverBot /> : <LineFollowerBot />}
            </Stage>
            <OrbitControls autoRotate enablePan={false} />
          </Canvas>
        </div>
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setShowMazeBot(false)}
            className={`px-6 py-2 rounded-lg font-bold text-lg shadow-xl transition-all duration-300
              ${!showMazeBot ? "bg-cyan-500 text-white scale-110" : "bg-slate-800 text-cyan-300 hover:bg-cyan-800"}
            `}
          >
            Line Follower
          </button>
          <button
            onClick={() => setShowMazeBot(true)}
            className={`px-6 py-2 rounded-lg font-bold text-lg shadow-xl transition-all duration-300
              ${showMazeBot ? "bg-pink-500 text-white scale-110" : "bg-slate-800 text-pink-200 hover:bg-pink-800"}
            `}
          >
            Maze Solver
          </button>
        </div>
        <p className="mt-6 text-lg text-slate-400 animate-fade-in-up delay-500">
          {showMazeBot
            ? "Maze Solver Robot: Rotating sensor head, can solve complex mazes!"
            : "Line Follower Robot: Fast, accurate, and follows the line with precision!"}
        </p>
      </div>
      {/* FADE-IN ANIMATIONS (TailwindCSS custom classes, see below) */}
      <style>
        {`
          .animate-fade-in-down { animation: fadeInDown .8s cubic-bezier(.23,1.01,.32,1) both; }
          .animate-fade-in-up { animation: fadeInUp .8s cubic-bezier(.23,1.01,.32,1) both; }
          .animate-zoom-in { animation: zoomIn .7s cubic-bezier(.23,1.01,.32,1) both; }
          @keyframes fadeInDown { from { opacity: 0; transform: translateY(-60px);} to {opacity:1;transform:translateY(0);} }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(60px);} to {opacity:1;transform:translateY(0);} }
          @keyframes zoomIn { from { opacity: 0; transform: scale(.7);} to {opacity:1;transform:scale(1);} }
        `}
      </style>
    </div>
  );
}