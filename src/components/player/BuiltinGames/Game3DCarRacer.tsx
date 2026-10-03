import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, ArrowLeft, ArrowRight, Zap, Trophy, ShieldAlert } from 'lucide-react';

interface Game3DCarRacerProps {
  title?: string;
  onScoreUpdate?: (score: number) => void;
}

export const Game3DCarRacer: React.FC<Game3DCarRacerProps> = ({
  title = '3D Highway Racer',
  onScoreUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [speedMph, setSpeedMph] = useState(90);
  const [isNitro, setIsNitro] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_3d_car_racer_high') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    lane: 0, // -1: Left, 0: Center, 1: Right
    targetX: 0,
    currentX: 0,
    distance: 0,
    speed: 1.2,
    nitro: false,
    isAlive: true,
  });

  const changeLane = useCallback((dir: number) => {
    if (gameState !== 'PLAYING') return;
    const newLane = Math.max(-1, Math.min(1, stateRef.current.lane + dir));
    if (newLane !== stateRef.current.lane) {
      stateRef.current.lane = newLane;
      stateRef.current.targetX = newLane * 3.2;
      playSound('slide');
    }
  }, [gameState]);

  const toggleNitro = useCallback((active: boolean) => {
    if (gameState !== 'PLAYING') return;
    stateRef.current.nitro = active;
    setIsNitro(active);
    if (active) {
      playSound('point');
    }
  }, [gameState]);

  const startGame = useCallback(() => {
    stateRef.current = {
      lane: 0,
      targetX: 0,
      currentX: 0,
      distance: 0,
      speed: 1.2,
      nitro: false,
      isAlive: true,
    };
    setScore(0);
    setSpeedMph(90);
    setIsNitro(false);
    setGameState('PLAYING');
    playSound('point');
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') changeLane(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') changeLane(1);
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') toggleNitro(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') toggleNitro(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [changeLane, toggleNitro]);

  // Three.js 3D Racing World Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070913);
    scene.fog = new THREE.FogExp2(0x070913, 0.02);

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 200);
    camera.position.set(0, 3.8, 7.5);
    camera.lookAt(0, 1.2, -18);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(5, 12, 10);
    scene.add(dirLight);

    // Road Ground (Asphalt & Glowing Borders)
    const roadWidth = 11;
    const roadLength = 220;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x111625,
      roughness: 0.6,
      metalness: 0.3,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, -50);
    scene.add(roadMesh);

    // Road Guardrails & Neon Edge Strips
    const railMatLeft = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
    const railMatRight = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    const railGeo = new THREE.BoxGeometry(0.3, 0.6, roadLength);

    const leftRail = new THREE.Mesh(railGeo, railMatLeft);
    leftRail.position.set(-roadWidth / 2, 0.3, -50);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMatRight);
    rightRail.position.set(roadWidth / 2, 0.3, -50);
    scene.add(rightRail);

    // Lane Markings
    const laneStripes: THREE.Mesh[] = [];
    const stripeGeo = new THREE.PlaneGeometry(0.25, 4);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    for (let i = 0; i < 28; i++) {
      const zPos = -100 + i * 8;
      // Lane 1 divider (-1.6)
      const s1 = new THREE.Mesh(stripeGeo, stripeMat);
      s1.rotation.x = -Math.PI / 2;
      s1.position.set(-1.6, 0.02, zPos);
      scene.add(s1);
      laneStripes.push(s1);

      // Lane 2 divider (+1.6)
      const s2 = new THREE.Mesh(stripeGeo, stripeMat);
      s2.rotation.x = -Math.PI / 2;
      s2.position.set(1.6, 0.02, zPos);
      scene.add(s2);
      laneStripes.push(s2);
    }

    // Overhead Sci-Fi Arches
    const arches: THREE.Group[] = [];
    for (let i = 0; i < 6; i++) {
      const arch = new THREE.Group();
      const archMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(roadWidth + 2, 0.4, 0.4), archMat);
      topBeam.position.set(0, 5, 0);
      arch.add(topBeam);
      arch.position.set(0, 0, -30 - i * 35);
      scene.add(arch);
      arches.push(arch);
    }

    // Player 3D Racecar Model
    const playerGroup = new THREE.Group();

    // Body Chassis
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.55, 3.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.2,
      metalness: 0.8,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.55;
    playerGroup.add(chassis);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.2, 0.45, 1.6);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.1,
      metalness: 0.9,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.95, -0.2);
    playerGroup.add(cabin);

    // Spoiler Wing
    const spoilerGeo = new THREE.BoxGeometry(1.5, 0.1, 0.4);
    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5 });
    const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
    spoiler.position.set(0, 1.15, 1.3);
    playerGroup.add(spoiler);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const wheelPositions = [
      [-0.85, 0.35, 0.9],
      [0.85, 0.35, 0.9],
      [-0.85, 0.35, -0.9],
      [0.85, 0.35, -0.9],
    ];
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      playerGroup.add(wheel);
    });

    // Headlights
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), lightMat);
    leftLight.position.set(-0.55, 0.55, -1.6);
    playerGroup.add(leftLight);
    const rightLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), lightMat);
    rightLight.position.set(0.55, 0.55, -1.6);
    playerGroup.add(rightLight);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);

    // Traffic Cars Pool
    const trafficCount = 7;
    const trafficCars: {
      group: THREE.Group;
      speed: number;
      lane: number;
      z: number;
    }[] = [];

    const trafficColors = [0xef4444, 0xf59e0b, 0x10b981, 0xec4899, 0x8b5cf6];

    for (let i = 0; i < trafficCount; i++) {
      const tGroup = new THREE.Group();
      const col = trafficColors[i % trafficColors.length];
      const tChassis = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.5, 3.0),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 })
      );
      tChassis.position.y = 0.5;
      tGroup.add(tChassis);

      const tCabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.4, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x111827 })
      );
      tCabin.position.set(0, 0.85, -0.1);
      tGroup.add(tCabin);

      const laneChoice = (i % 3) - 1; // -1, 0, 1
      const initialZ = -30 - i * 28;
      tGroup.position.set(laneChoice * 3.2, 0, initialZ);

      scene.add(tGroup);
      trafficCars.push({
        group: tGroup,
        speed: 0.35 + Math.random() * 0.25,
        lane: laneChoice,
        z: initialZ,
      });
    }

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (stateRef.current.isAlive && gameState === 'PLAYING') {
        const speedMultiplier = stateRef.current.nitro ? 1.85 : 1.0;
        const currentSpeed = stateRef.current.speed * speedMultiplier;
        stateRef.current.distance += currentSpeed * delta * 45;

        const distanceScore = Math.floor(stateRef.current.distance);
        setScore(distanceScore);
        if (onScoreUpdate) onScoreUpdate(distanceScore);
        setSpeedMph(Math.round(85 * speedMultiplier + (stateRef.current.distance % 60) * 0.5));

        // Smooth X steering toward target lane
        const lerpFactor = 12 * delta;
        stateRef.current.currentX +=
          (stateRef.current.targetX - stateRef.current.currentX) * lerpFactor;
        playerGroup.position.x = stateRef.current.currentX;

        // Slight banking tilt on turn
        const tilt = (stateRef.current.targetX - stateRef.current.currentX) * 0.08;
        playerGroup.rotation.z = -tilt;
        playerGroup.rotation.y = -tilt * 0.4;

        // Move road lane stripes
        laneStripes.forEach(st => {
          st.position.z += currentSpeed * 45 * delta;
          if (st.position.z > 15) {
            st.position.z -= 210;
          }
        });

        // Move overhead arches
        arches.forEach(arch => {
          arch.position.z += currentSpeed * 35 * delta;
          if (arch.position.z > 15) {
            arch.position.z -= 210;
          }
        });

        // Move oncoming traffic
        trafficCars.forEach(car => {
          // Cars move slower than player or toward player
          car.z += (currentSpeed * 40 - car.speed * 20) * delta;
          car.group.position.z = car.z;

          // Recycle traffic car when behind player
          if (car.z > 12) {
            car.z = -120 - Math.random() * 40;
            car.lane = Math.floor(Math.random() * 3) - 1;
            car.group.position.x = car.lane * 3.2;
            car.speed = 0.35 + Math.random() * 0.35;
          }

          // Collision Detection (Bounding Box)
          const pBox = new THREE.Box3().setFromObject(playerGroup);
          const tBox = new THREE.Box3().setFromObject(car.group);

          // Shrink box slightly for friendly forgiveness
          pBox.min.x += 0.2;
          pBox.max.x -= 0.2;
          pBox.min.z += 0.3;
          pBox.max.z -= 0.3;

          if (pBox.intersectsBox(tBox)) {
            // CRASH!
            stateRef.current.isAlive = false;
            playSound('hit');
            setGameState('GAMEOVER');

            // Save High Score
            const finalScore = Math.floor(stateRef.current.distance);
            if (finalScore > highScore) {
              setHighScore(finalScore);
              try {
                localStorage.setItem('game_3d_car_racer_high', String(finalScore));
              } catch {}
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
      if (container) container.innerHTML = '';
    };
  }, [gameState, highScore, onScoreUpdate]);

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top HUD Overlay (Playing) */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-12 inset-x-0 px-4 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 shadow-lg">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Distance
              </span>
              <span className="text-xl font-black font-mono text-cyan-300 tabular-nums">
                {score} m
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 shadow-lg">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Speed
              </span>
              <span
                className={`text-xl font-black font-mono tabular-nums ${
                  isNitro ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {speedMph} <span className="text-xs text-neutral-400">MPH</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                High
              </span>
              <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                {highScore} m
              </span>
            </div>
          </div>
        </div>
      )}

      {/* On-Screen Mobile Touch Controls */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-auto z-10 sm:hidden">
          <div className="flex gap-2">
            <button
              onClick={() => changeLane(-1)}
              className="w-14 h-14 rounded-2xl bg-neutral-900/80 backdrop-blur-md border border-neutral-700 active:scale-95 text-cyan-400 flex items-center justify-center text-xl shadow-xl"
              aria-label="Steer Left"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => changeLane(1)}
              className="w-14 h-14 rounded-2xl bg-neutral-900/80 backdrop-blur-md border border-neutral-700 active:scale-95 text-cyan-400 flex items-center justify-center text-xl shadow-xl"
              aria-label="Steer Right"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <button
            onTouchStart={() => toggleNitro(true)}
            onTouchEnd={() => toggleNitro(false)}
            onMouseDown={() => toggleNitro(true)}
            onMouseUp={() => toggleNitro(false)}
            className={`w-16 h-14 rounded-2xl backdrop-blur-md border active:scale-95 font-bold text-xs flex flex-col items-center justify-center gap-0.5 shadow-xl transition-all ${
              isNitro
                ? 'bg-amber-500 border-amber-300 text-neutral-950 scale-105'
                : 'bg-indigo-600/80 border-indigo-400 text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>NITRO</span>
          </button>
        </div>
      )}

      {/* MENU MODAL */}
      {gameState === 'MENU' && (
        <div className="relative z-20 max-w-sm w-full mx-4 p-6 rounded-3xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/80 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <Zap className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white font-heading tracking-tight">{title}</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Genuine 3D WebGL Highway Racer. Dodge oncoming traffic and push nitro speeds!
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-300 space-y-1.5 text-left font-mono">
            <div className="flex justify-between">
              <span className="text-neutral-400">Steer:</span>
              <span className="text-cyan-400 font-bold">Arrow Keys / A, D</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Nitro Boost:</span>
              <span className="text-amber-400 font-bold">Spacebar / Up Arrow</span>
            </div>
            {highScore > 0 && (
              <div className="flex justify-between pt-1 border-t border-neutral-800 text-amber-300">
                <span>Best Record:</span>
                <span>{highScore} m</span>
              </div>
            )}
          </div>

          <button
            onClick={startGame}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>START RACE</span>
          </button>
        </div>
      )}

      {/* GAMEOVER MODAL */}
      {gameState === 'GAMEOVER' && (
        <div className="relative z-20 max-w-sm w-full mx-4 p-6 rounded-3xl bg-neutral-900/95 backdrop-blur-xl border border-rose-500/40 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-400 shadow-lg">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white font-heading tracking-tight">CRASHED!</h2>
            <p className="text-xs text-neutral-400 mt-1">Watch out for oncoming traffic vehicles!</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-around font-mono">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-sans font-bold">
                Distance
              </span>
              <span className="text-xl font-bold text-cyan-400">{score} m</span>
            </div>
            <div className="h-8 w-px bg-neutral-800" />
            <div>
              <span className="text-[10px] text-neutral-400 uppercase block font-sans font-bold">
                Best
              </span>
              <span className="text-xl font-bold text-amber-400">{highScore} m</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={startGame}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RACE AGAIN</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
