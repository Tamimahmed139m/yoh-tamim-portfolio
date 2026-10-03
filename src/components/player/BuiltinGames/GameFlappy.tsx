import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import { Play, RotateCcw, Feather } from 'lucide-react';

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

interface GameFlappyProps {
  title?: string;
  category?: string;
  onScoreUpdate?: (score: number) => void;
}

export const GameFlappy: React.FC<GameFlappyProps> = ({
  title = 'Flappy Flight',
  category = 'Arcade',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_flappy_high') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    birdY: 150,
    birdVelocity: 0,
    pipes: [] as Pipe[],
    lastPipeSpawn: 0,
    score: 0,
    speed: 2.4,
  });

  const flap = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    playSound('whoosh');
    stateRef.current.birdVelocity = -6.5;
  }, [gameState]);

  const startGame = useCallback(() => {
    stateRef.current = {
      birdY: 150,
      birdVelocity: -2,
      pipes: [],
      lastPipeSpawn: Date.now(),
      score: 0,
      speed: 2.4,
    };
    setScore(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flap]);

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

      // Bird physics
      s.birdVelocity += 0.38;
      s.birdY += s.birdVelocity;

      // Spawn pipes
      const GAP = 95;
      if (now - s.lastPipeSpawn > 1650) {
        s.lastPipeSpawn = now;
        const topH = 40 + Math.random() * 140;
        s.pipes.push({
          x: canvas.width + 10,
          topHeight: topH,
          bottomY: topH + GAP,
          passed: false,
        });
      }

      // Check ground/ceiling crash
      if (s.birdY >= canvas.height - 18 || s.birdY <= 5) {
        playSound('lose');
        if (s.score > highScore) {
          setHighScore(s.score);
          try {
            localStorage.setItem('game_flappy_high', String(s.score));
          } catch {}
        }
        setGameState('GAMEOVER');
        return;
      }

      // Bird bounding box
      const birdX = 70;
      const birdRadius = 12;

      for (let i = s.pipes.length - 1; i >= 0; i--) {
        const p = s.pipes[i];
        p.x -= s.speed;

        // Collision with top pipe
        if (
          birdX + birdRadius > p.x &&
          birdX - birdRadius < p.x + 42 &&
          s.birdY - birdRadius < p.topHeight
        ) {
          playSound('lose');
          if (s.score > highScore) setHighScore(s.score);
          setGameState('GAMEOVER');
          return;
        }

        // Collision with bottom pipe
        if (
          birdX + birdRadius > p.x &&
          birdX - birdRadius < p.x + 42 &&
          s.birdY + birdRadius > p.bottomY
        ) {
          playSound('lose');
          if (s.score > highScore) setHighScore(s.score);
          setGameState('GAMEOVER');
          return;
        }

        // Pass pipe point
        if (!p.passed && p.x + 42 < birdX) {
          p.passed = true;
          s.score += 1;
          setScore(s.score);
          if (onScoreUpdate) onScoreUpdate(s.score);
          playSound('point');
        }

        // Remove offscreen
        if (p.x + 50 < 0) {
          s.pipes.splice(i, 1);
        }
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Clouds / stars background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pipes
      for (const p of s.pipes) {
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 3;

        // Top pipe
        ctx.fillRect(p.x, 0, 42, p.topHeight);
        ctx.strokeRect(p.x, 0, 42, p.topHeight);

        // Pipe rim
        ctx.fillRect(p.x - 3, p.topHeight - 12, 48, 12);
        ctx.strokeRect(p.x - 3, p.topHeight - 12, 48, 12);

        // Bottom pipe
        const bottomHeight = canvas.height - p.bottomY;
        ctx.fillRect(p.x, p.bottomY, 42, bottomHeight);
        ctx.strokeRect(p.x, p.bottomY, 42, bottomHeight);

        // Bottom rim
        ctx.fillRect(p.x - 3, p.bottomY, 48, 12);
        ctx.strokeRect(p.x - 3, p.bottomY, 48, 12);
      }

      // Bird
      ctx.save();
      ctx.translate(birdX, s.birdY);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.birdVelocity * 0.08));
      ctx.rotate(angle);

      // Bird Body
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, birdRadius, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(-4, 2, 6, 0, Math.PI);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(5, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(6, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(9, -2);
      ctx.lineTo(16, 1);
      ctx.lineTo(9, 4);
      ctx.closePath();
      ctx.fill();

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
          <p className="text-xs text-neutral-400">Flap wings and navigate between obstacles</p>
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

      <div
        onClick={flap}
        className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer"
      >
        <canvas ref={canvasRef} width={340} height={340} className="w-full h-full block" />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Feather className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Tap screen or Spacebar to flap wings. Dodge the emerald pipes!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Start Flapping
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">PIPE COLLISION</h3>
            <p className="text-xs text-neutral-400 mb-1">Score: <span className="text-white font-bold">{score}</span></p>
            <p className="text-xs text-amber-400 mb-4">Best: {Math.max(score, highScore)}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-3 text-center">
        <button
          onClick={flap}
          disabled={gameState !== 'PLAYING'}
          className="w-full max-w-[280px] py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-98 disabled:opacity-50"
        >
          TAP TO FLAP (SPACEBAR)
        </button>
      </div>
    </div>
  );
};
