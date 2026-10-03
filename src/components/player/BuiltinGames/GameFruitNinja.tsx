import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

interface FlyingFruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  sliced: boolean;
  color: string;
}

const FRUIT_TYPES = [
  { emoji: '🍉', color: '#ef4444' },
  { emoji: '🍊', color: '#f97316' },
  { emoji: '🍋', color: '#eab308' },
  { emoji: '🍏', color: '#22c55e' },
  { emoji: '🍇', color: '#a855f7' },
];

export const GameFruitNinja: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Katana Fruits',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);

  const stateRef = useRef({
    fruits: [] as FlyingFruit[],
    trail: [] as { x: number; y: number }[],
    score: 0,
    strikes: 0,
    nextFruitId: 1,
    lastSpawn: 0,
  });

  const startGame = useCallback(() => {
    stateRef.current = {
      fruits: [],
      trail: [],
      score: 0,
      strikes: 0,
      nextFruitId: 1,
      lastSpawn: Date.now(),
    };
    setScore(0);
    setStrikes(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const s = stateRef.current;
    s.trail.push({ x: px, y: py });
    if (s.trail.length > 8) s.trail.shift();

    // Slicing check
    s.fruits.forEach(f => {
      if (!f.sliced && Math.hypot(px - f.x, py - f.y) < 28) {
        f.sliced = true;
        playSound('point');
        s.score += 10;
        setScore(s.score);
        if (onScoreUpdate) onScoreUpdate(s.score);
      }
    });
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

      // Spawn flying fruits
      if (now - s.lastSpawn > 1100) {
        s.lastSpawn = now;
        const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        const startX = 60 + Math.random() * 220;
        const vx = (Math.random() - 0.5) * 3.5;
        const vy = -(9 + Math.random() * 3.5);

        s.fruits.push({
          id: s.nextFruitId++,
          x: startX,
          y: 350,
          vx,
          vy,
          emoji: type.emoji,
          color: type.color,
          sliced: false,
        });
      }

      // Physics & Slices
      for (let i = s.fruits.length - 1; i >= 0; i--) {
        const f = s.fruits[i];
        f.vy += 0.22; // Gravity
        f.x += f.vx;
        f.y += f.vy;

        // Fallen unsliced check (Strike!)
        if (f.y > 360 && f.vy > 0) {
          if (!f.sliced) {
            playSound('lose');
            s.strikes += 1;
            setStrikes(s.strikes);
            if (s.strikes >= 3) {
              setGameState('GAMEOVER');
              return;
            }
          }
          s.fruits.splice(i, 1);
        }
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark wooden dojo background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Fruits
      for (const f of s.fruits) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (f.sliced) {
          // Half slices separating
          ctx.fillText(f.emoji, -8, 0);
          ctx.fillText(f.emoji, 8, 4);
        } else {
          ctx.fillText(f.emoji, 0, 0);
        }
        ctx.restore();
      }

      // Draw Katana Blade Trail
      if (s.trail.length > 1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let i = 0; i < s.trail.length; i++) {
          const pt = s.trail[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Swipe quickly to slice flying fruits</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Misses</span>
            <span className="text-sm font-bold font-mono tabular-nums text-rose-400">{'❌'.repeat(strikes) || 'None'}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onPointerMove={handlePointerMove}
          className="w-full h-full block touch-none"
        />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default z-20">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Swipe across watermelons, oranges, and apples with ninja precision! Don't let 3 drop unsliced.
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Start Slicing
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20 cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">3 FRUITS DROPPED</h3>
            <p className="text-xs text-neutral-400 mb-4">Total Score: {score}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Slice Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-2 text-center text-xs text-neutral-400 font-medium">
        SWIPE / DRAG CURSOR TO CUT FRUITS
      </div>
    </div>
  );
};
