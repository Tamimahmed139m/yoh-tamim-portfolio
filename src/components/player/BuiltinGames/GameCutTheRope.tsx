import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Scissors, Star } from 'lucide-react';

interface RopePoint {
  x: number;
  y: number;
}

interface StarItem {
  x: number;
  y: number;
  collected: boolean;
}

export const GameCutTheRope: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Cut The Rope',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'WIN' | 'LOSE'>('MENU');
  const [starsCollected, setStarsCollected] = useState(0);

  const stateRef = useRef({
    anchor1: { x: 70, y: 35 },
    anchor2: { x: 270, y: 45 },
    rope1Cut: false,
    rope2Cut: false,
    candyX: 170,
    candyY: 130,
    candyVx: 0,
    candyVy: 0,
    monsterX: 170,
    monsterY: 285,
    stars: [
      { x: 120, y: 190, collected: false },
      { x: 170, y: 220, collected: false },
      { x: 220, y: 190, collected: false },
    ] as StarItem[],
    slicePath: [] as { x: number; y: number }[],
    isWon: false,
  });

  const startGame = useCallback(() => {
    stateRef.current = {
      anchor1: { x: 70, y: 35 },
      anchor2: { x: 270, y: 45 },
      rope1Cut: false,
      rope2Cut: false,
      candyX: 170,
      candyY: 130,
      candyVx: 2.2,
      candyVy: 0,
      monsterX: 170,
      monsterY: 285,
      stars: [
        { x: 120, y: 190, collected: false },
        { x: 170, y: 220, collected: false },
        { x: 220, y: 190, collected: false },
      ],
      slicePath: [],
      isWon: false,
    };
    setStarsCollected(0);
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
    s.slicePath.push({ x: px, y: py });
    if (s.slicePath.length > 8) s.slicePath.shift();

    // Check line intersection with rope 1
    if (!s.rope1Cut) {
      const midX = (s.anchor1.x + s.candyX) / 2;
      const midY = (s.anchor1.y + s.candyY) / 2;
      if (Math.hypot(px - midX, py - midY) < 22) {
        s.rope1Cut = true;
        playSound('whoosh');
      }
    }

    // Check line intersection with rope 2
    if (!s.rope2Cut) {
      const midX = (s.anchor2.x + s.candyX) / 2;
      const midY = (s.anchor2.y + s.candyY) / 2;
      if (Math.hypot(px - midX, py - midY) < 22) {
        s.rope2Cut = true;
        playSound('whoosh');
      }
    }
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

      // Gravity
      s.candyVy += 0.32;

      // Rope spring physics
      if (!s.rope1Cut) {
        const dx = s.anchor1.x - s.candyX;
        const dy = s.anchor1.y - s.candyY;
        const dist = Math.hypot(dx, dy);
        const restLen = 135;
        if (dist > restLen) {
          const force = (dist - restLen) * 0.08;
          s.candyVx += (dx / dist) * force;
          s.candyVy += (dy / dist) * force;
        }
      }

      if (!s.rope2Cut) {
        const dx = s.anchor2.x - s.candyX;
        const dy = s.anchor2.y - s.candyY;
        const dist = Math.hypot(dx, dy);
        const restLen = 135;
        if (dist > restLen) {
          const force = (dist - restLen) * 0.08;
          s.candyVx += (dx / dist) * force;
          s.candyVy += (dy / dist) * force;
        }
      }

      // Air resistance damping
      s.candyVx *= 0.985;
      s.candyVy *= 0.985;

      s.candyX += s.candyVx;
      s.candyY += s.candyVy;

      // Collect stars
      s.stars.forEach(st => {
        if (!st.collected) {
          if (Math.hypot(s.candyX - st.x, s.candyY - st.y) < 24) {
            st.collected = true;
            playSound('point');
            setStarsCollected(s.stars.filter(i => i.collected).length);
          }
        }
      });

      // Monster fed condition
      if (!s.isWon) {
        const distToMonster = Math.hypot(s.candyX - s.monsterX, s.candyY - s.monsterY);
        if (distToMonster < 28) {
          s.isWon = true;
          playSound('win');
          confetti({ particleCount: 60, spread: 60 });
          setGameState('WIN');
          if (onScoreUpdate) onScoreUpdate(300);
          return;
        }
      }

      // Lost off-screen
      if (s.candyY > 360 || s.candyX < -20 || s.candyX > 360) {
        playSound('lose');
        setGameState('LOSE');
        return;
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cardboard box background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Ropes
      if (!s.rope1Cut) {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.anchor1.x, s.anchor1.y);
        ctx.lineTo(s.candyX, s.candyY);
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(s.anchor1.x, s.anchor1.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!s.rope2Cut) {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.anchor2.x, s.anchor2.y);
        ctx.lineTo(s.candyX, s.candyY);
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(s.anchor2.x, s.anchor2.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      for (const st of s.stars) {
        if (!st.collected) {
          ctx.save();
          ctx.translate(st.x, st.y);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Monster (Om Nom green creature at bottom)
      ctx.save();
      ctx.translate(s.monsterX, s.monsterY);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      // Monster Big Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-8, -10, 8, 0, Math.PI * 2);
      ctx.arc(8, -10, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-8, -10, 3, 0, Math.PI * 2);
      ctx.arc(8, -10, 3, 0, Math.PI * 2);
      ctx.fill();

      // Open Mouth
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.arc(0, 8, 10, 0, Math.PI);
      ctx.fill();
      ctx.restore();

      // Candy (Peppermint red & white)
      ctx.save();
      ctx.translate(s.candyX, s.candyY);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Slice blade trail
      if (s.slicePath.length > 1) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < s.slicePath.length; i++) {
          const pt = s.slicePath[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
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
          <p className="text-xs text-neutral-400">Swipe or drag across ropes to feed the monster</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold font-mono tabular-nums text-white">{starsCollected}/3</span>
          </div>
          <button
            onClick={startGame}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Restart Level"
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
          onPointerMove={handlePointerMove}
          className="w-full h-full block touch-none"
        />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default z-20">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Scissors className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Swipe across the ropes with touch or mouse to release the candy into the green monster!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Cut Ropes
            </button>
          </div>
        )}

        {gameState === 'WIN' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20 cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">FED SUCCESSFULLY!</h3>
            <p className="text-xs text-amber-400 mb-4">Collected {starsCollected} Stars ⭐</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Next Level
            </button>
          </div>
        )}

        {gameState === 'LOSE' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20 cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">CANDY DROPPED!</h3>
            <p className="text-xs text-neutral-400 mb-4">The candy missed the monster's mouth.</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-2 text-center text-xs text-neutral-400 font-medium">
        DRAG CURSOR / SWIPE TO SLICE ROPES
      </div>
    </div>
  );
};
