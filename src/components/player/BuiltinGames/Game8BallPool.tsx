import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Circle } from 'lucide-react';

interface PoolBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isCue: boolean;
  potted: boolean;
}

const BALL_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Game8BallPool: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = '8 Ball Billiards',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'AIMING' | 'ROLLING' | 'WIN'>('AIMING');
  const [score, setScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(6);

  const stateRef = useRef({
    balls: [] as PoolBall[],
    cueAngle: 0,
    power: 0,
    isAiming: false,
    dragStart: null as { x: number; y: number } | null,
    dragCurrent: null as { x: number; y: number } | null,
    score: 0,
  });

  const initTable = useCallback(() => {
    // 6 target balls + 1 cue ball
    const balls: PoolBall[] = [
      { id: 0, x: 100, y: 170, vx: 0, vy: 0, color: '#ffffff', isCue: true, potted: false },
      { id: 1, x: 230, y: 170, vx: 0, vy: 0, color: BALL_COLORS[0], isCue: false, potted: false },
      { id: 2, x: 245, y: 160, vx: 0, vy: 0, color: BALL_COLORS[1], isCue: false, potted: false },
      { id: 3, x: 245, y: 180, vx: 0, vy: 0, color: BALL_COLORS[2], isCue: false, potted: false },
      { id: 4, x: 260, y: 150, vx: 0, vy: 0, color: BALL_COLORS[3], isCue: false, potted: false },
      { id: 5, x: 260, y: 170, vx: 0, vy: 0, color: '#111827', isCue: false, potted: false }, // 8-ball
      { id: 6, x: 260, y: 190, vx: 0, vy: 0, color: BALL_COLORS[4], isCue: false, potted: false },
    ];

    stateRef.current = {
      balls,
      cueAngle: 0,
      power: 0,
      isAiming: false,
      dragStart: null,
      dragCurrent: null,
      score: 0,
    };
    setScore(0);
    setBallsLeft(6);
    setGameState('AIMING');
    playSound('slide');
  }, []);

  useEffect(() => {
    initTable();
  }, [initTable]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'AIMING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    stateRef.current.isAiming = true;
    stateRef.current.dragStart = { x: px, y: py };
    stateRef.current.dragCurrent = { x: px, y: py };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isAiming || !stateRef.current.dragStart) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    stateRef.current.dragCurrent = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.isAiming || !s.dragStart || !s.dragCurrent) return;

    const dx = s.dragStart.x - s.dragCurrent.x;
    const dy = s.dragStart.y - s.dragCurrent.y;
    const dist = Math.min(80, Math.hypot(dx, dy));

    s.isAiming = false;
    s.dragStart = null;
    s.dragCurrent = null;

    if (dist > 8) {
      playSound('point');
      const cue = s.balls[0];
      const angle = Math.atan2(dy, dx);
      cue.vx = Math.cos(angle) * (dist * 0.16);
      cue.vy = Math.sin(angle) * (dist * 0.16);
      setGameState('ROLLING');
    }
  };

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pockets: [number, number][] = [
      [35, 35], [170, 30], [305, 35],
      [35, 305], [170, 310], [305, 305],
    ];

    const loop = () => {
      const s = stateRef.current;

      // Ball physics & friction
      let anyMoving = false;
      const radius = 9;

      s.balls.forEach(b => {
        if (b.potted) return;

        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.985;
        b.vy *= 0.985;

        if (Math.hypot(b.vx, b.vy) > 0.08) anyMoving = true;
        else {
          b.vx = 0;
          b.vy = 0;
        }

        // Cushion bounce
        if (b.x < 42 || b.x > 298) {
          b.vx *= -0.85;
          b.x = Math.max(42, Math.min(298, b.x));
          if (Math.hypot(b.vx, b.vy) > 0.8) playSound('hit');
        }
        if (b.y < 42 || b.y > 298) {
          b.vy *= -0.85;
          b.y = Math.max(42, Math.min(298, b.y));
          if (Math.hypot(b.vx, b.vy) > 0.8) playSound('hit');
        }

        // Check pockets
        pockets.forEach(([px, py]) => {
          if (!b.potted && Math.hypot(b.x - px, b.y - py) < 18) {
            b.potted = true;
            b.vx = 0;
            b.vy = 0;

            if (b.isCue) {
              // Scratch! Reset cue ball
              playSound('lose');
              setTimeout(() => {
                b.potted = false;
                b.x = 100;
                b.y = 170;
              }, 500);
            } else {
              playSound('win');
              s.score += 100;
              setScore(s.score);
              if (onScoreUpdate) onScoreUpdate(s.score);
              const remaining = s.balls.filter(i => !i.isCue && !i.potted).length;
              setBallsLeft(remaining);
              if (remaining === 0) {
                confetti({ particleCount: 70, spread: 60 });
                setGameState('WIN');
              }
            }
          }
        });
      });

      // Ball to ball collision
      for (let i = 0; i < s.balls.length; i++) {
        for (let j = i + 1; j < s.balls.length; j++) {
          const b1 = s.balls[i];
          const b2 = s.balls[j];
          if (b1.potted || b2.potted) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);

          if (dist < radius * 2) {
            playSound('hit');
            // Elastic collision
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            const vx1 = b1.vx * cos + b1.vy * sin;
            const vy1 = b1.vy * cos - b1.vx * sin;
            const vx2 = b2.vx * cos + b2.vy * sin;
            const vy2 = b2.vy * cos - b2.vx * sin;

            b1.vx = vx2 * cos - vy1 * sin;
            b1.vy = vy1 * cos + vx2 * sin;
            b2.vx = vx1 * cos - vy2 * sin;
            b2.vy = vy2 * cos + vx1 * sin;

            // Separate overlapping balls
            const overlap = radius * 2 - dist;
            b1.x -= (dx / dist) * overlap * 0.5;
            b1.y -= (dy / dist) * overlap * 0.5;
            b2.x += (dx / dist) * overlap * 0.5;
            b2.y += (dy / dist) * overlap * 0.5;
          }
        }
      }

      if (gameState === 'ROLLING' && !anyMoving) {
        setGameState('AIMING');
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Wood Railing
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.roundRect(15, 15, 310, 310, 16);
      ctx.fill();

      // Green Felt Table
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(32, 32, 276, 276, 8);
      ctx.fill();

      // Draw Pockets (Black holes)
      ctx.fillStyle = '#0f172a';
      pockets.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fill();
      });

      // Aim Line / Cue Stick
      const cue = s.balls[0];
      if (gameState === 'AIMING' && s.isAiming && s.dragStart && s.dragCurrent && !cue.potted) {
        const dx = s.dragStart.x - s.dragCurrent.x;
        const dy = s.dragStart.y - s.dragCurrent.y;
        const angle = Math.atan2(dy, dx);
        const powerLen = Math.min(70, Math.hypot(dx, dy));

        // Aim guide dotted line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cue.x, cue.y);
        ctx.lineTo(cue.x + Math.cos(angle) * 120, cue.y + Math.sin(angle) * 120);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cue stick pull back
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cue.x - Math.cos(angle) * (radius + 6 + powerLen), cue.y - Math.sin(angle) * (radius + 6 + powerLen));
        ctx.lineTo(cue.x - Math.cos(angle) * (radius + 60 + powerLen), cue.y - Math.sin(angle) * (radius + 60 + powerLen));
        ctx.stroke();
      }

      // Draw Balls
      s.balls.forEach(b => {
        if (b.potted) return;
        ctx.save();
        ctx.translate(b.x, b.y);

        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // 3D Ball Glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-2.5, -2.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

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
          <p className="text-xs text-neutral-400">Pull back and release to shoot the cue ball</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Remaining</span>
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">{ballsLeft}</span>
          </div>
          <button
            onClick={initTable}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Re-rack Table"
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
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">ALL BALLS POCKETED!</h3>
            <p className="text-xs text-neutral-400 mb-4">Masterful break and run!</p>
            <button
              onClick={initTable}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              Play Another Rack
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-2 text-center text-xs text-neutral-400 font-medium">
        DRAG BACK FROM CUE BALL TO AIM & SET POWER
      </div>
    </div>
  );
};
