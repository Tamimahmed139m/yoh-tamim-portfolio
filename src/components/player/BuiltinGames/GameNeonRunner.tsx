import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import { Play, RotateCcw, Zap } from 'lucide-react';

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

interface GameNeonRunnerProps {
  title?: string;
  category?: string;
  onScoreUpdate?: (score: number) => void;
}

export const GameNeonRunner: React.FC<GameNeonRunnerProps> = ({
  title = 'Neon Runner',
  category = 'Arcade',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_neon_runner_high') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    playerY: 200,
    playerVelocityY: 0,
    isGrounded: true,
    obstacles: [] as Obstacle[],
    speed: 4,
    score: 0,
    lastSpawn: 0,
    groundY: 230,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (gameState !== 'PLAYING') return;
    if (s.isGrounded) {
      playSound('whoosh');
      s.playerVelocityY = -10.5;
      s.isGrounded = false;
    }
  }, [gameState]);

  const startGame = useCallback(() => {
    stateRef.current = {
      playerY: 200,
      playerVelocityY: 0,
      isGrounded: true,
      obstacles: [{ x: 380, width: 22, height: 35 }],
      speed: 4.5,
      score: 0,
      lastSpawn: Date.now(),
      groundY: 230,
    };
    setScore(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump]);

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

      // Gravity & Physics
      s.playerVelocityY += 0.58;
      s.playerY += s.playerVelocityY;

      if (s.playerY >= s.groundY - 26) {
        s.playerY = s.groundY - 26;
        s.playerVelocityY = 0;
        s.isGrounded = true;
      }

      // Increase score and speed
      s.score += 1;
      if (s.score % 10 === 0) {
        setScore(Math.floor(s.score / 10));
        if (onScoreUpdate) onScoreUpdate(Math.floor(s.score / 10));
      }
      s.speed = Math.min(8.5, 4.5 + s.score * 0.002);

      // Spawn obstacles
      if (now - s.lastSpawn > Math.max(1200, 2400 - s.speed * 120)) {
        s.lastSpawn = now;
        const height = 25 + Math.random() * 25;
        s.obstacles.push({ x: 360, width: 20, height });
      }

      // Move & Collision
      const playerBox = { x: 50, y: s.playerY, width: 24, height: 24 };

      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const obs = s.obstacles[i];
        obs.x -= s.speed;

        // AABB collision
        const obsBox = { x: obs.x, y: s.groundY - obs.height, width: obs.width, height: obs.height };

        if (
          playerBox.x < obsBox.x + obsBox.width &&
          playerBox.x + playerBox.width > obsBox.x &&
          playerBox.y < obsBox.y + obsBox.height &&
          playerBox.y + playerBox.height > obsBox.y
        ) {
          playSound('lose');
          const finalScore = Math.floor(s.score / 10);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            try {
              localStorage.setItem('game_neon_runner_high', String(finalScore));
            } catch {}
          }
          setGameState('GAMEOVER');
          return;
        }

        // Remove off-screen
        if (obs.x + obs.width < 0) {
          s.obstacles.splice(i, 1);
        }
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Neon Grid Background lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Ground Line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY);
      ctx.lineTo(canvas.width, s.groundY);
      ctx.stroke();

      // Neon Player Cube
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.fillRect(playerBox.x, playerBox.y, playerBox.width, playerBox.height);

      // Obstacles
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;
      for (const obs of s.obstacles) {
        ctx.fillRect(obs.x, s.groundY - obs.height, obs.width, obs.height);
      }

      ctx.shadowBlur = 0;
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
          <p className="text-xs text-neutral-400">Dash and jump over obstacles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Distance</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}m</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Best</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{highScore}m</span>
          </div>
        </div>
      </div>

      <div
        onClick={jump}
        className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer"
      >
        <canvas ref={canvasRef} width={340} height={340} className="w-full h-full block" />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Tap screen or press Space to jump over oncoming neon barriers.
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Start Run
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">CRASHED!</h3>
            <p className="text-xs text-neutral-400 mb-1">Distance Reached: <span className="text-white font-bold">{score}m</span></p>
            <p className="text-xs text-amber-400 mb-4">Record: {Math.max(score, highScore)}m</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-3 text-center">
        <button
          onClick={jump}
          disabled={gameState !== 'PLAYING'}
          className="w-full max-w-[280px] py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-98 disabled:opacity-50"
        >
          TAP TO JUMP (SPACEBAR)
        </button>
      </div>
    </div>
  );
};
