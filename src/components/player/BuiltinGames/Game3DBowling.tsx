import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Trophy, Target } from 'lucide-react';

interface Game3DBowlingProps {
  title?: string;
  onScoreUpdate?: (score: number) => void;
}

export const Game3DBowling: React.FC<Game3DBowlingProps> = ({
  title = '3D Bowling',
  onScoreUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'AIMING' | 'ROLLING' | 'RESULT'>('AIMING');
  const [aimX, setAimX] = useState(0);
  const [frameScore, setFrameScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [resultText, setResultText] = useState('');

  const stateRef = useRef({
    ballPos: new THREE.Vector3(0, 0.45, 6),
    ballVelocity: new THREE.Vector3(0, 0, 0),
    pins: [] as { mesh: THREE.Mesh; standing: boolean; initialPos: THREE.Vector3 }[],
    aimX: 0,
    isRolling: false,
  });

  const launchBall = useCallback(() => {
    if (gameState !== 'AIMING') return;
    playSound('whoosh');
    const s = stateRef.current;
    s.ballPos.set(s.aimX, 0.45, 6);
    s.ballVelocity.set((Math.random() - 0.5) * 0.05, 0, -0.42);
    s.isRolling = true;
    setGameState('ROLLING');
  }, [gameState]);

  // Three.js 3D Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1222);

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
    camera.position.set(0, 2.5, 9);
    camera.lookAt(0, 0.8, -3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xfff7ed, 1.5);
    light.position.set(3, 8, 5);
    light.castShadow = true;
    scene.add(light);

    // Bowling Lane (Wood material)
    const laneGeo = new THREE.BoxGeometry(3.6, 0.2, 16);
    const laneMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.15,
      metalness: 0.1,
    });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.position.set(0, -0.1, -1);
    lane.receiveShadow = true;
    scene.add(lane);

    // Gutters
    const gutterGeo = new THREE.BoxGeometry(0.8, 0.2, 16);
    const gutterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const leftGutter = new THREE.Mesh(gutterGeo, gutterMat);
    leftGutter.position.set(-2.2, -0.15, -1);
    scene.add(leftGutter);

    const rightGutter = new THREE.Mesh(gutterGeo, gutterMat);
    rightGutter.position.set(2.2, -0.15, -1);
    scene.add(rightGutter);

    // 3D Bowling Ball
    const ballGeo = new THREE.SphereGeometry(0.42, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      emissive: 0x4c1d95,
      roughness: 0.1,
      metalness: 0.8,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    ballMesh.position.copy(stateRef.current.ballPos);
    scene.add(ballMesh);

    // 10 Bowling Pins arranged in triangle at -6 Z
    const pinGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.9, 16);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });

    const pinPositions: [number, number][] = [
      // Row 1 (Apex)
      [0, -5],
      // Row 2
      [-0.35, -5.7], [0.35, -5.7],
      // Row 3
      [-0.7, -6.4], [0, -6.4], [0.7, -6.4],
      // Row 4
      [-1.05, -7.1], [-0.35, -7.1], [0.35, -7.1], [1.05, -7.1],
    ];

    const pinsList: { mesh: THREE.Mesh; standing: boolean; initialPos: THREE.Vector3 }[] = [];

    pinPositions.forEach(([px, pz]) => {
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(px, 0.45, pz);
      pin.castShadow = true;
      scene.add(pin);
      pinsList.push({ mesh: pin, standing: true, initialPos: pin.position.clone() });
    });

    stateRef.current.pins = pinsList;

    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;

      if (!s.isRolling) {
        // Aim positioning
        s.ballPos.x = s.aimX;
        ballMesh.position.copy(s.ballPos);
      } else {
        // Ball rolling physics
        s.ballPos.add(s.ballVelocity);
        ballMesh.position.copy(s.ballPos);
        ballMesh.rotation.x -= 0.15;

        // Check pin collisions
        let pinsHitCount = 0;

        s.pins.forEach(p => {
          if (p.standing) {
            const dist = p.mesh.position.distanceTo(s.ballPos);
            if (dist < 0.6) {
              p.standing = false;
              playSound('hit');
              // Knockdown tilt
              p.mesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
              p.mesh.rotation.z = (Math.random() - 0.5) * Math.PI;
              p.mesh.position.y = 0.15;
            }
          }
          if (!p.standing) pinsHitCount++;
        });

        // Ball reached end
        if (s.ballPos.z < -8.5) {
          s.isRolling = false;
          const knocked = pinsHitCount;
          setFrameScore(knocked);
          setTotalScore(prev => prev + knocked * 10);
          if (onScoreUpdate) onScoreUpdate(knocked * 10);

          if (knocked === 10) {
            playSound('win');
            confetti({ particleCount: 70, spread: 60 });
            setResultText('STRIKE! 10 PINS DOWN!');
          } else if (knocked >= 7) {
            playSound('point');
            setResultText(`GREAT SHOT! ${knocked} PINS!`);
          } else {
            playSound('lose');
            setResultText(`${knocked} PINS KNOCKED`);
          }

          setGameState('RESULT');
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, [onScoreUpdate]);

  const resetFrame = () => {
    const s = stateRef.current;
    s.ballPos.set(0, 0.45, 6);
    s.ballVelocity.set(0, 0, 0);
    s.isRolling = false;
    s.pins.forEach(p => {
      p.standing = true;
      p.mesh.position.copy(p.initialPos);
      p.mesh.rotation.set(0, 0, 0);
    });
    setGameState('AIMING');
    playSound('slide');
  };

  const handleAimChange = (val: number) => {
    setAimX(val);
    stateRef.current.aimX = val;
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded">
              3D Physics
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          </div>
          <p className="text-xs text-neutral-400">Aim, set curve, and bowl strikes in 3D</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Pins</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{frameScore}/10</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{totalScore}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
        <div ref={mountRef} className="w-full h-full block" />

        {gameState === 'RESULT' && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
            <Trophy className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{resultText}</h3>
            <p className="text-xs text-neutral-400 mb-4">Total Score: {totalScore}</p>
            <button
              onClick={resetFrame}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Bowl Next Frame
            </button>
          </div>
        )}
      </div>

      {/* Aim & Roll Controls */}
      <div className="w-full space-y-3 mt-3">
        {gameState === 'AIMING' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Lane Position</span>
              <span className="font-mono text-amber-400">{aimX.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-1.4"
              max="1.4"
              step="0.1"
              value={aimX}
              onChange={e => handleAimChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <button
              onClick={launchBall}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98"
            >
              ROLL BOWLING BALL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
