import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import { Play, RotateCcw, ArrowLeft, ArrowRight, Gauge, Zap } from 'lucide-react';

interface TrafficCar {
  lane: number; // 0, 1, 2
  y: number;
  speed: number;
  color: string;
}

const CAR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export const GameRacer: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Speed Racer',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [speedMph, setSpeedMph] = useState(120);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_racer_high') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    playerLane: 1, // 0: Left, 1: Center, 2: Right
    targetLane: 1,
    playerX: 170,
    traffic: [] as TrafficCar[],
    roadOffset: 0,
    speed: 5.5,
    score: 0,
    lastSpawn: 0,
  });

  const changeLane = useCallback((dir: number) => {
    const s = stateRef.current;
    if (gameState !== 'PLAYING') return;
    const nextLane = Math.max(0, Math.min(2, s.targetLane + dir));
    if (nextLane !== s.targetLane) {
      playSound('whoosh');
      s.targetLane = nextLane;
    }
  }, [gameState]);

  const startGame = useCallback(() => {
    stateRef.current = {
      playerLane: 1,
      targetLane: 1,
      playerX: 170,
      traffic: [
        { lane: 0, y: -80, speed: 2, color: CAR_COLORS[0] },
        { lane: 2, y: -220, speed: 2.2, color: CAR_COLORS[1] },
      ],
      roadOffset: 0,
      speed: 6,
      score: 0,
      lastSpawn: Date.now(),
    };
    setScore(0);
    setSpeedMph(120);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
        changeLane(-1);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        changeLane(1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [changeLane]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lanePositions = [105, 170, 235]; // Lane centers

    const loop = () => {
      const s = stateRef.current;
      const now = Date.now();

      // Smooth lane movement
      const targetX = lanePositions[s.targetLane];
      s.playerX += (targetX - s.playerX) * 0.22;

      // Road animation
      s.roadOffset = (s.roadOffset + s.speed) % 40;

      // Increase speed & score
      s.score += 1;
      if (s.score % 10 === 0) {
        setScore(Math.floor(s.score / 10));
        if (onScoreUpdate) onScoreUpdate(Math.floor(s.score / 10));
      }
      s.speed = Math.min(10, 6 + s.score * 0.0015);
      setSpeedMph(Math.floor(100 + s.speed * 12));

      // Spawn traffic cars
      if (now - s.lastSpawn > Math.max(900, 1800 - s.speed * 80)) {
        s.lastSpawn = now;
        const freeLanes = [0, 1, 2].filter(l => {
          return !s.traffic.some(tc => tc.lane === l && tc.y < 120);
        });
        if (freeLanes.length > 0) {
          const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
          const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
          s.traffic.push({
            lane,
            y: -70,
            speed: 1.5 + Math.random() * 1.5,
            color,
          });
        }
      }

      // Player bounding box (width: 32, height: 56)
      const playerY = 250;
      const pLeft = s.playerX - 16;
      const pRight = s.playerX + 16;
      const pTop = playerY - 28;
      const pBottom = playerY + 28;

      // Update traffic
      for (let i = s.traffic.length - 1; i >= 0; i--) {
        const tc = s.traffic[i];
        tc.y += s.speed - tc.speed;

        const tcX = lanePositions[tc.lane];
        const tLeft = tcX - 15;
        const tRight = tcX + 15;
        const tTop = tc.y - 26;
        const tBottom = tc.y + 26;

        // Collision Check
        if (pLeft < tRight && pRight > tLeft && pTop < tBottom && pBottom > tTop) {
          playSound('hit');
          const finalScore = Math.floor(s.score / 10);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            try {
              localStorage.setItem('game_racer_high', String(finalScore));
            } catch {}
          }
          setGameState('GAMEOVER');
          return;
        }

        // Offscreen remove
        if (tc.y > canvas.height + 80) {
          s.traffic.splice(i, 1);
        }
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Road background (Dark asphalt)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road surface (60px to 280px)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(70, 0, 200, canvas.height);

      // Road curbs
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(66, 0, 5, canvas.height);
      ctx.fillRect(269, 0, 5, canvas.height);

      // Lane dividers (Dashed lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -s.roadOffset;

      // Divider 1
      ctx.beginPath();
      ctx.moveTo(137, 0);
      ctx.lineTo(137, canvas.height);
      ctx.stroke();

      // Divider 2
      ctx.beginPath();
      ctx.moveTo(203, 0);
      ctx.lineTo(203, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Traffic Cars
      for (const tc of s.traffic) {
        const cx = lanePositions[tc.lane];
        drawCar(ctx, cx, tc.y, tc.color, false);
      }

      // Draw Player Car (Cyan Sportscar with glow)
      drawCar(ctx, s.playerX, playerY, '#06b6d4', true);

      animId = requestAnimationFrame(loop);
    };

    const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isPlayer: boolean) => {
      ctx.save();
      ctx.translate(x, y);

      if (isPlayer) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
      }

      // Car Body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-15, -26, 30, 52, 6);
      ctx.fill();

      // Windshield & Glass
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-11, -12, 22, 16, 3);
      ctx.fill();

      // Roof
      ctx.fillStyle = color;
      ctx.fillRect(-10, -4, 20, 10);

      // Wheels
      ctx.fillStyle = '#000000';
      ctx.fillRect(-18, -20, 4, 10);
      ctx.fillRect(14, -20, 4, 10);
      ctx.fillRect(-18, 10, 4, 10);
      ctx.fillRect(14, 10, 4, 10);

      // Headlights / Taillights
      if (isPlayer) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-12, -26, 6, 3);
        ctx.fillRect(6, -26, 6, 3);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-12, 23, 6, 3);
        ctx.fillRect(6, 23, 6, 3);
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, highScore, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Steer left and right to dodge highway traffic</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Speed</span>
            <span className="text-sm font-bold font-mono tabular-nums text-cyan-400">{speedMph} mph</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Distance</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}m</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
        <canvas ref={canvasRef} width={340} height={340} className="w-full h-full block" />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Gauge className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Use Arrow keys, A/D or on-screen buttons to switch lanes and dodge high-speed traffic!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Start Engine
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">CRASHED!</h3>
            <p className="text-xs text-neutral-400 mb-1">Traveled: <span className="text-white font-bold">{score}m</span></p>
            <p className="text-xs text-amber-400 mb-4">Record: {Math.max(score, highScore)}m</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Drive Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-center gap-4 mt-3">
        <button
          onClick={() => changeLane(-1)}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 max-w-[130px] flex items-center justify-center gap-1.5 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" /> STEER LEFT
        </button>
        <button
          onClick={() => changeLane(1)}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 max-w-[130px] flex items-center justify-center gap-1.5 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-40"
        >
          STEER RIGHT <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
