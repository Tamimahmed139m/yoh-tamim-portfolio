import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, ArrowLeft, ArrowRight, Compass, Sparkles } from 'lucide-react';

interface Game3DSlopeTunnelProps {
  title?: string;
  onScoreUpdate?: (score: number) => void;
}

export const Game3DSlopeTunnel: React.FC<Game3DSlopeTunnelProps> = ({
  title = 'Slope 3D',
  onScoreUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [speedVal, setSpeedVal] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_3d_slope_high') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    ballX: 0,
    ballSpeedX: 0,
    cameraZ: 0,
    worldSpeed: 0.35,
    score: 0,
    isAlive: true,
  });

  const startGame = useCallback(() => {
    stateRef.current = {
      ballX: 0,
      ballSpeedX: 0,
      cameraZ: 0,
      worldSpeed: 0.45,
      score: 0,
      isAlive: true,
    };
    setScore(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  const steer = useCallback((dir: number) => {
    if (gameState !== 'PLAYING') return;
    stateRef.current.ballSpeedX = dir * 0.18;
  }, [gameState]);

  const stopSteer = useCallback(() => {
    stateRef.current.ballSpeedX = 0;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') steer(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') steer(1);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) stopSteer();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [steer, stopSteer]);

  // Three.js 3D WebGL Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.025);

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 5.5);
    camera.lookAt(0, 0.8, -12);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting (Key + Fill + Ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Player 3D Ball (Glowing sphere)
    const ballGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      roughness: 0.2,
      metalness: 0.8,
    });
    const playerBall = new THREE.Mesh(ballGeo, ballMat);
    playerBall.position.set(0, 0.55, 0);
    scene.add(playerBall);

    // Track segments & Obstacles
    const trackWidth = 7;
    const trackGeo = new THREE.BoxGeometry(trackWidth, 0.4, 18);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.2,
    });

    const segments: THREE.Mesh[] = [];
    const obstacles: { mesh: THREE.Mesh; z: number; x: number }[] = [];

    // Create 12 looping track blocks
    for (let i = 0; i < 12; i++) {
      const seg = new THREE.Mesh(trackGeo, trackMat);
      seg.position.set(0, 0, -i * 16);
      scene.add(seg);
      segments.push(seg);

      // Add obstacles on tracks except starting one
      if (i > 1) {
        const obsGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        const obsMat = new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0x881337,
          roughness: 0.3,
        });
        const obs = new THREE.Mesh(obsGeo, obsMat);
        const randX = (Math.random() - 0.5) * (trackWidth - 2.5);
        obs.position.set(randX, 1, -i * 16 + (Math.random() - 0.5) * 6);
        scene.add(obs);
        obstacles.push({ mesh: obs, z: obs.position.z, x: randX });
      }
    }

    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (gameState === 'PLAYING' && stateRef.current.isAlive) {
        const s = stateRef.current;

        // Ball horizontal steering
        s.ballX += s.ballSpeedX;
        s.ballX = Math.max(-(trackWidth / 2 - 0.6), Math.min(trackWidth / 2 - 0.6, s.ballX));
        playerBall.position.x = s.ballX;
        playerBall.rotation.x -= s.worldSpeed * 0.8;
        playerBall.rotation.z = -s.ballSpeedX * 3;

        // Camera follow
        camera.position.x += (s.ballX * 0.45 - camera.position.x) * 0.1;

        // Move track towards camera
        s.cameraZ += s.worldSpeed;
        s.score += 1;

        if (s.score % 10 === 0) {
          const displayedScore = Math.floor(s.score / 10);
          setScore(displayedScore);
          if (onScoreUpdate) onScoreUpdate(displayedScore);
        }

        s.worldSpeed = Math.min(0.9, 0.45 + s.score * 0.0001);
        setSpeedVal(Math.round(s.worldSpeed * 100));

        // Recycle track segments
        segments.forEach(seg => {
          seg.position.z += s.worldSpeed;
          if (seg.position.z > 14) {
            seg.position.z -= 12 * 16;
          }
        });

        // Move and test obstacles
        obstacles.forEach(obs => {
          obs.mesh.position.z += s.worldSpeed;
          obs.mesh.rotation.y += 0.03;

          // Recycle obstacle
          if (obs.mesh.position.z > 8) {
            obs.mesh.position.z -= 10 * 16;
            obs.mesh.position.x = (Math.random() - 0.5) * (trackWidth - 2.5);
          }

          // 3D Collision AABB check
          const distZ = Math.abs(obs.mesh.position.z - playerBall.position.z);
          const distX = Math.abs(obs.mesh.position.x - playerBall.position.x);

          if (distZ < 1.1 && distX < 1.1) {
            // Collision!
            s.isAlive = false;
            playSound('lose');
            const finalScore = Math.floor(s.score / 10);
            if (finalScore > highScore) {
              setHighScore(finalScore);
              try {
                localStorage.setItem('game_3d_slope_high', String(finalScore));
              } catch {}
            }
            setGameState('GAMEOVER');
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, [gameState, highScore, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded">
              3D WebGL
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          </div>
          <p className="text-xs text-neutral-400">Roll down the 3D track and dodge red obstacles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Speed</span>
            <span className="text-sm font-bold font-mono tabular-nums text-cyan-400">{speedVal}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
        <div ref={mountRef} className="w-full h-full block" />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default z-20">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Steer your 3D sphere left & right with Arrow Keys, A/D or on-screen touch pedals!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Launch 3D Track
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default z-20">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">CRASHED!</h3>
            <p className="text-xs text-neutral-400 mb-1">Score: <span className="text-white font-bold">{score}</span></p>
            <p className="text-xs text-amber-400 mb-4">Record: {Math.max(score, highScore)}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Roll Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-center gap-4 mt-3">
        <button
          onPointerDown={() => steer(-1)}
          onPointerUp={stopSteer}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 max-w-[130px] flex items-center justify-center gap-1.5 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" /> STEER LEFT
        </button>
        <button
          onPointerDown={() => steer(1)}
          onPointerUp={stopSteer}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 max-w-[130px] flex items-center justify-center gap-1.5 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-40"
        >
          STEER RIGHT <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
