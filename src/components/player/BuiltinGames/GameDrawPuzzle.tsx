import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Pencil, Target } from 'lucide-react';

interface DrawnLine {
  points: { x: number; y: number }[];
}

export const GameDrawPuzzle: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Dunk Brush',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'DRAWING' | 'WIN' | 'LOSE'>('DRAWING');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    ballX: 170,
    ballY: 40,
    ballVx: 0,
    ballVy: 0,
    lines: [] as DrawnLine[],
    currentLine: [] as { x: number; y: number }[],
    isDrawing: false,
    hoopX: 170,
    hoopY: 275,
    isWon: false,
  });

  const resetStage = useCallback(() => {
    stateRef.current = {
      ballX: 70 + Math.random() * 200,
      ballY: 40,
      ballVx: (Math.random() - 0.5) * 1.5,
      ballVy: 0,
      lines: [],
      currentLine: [],
      isDrawing: false,
      hoopX: 60 + Math.random() * 220,
      hoopY: 275,
      isWon: false,
    };
    setGameState('DRAWING');
    playSound('slide');
  }, []);

  useEffect(() => {
    resetStage();
  }, [resetStage]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'DRAWING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    stateRef.current.isDrawing = true;
    stateRef.current.currentLine = [{ x: px, y: py }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    s.currentLine.push({ x: px, y: py });
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isDrawing) return;
    s.isDrawing = false;
    if (s.currentLine.length > 2) {
      playSound('click');
      s.lines.push({ points: [...s.currentLine] });
    }
    s.currentLine = [];
  };

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;

      // Ball Physics
      s.ballVy += 0.28; // Gravity
      s.ballX += s.ballVx;
      s.ballY += s.ballVy;

      // Wall bounce
      if (s.ballX < 15 || s.ballX > canvas.width - 15) {
        s.ballVx *= -0.75;
        s.ballX = Math.max(15, Math.min(canvas.width - 15, s.ballX));
      }

      // Drawn line collision (point to line segment distance)
      const ballRadius = 10;
      s.lines.forEach(line => {
        for (let i = 0; i < line.points.length - 1; i++) {
          const p1 = line.points[i];
          const p2 = line.points[i + 1];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy);
          if (len === 0) continue;

          // Projection
          const u = Math.max(0, Math.min(1, ((s.ballX - p1.x) * dx + (s.ballY - p1.y) * dy) / (len * len)));
          const nearestX = p1.x + u * dx;
          const nearestY = p1.y + u * dy;

          const dist = Math.hypot(s.ballX - nearestX, s.ballY - nearestY);
          if (dist < ballRadius + 4) {
            playSound('hit');
            // Reflect velocity along normal
            const nx = -dy / len;
            const ny = dx / len;
            const dot = s.ballVx * nx + s.ballVy * ny;

            s.ballVx = (s.ballVx - 1.8 * dot * nx) * 0.85;
            s.ballVy = (s.ballVy - 1.8 * dot * ny) * 0.85;

            s.ballX = nearestX + nx * (ballRadius + 5);
            s.ballY = nearestY + ny * (ballRadius + 5);
          }
        }
      });

      // Target Hoop Sunk
      if (!s.isWon && Math.hypot(s.ballX - s.hoopX, s.ballY - s.hoopY) < 22) {
        s.isWon = true;
        playSound('win');
        confetti({ particleCount: 60, spread: 60 });
        setScore(sc => sc + 100);
        if (onScoreUpdate) onScoreUpdate(100);
        setGameState('WIN');
      }

      // Ball fell off screen
      if (s.ballY > 360) {
        playSound('lose');
        setGameState('LOSE');
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Blueprint Grid Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw Finished Lines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      s.lines.forEach(line => {
        ctx.beginPath();
        line.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      });

      // Draw Currently Drawing Line
      if (s.isDrawing && s.currentLine.length > 1) {
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        s.currentLine.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      }

      // Target Hoop
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(s.hoopX, s.hoopY, 24, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Net lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.hoopX - 16, s.hoopY, 32, 22);

      // Bouncing Ball (Orange basketball)
      ctx.save();
      ctx.translate(s.ballX, s.ballY);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Draw ramps to guide the ball into the hoop</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{score}</span>
          </div>
          <button
            onClick={resetStage}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Reset Ball & Lines"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block touch-none"
        />

        {gameState === 'WIN' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20 cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">SWISH! GOAL!</h3>
            <p className="text-xs text-neutral-300 mb-4">Ball guided into hoop perfectly!</p>
            <button
              onClick={resetStage}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              Next Challenge →
            </button>
          </div>
        )}

        {gameState === 'LOSE' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20 cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">MISSED HOOP</h3>
            <p className="text-xs text-neutral-400 mb-4">Draw ramps to redirect the falling ball!</p>
            <button
              onClick={resetStage}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-2 text-center text-xs text-neutral-400 font-medium">
        CLICK & DRAG TO DRAW INK BRUSH RAMPS
      </div>
    </div>
  );
};
