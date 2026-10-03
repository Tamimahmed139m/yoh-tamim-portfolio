import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Crosshair, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

interface Invader {
  x: number;
  y: number;
  size: number;
  color: string;
  hp: number;
}

interface Laser {
  x: number;
  y: number;
}

export const GameSpaceShooter: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Alien Attack',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_space_shooter_high') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    playerX: 170,
    lasers: [] as Laser[],
    invaders: [] as Invader[],
    score: 0,
    speed: 1.2,
    lastSpawn: 0,
    lastShot: 0,
  });

  const movePlayer = useCallback((dir: number) => {
    const s = stateRef.current;
    if (gameState !== 'PLAYING') return;
    s.playerX = Math.max(25, Math.min(315, s.playerX + dir * 25));
  }, [gameState]);

  const fireLaser = useCallback(() => {
    const s = stateRef.current;
    const now = Date.now();
    if (gameState !== 'PLAYING' || now - s.lastShot < 180) return;
    s.lastShot = now;
    playSound('point');
    s.lasers.push({ x: s.playerX, y: 290 });
  }, [gameState]);

  const startGame = useCallback(() => {
    stateRef.current = {
      playerX: 170,
      lasers: [],
      invaders: [
        { x: 90, y: 30, size: 24, color: '#ef4444', hp: 1 },
        { x: 170, y: 30, size: 24, color: '#a855f7', hp: 1 },
        { x: 250, y: 30, size: 24, color: '#3b82f6', hp: 1 },
      ],
      score: 0,
      speed: 1.1,
      lastSpawn: Date.now(),
      lastShot: 0,
    };
    setScore(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
        movePlayer(-1);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        movePlayer(1);
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        fireLaser();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movePlayer, fireLaser]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    stateRef.current.playerX = Math.max(25, Math.min(315, px));
    fireLaser();
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      const now = Date.now();

      // Spawn invaders
      if (now - s.lastSpawn > Math.max(800, 2000 - s.score * 12)) {
        s.lastSpawn = now;
        const x = 30 + Math.random() * 280;
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#a855f7'];
        s.invaders.push({
          x,
          y: -20,
          size: 22,
          color: colors[Math.floor(Math.random() * colors.length)],
          hp: 1,
        });
      }

      // Update lasers
      for (let i = s.lasers.length - 1; i >= 0; i--) {
        s.lasers[i].y -= 9;
        if (s.lasers[i].y < 0) s.lasers.splice(i, 1);
      }

      // Update invaders
      for (let i = s.invaders.length - 1; i >= 0; i--) {
        const inv = s.invaders[i];
        inv.y += s.speed;

        // Check laser collision
        for (let l = s.lasers.length - 1; l >= 0; l--) {
          const laser = s.lasers[l];
          const dist = Math.hypot(inv.x - laser.x, inv.y - laser.y);
          if (dist < inv.size + 4) {
            playSound('hit');
            s.lasers.splice(l, 1);
            s.invaders.splice(i, 1);
            s.score += 25;
            setScore(s.score);
            if (onScoreUpdate) onScoreUpdate(s.score);
            s.speed = Math.min(3.5, 1.1 + s.score * 0.003);
            break;
          }
        }

        // Check if reached bottom
        if (inv && inv.y >= 290) {
          playSound('lose');
          if (s.score > highScore) {
            setHighScore(s.score);
            try {
              localStorage.setItem('game_space_shooter_high', String(s.score));
            } catch {}
          }
          setGameState('GAMEOVER');
          return;
        }
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Starfield background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lasers
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      for (const laser of s.lasers) {
        ctx.fillRect(laser.x - 2, laser.y - 10, 4, 16);
      }
      ctx.shadowBlur = 0;

      // Invaders
      for (const inv of s.invaders) {
        ctx.save();
        ctx.translate(inv.x, inv.y);
        ctx.fillStyle = inv.color;
        ctx.beginPath();
        ctx.arc(0, 0, inv.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eye spots
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI * 2);
        ctx.arc(4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Player Cannon / Ship
      ctx.save();
      ctx.translate(s.playerX, 305);
      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, 12);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();

      // Wing glow
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-18, 8, 36, 4);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, highScore, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Aim lasers to eliminate invaders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Best</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{highScore}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onPointerDown={handlePointerDown}
          className="w-full h-full block"
        />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <Crosshair className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Tap or click to steer and fire laser cannons. Don't let enemies breach the baseline!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Launch Defense
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">BASE BREACHED</h3>
            <p className="text-xs text-neutral-400 mb-1">Score: <span className="text-white font-bold">{score}</span></p>
            <p className="text-xs text-amber-400 mb-4">High Score: {Math.max(score, highScore)}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between gap-3 mt-3">
        <button
          onClick={() => movePlayer(-1)}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> LEFT
        </button>
        <button
          onClick={fireLaser}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border border-indigo-500 rounded-xl font-bold text-xs text-white shadow-md shadow-indigo-600/30 disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <Zap className="w-4 h-4" /> FIRE LASER
        </button>
        <button
          onClick={() => movePlayer(1)}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-40 flex items-center justify-center gap-1"
        >
          RIGHT <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
