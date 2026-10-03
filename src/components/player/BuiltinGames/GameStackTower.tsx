import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Layers } from 'lucide-react';

interface Block {
  x: number;
  width: number;
  color: string;
}

const TOWER_COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f97316'];

export const GameStackTower: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Tower Stack 3D',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_stack_tower_high') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    blocks: [] as Block[],
    currentX: 50,
    currentWidth: 140,
    direction: 1,
    speed: 3,
    score: 0,
  });

  const dropBlock = useCallback(() => {
    const s = stateRef.current;
    if (gameState !== 'PLAYING') return;

    const topPlaced = s.blocks[s.blocks.length - 1];
    const diff = s.currentX - topPlaced.x;

    // Perfect placement threshold
    if (Math.abs(diff) < 4) {
      playSound('point');
      confetti({ particleCount: 20, spread: 30 });
      // Keep full width
      s.blocks.push({
        x: topPlaced.x,
        width: topPlaced.width,
        color: TOWER_COLORS[s.blocks.length % TOWER_COLORS.length],
      });
      s.score += 2;
    } else if (Math.abs(diff) < topPlaced.width) {
      // Overhang cut off
      playSound('slide');
      const newWidth = topPlaced.width - Math.abs(diff);
      const newX = diff > 0 ? s.currentX : topPlaced.x;

      s.blocks.push({
        x: newX,
        width: newWidth,
        color: TOWER_COLORS[s.blocks.length % TOWER_COLORS.length],
      });
      s.currentWidth = newWidth;
      s.score += 1;
    } else {
      // Complete miss! Game over!
      playSound('lose');
      if (s.score > highScore) {
        setHighScore(s.score);
        try {
          localStorage.setItem('game_stack_tower_high', String(s.score));
        } catch {}
      }
      setGameState('GAMEOVER');
      return;
    }

    setScore(s.score);
    if (onScoreUpdate) onScoreUpdate(s.score);

    // Speed up slightly
    s.speed = Math.min(6, 3 + s.score * 0.1);
    s.currentX = 20;
    s.direction = 1;
  }, [gameState, highScore, onScoreUpdate]);

  const startGame = useCallback(() => {
    stateRef.current = {
      blocks: [
        { x: 100, width: 140, color: TOWER_COLORS[0] },
      ],
      currentX: 30,
      currentWidth: 140,
      direction: 1,
      speed: 3.2,
      score: 0,
    };
    setScore(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        dropBlock();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dropBlock]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockHeight = 16;
    const baseY = 290;

    const loop = () => {
      const s = stateRef.current;

      // Move top active block
      s.currentX += s.speed * s.direction;
      if (s.currentX <= 10 || s.currentX + s.currentWidth >= canvas.width - 10) {
        s.direction *= -1;
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Camera view offset as tower grows
      const visibleCount = Math.min(s.blocks.length, 14);
      const startIndex = Math.max(0, s.blocks.length - visibleCount);

      // Draw stacked blocks
      for (let i = startIndex; i < s.blocks.length; i++) {
        const b = s.blocks[i];
        const level = i - startIndex;
        const y = baseY - level * (blockHeight + 2);

        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x, y, b.width, blockHeight);

        // Highlight top rim
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(b.x, y, b.width, 3);
        ctx.shadowBlur = 0;
      }

      // Draw Current Moving Block above top of tower
      const activeY = baseY - visibleCount * (blockHeight + 2);
      const activeColor = TOWER_COLORS[s.blocks.length % TOWER_COLORS.length];

      ctx.fillStyle = activeColor;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(s.currentX, activeY, s.currentWidth, blockHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(s.currentX, activeY, s.currentWidth, 3);
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Tap or click to stack blocks high</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Height</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Best</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{highScore}</span>
          </div>
        </div>
      </div>

      <div
        onClick={dropBlock}
        className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer"
      >
        <canvas ref={canvasRef} width={340} height={340} className="w-full h-full block" />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Tap screen or press Spacebar at the perfect moment to stack tower blocks higher!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Start Stacking
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">TOWER COLLAPSED!</h3>
            <p className="text-xs text-neutral-400 mb-1">Height Reached: <span className="text-white font-bold">{score}</span></p>
            <p className="text-xs text-amber-400 mb-4">Best Record: {Math.max(score, highScore)}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-3 text-center">
        <button
          onClick={dropBlock}
          disabled={gameState !== 'PLAYING'}
          className="w-full max-w-[280px] py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-50"
        >
          TAP / SPACEBAR TO DROP BLOCK
        </button>
      </div>
    </div>
  );
};
