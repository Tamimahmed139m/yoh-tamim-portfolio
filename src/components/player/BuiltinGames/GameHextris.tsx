import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import { RotateCcw, RotateCw, Play, Trophy } from 'lucide-react';

interface Block {
  side: number; // 0 to 5
  dist: number; // distance from center
  color: string;
}

const HEX_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export const GameHextris: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_hextris_best') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    angle: 0,
    targetAngle: 0,
    blocks: [] as Block[],
    stacked: Array(6).fill(0).map(() => [] as string[]),
    score: 0,
    gameOver: false,
    speed: 1.2,
    lastSpawn: 0
  });

  const rotate = useCallback((dir: number) => {
    if (gameState !== 'PLAYING') return;
    playSound('whoosh');
    stateRef.current.targetAngle += (dir * Math.PI) / 3;
  }, [gameState]);

  const startGame = useCallback(() => {
    stateRef.current = {
      angle: 0,
      targetAngle: 0,
      blocks: [],
      stacked: Array(6).fill(0).map(() => []),
      score: 0,
      gameOver: false,
      speed: 1.3,
      lastSpawn: Date.now()
    };
    setScore(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') rotate(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') rotate(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [rotate]);

  // Main canvas animation loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const now = Date.now();
      const state = stateRef.current;

      // Smooth angle interpolation
      state.angle += (state.targetAngle - state.angle) * 0.25;

      // Spawn blocks
      if (now - state.lastSpawn > Math.max(900, 2200 - state.score * 15)) {
        state.lastSpawn = now;
        const side = Math.floor(Math.random() * 6);
        const color = HEX_COLORS[Math.floor(Math.random() * HEX_COLORS.length)];
        state.blocks.push({ side, dist: 220, color });
      }

      // Update blocks
      const baseRadius = 45;
      const stackHeightPx = 12;

      for (let i = state.blocks.length - 1; i >= 0; i--) {
        const b = state.blocks[i];
        b.dist -= state.speed;

        // Current stack limit on this side
        // Correct side based on current rotation angle
        const normalizedAngle = (((state.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        const angleOffset = Math.round(normalizedAngle / (Math.PI / 3)) % 6;
        const targetSide = (b.side - angleOffset + 6) % 6;

        const currentStack = state.stacked[targetSide];
        const stopDist = baseRadius + currentStack.length * stackHeightPx;

        if (b.dist <= stopDist) {
          // Lands on hexagon
          currentStack.push(b.color);
          state.blocks.splice(i, 1);
          playSound('hit');

          // Check for 3 matching colors in this side stack
          if (currentStack.length >= 3) {
            const last3 = currentStack.slice(-3);
            if (last3[0] === last3[1] && last3[1] === last3[2]) {
              currentStack.splice(-3, 3);
              state.score += 30;
              setScore(state.score);
              if (onScoreUpdate) onScoreUpdate(state.score);
              playSound('point');

              // Increase speed gradually
              state.speed = Math.min(3.5, 1.3 + state.score * 0.005);
            }
          }

          // Game over check (stack overflow limit)
          if (currentStack.length >= 8) {
            state.gameOver = true;
            setGameState('GAMEOVER');
            playSound('lose');
            if (state.score > bestScore) {
              setBestScore(state.score);
              try {
                localStorage.setItem('game_hextris_best', String(state.score));
              } catch {}
            }
            return;
          }
        }
      }

      // DRAW CANVAS
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw Center Hexagon with rotation
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(state.angle);

      // Hexagon base
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const theta = (s * Math.PI) / 3;
        const x = baseRadius * Math.cos(theta);
        const y = baseRadius * Math.sin(theta);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#6366f1';
      ctx.stroke();

      // Draw Stacked blocks on the hexagon
      for (let s = 0; s < 6; s++) {
        const stack = state.stacked[s];
        const theta1 = (s * Math.PI) / 3;
        const theta2 = ((s + 1) * Math.PI) / 3;

        for (let lvl = 0; lvl < stack.length; lvl++) {
          const r1 = baseRadius + lvl * stackHeightPx;
          const r2 = r1 + stackHeightPx - 1;

          ctx.beginPath();
          ctx.arc(0, 0, r1, theta1, theta2);
          ctx.arc(0, 0, r2, theta2, theta1, true);
          ctx.closePath();
          ctx.fillStyle = stack[lvl];
          ctx.fill();
        }
      }
      ctx.restore();

      // Draw Incoming Blocks (fixed in world space)
      for (const b of state.blocks) {
        ctx.save();
        ctx.translate(cx, cy);
        const theta1 = (b.side * Math.PI) / 3;
        const theta2 = ((b.side + 1) * Math.PI) / 3;

        ctx.beginPath();
        ctx.arc(0, 0, b.dist, theta1, theta2);
        ctx.arc(0, 0, b.dist + 10, theta2, theta1, true);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, bestScore, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Hextris</h2>
          <p className="text-xs text-neutral-400">Rotate the hexagon to match 3 colors</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Best</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
        <canvas ref={canvasRef} width={340} height={340} className="w-full h-full block" />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">HEXTRIS</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Prevent blocks from leaving the outer gray hexagon! Combine 3 of the same color.
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Start Game
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">GAME OVER</h3>
            <p className="text-xs text-neutral-400 mb-1">Your Score: <span className="text-white font-bold">{score}</span></p>
            <p className="text-xs text-amber-400 mb-4">High Score: {Math.max(score, bestScore)}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        )}
      </div>

      {/* Rotation controls for touch & mouse */}
      <div className="w-full flex items-center justify-center gap-4 mt-4">
        <button
          onClick={() => rotate(-1)}
          className="flex-1 max-w-[130px] flex items-center justify-center gap-2 py-3 bg-neutral-800/80 hover:bg-neutral-700 active:bg-neutral-600 rounded-xl border border-neutral-700 text-neutral-200 text-xs font-semibold"
          aria-label="Rotate Counter-Clockwise"
        >
          <RotateCcw className="w-4 h-4" /> Left (A)
        </button>
        <button
          onClick={() => rotate(1)}
          className="flex-1 max-w-[130px] flex items-center justify-center gap-2 py-3 bg-neutral-800/80 hover:bg-neutral-700 active:bg-neutral-600 rounded-xl border border-neutral-700 text-neutral-200 text-xs font-semibold"
          aria-label="Rotate Clockwise"
        >
          Right (D) <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
