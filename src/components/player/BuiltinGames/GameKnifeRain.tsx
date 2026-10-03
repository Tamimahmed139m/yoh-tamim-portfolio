import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Target, Zap } from 'lucide-react';

interface Pin {
  angle: number; // in radians
}

interface GameKnifeRainProps {
  title?: string;
  onScoreUpdate?: (score: number) => void;
}

export const GameKnifeRain: React.FC<GameKnifeRainProps> = ({ title = 'Knife Rain', onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [pinsLeft, setPinsLeft] = useState(7);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER' | 'LEVEL_CLEAR'>('MENU');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    wheelAngle: 0,
    wheelSpeed: 0.03,
    direction: 1,
    pins: [] as Pin[],
    pinsLeft: 7,
    flyingPin: null as { y: number } | null,
    score: 0,
    level: 1,
    lastSpeedChange: 0,
  });

  const shootPin = useCallback(() => {
    const s = stateRef.current;
    if (gameState !== 'PLAYING' || s.flyingPin !== null || s.pinsLeft <= 0) return;

    playSound('whoosh');
    s.flyingPin = { y: 280 };
  }, [gameState]);

  const startLevel = useCallback((lvl: number, keepScore = 0) => {
    // Generate initial pins on the target based on level
    const initialCount = Math.min(3 + Math.floor(lvl / 2), 6);
    const initialPins: Pin[] = [];
    const step = (Math.PI * 2) / initialCount;
    for (let i = 0; i < initialCount; i++) {
      initialPins.push({ angle: i * step + Math.random() * 0.2 });
    }

    const targetPins = 6 + Math.min(lvl, 8);
    stateRef.current = {
      wheelAngle: 0,
      wheelSpeed: 0.025 + Math.min(lvl * 0.005, 0.05),
      direction: Math.random() > 0.5 ? 1 : -1,
      pins: initialPins,
      pinsLeft: targetPins,
      flyingPin: null,
      score: keepScore,
      level: lvl,
      lastSpeedChange: Date.now(),
    };

    setLevel(lvl);
    setPinsLeft(targetPins);
    setGameState('PLAYING');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        shootPin();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [shootPin]);

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

      // Random speed / direction fluctuation for high levels
      if (s.level > 2 && now - s.lastSpeedChange > 3000) {
        s.lastSpeedChange = now;
        if (Math.random() < 0.4) s.direction *= -1;
      }

      s.wheelAngle += s.wheelSpeed * s.direction;

      // Update flying pin
      if (s.flyingPin) {
        s.flyingPin.y -= 14;

        // Reached wheel boundary (radius 55, wheel center at y = 110)
        if (s.flyingPin.y <= 110 + 55) {
          const hitAngle = Math.PI / 2 - s.wheelAngle; // at bottom of wheel (angle PI/2)
          const normalizedHit = ((hitAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

          // Check collision with existing pins
          const MIN_ANGULAR_GAP = 0.24; // ~14 degrees
          let hitExisting = false;

          for (const p of s.pins) {
            const pAngle = ((p.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            let diff = Math.abs(pAngle - normalizedHit);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;

            if (diff < MIN_ANGULAR_GAP) {
              hitExisting = true;
              break;
            }
          }

          if (hitExisting) {
            // Collision Game Over
            playSound('lose');
            s.flyingPin = null;
            setGameState('GAMEOVER');
            return;
          } else {
            // Successfully stuck pin
            playSound('point');
            s.pins.push({ angle: normalizedHit });
            s.pinsLeft -= 1;
            s.score += 10;
            s.flyingPin = null;

            setPinsLeft(s.pinsLeft);
            setScore(s.score);
            if (onScoreUpdate) onScoreUpdate(s.score);

            if (s.pinsLeft <= 0) {
              // Level Clear!
              playSound('win');
              confetti({ particleCount: 50, spread: 50 });
              setGameState('LEVEL_CLEAR');
              return;
            }
          }
        }
      }

      // DRAWING
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = 110;
      const wheelRadius = 50;

      // Draw Spinning Target
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(s.wheelAngle);

      // Core Target
      ctx.beginPath();
      ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1c1917';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      // Inner Target bullseye
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#b45309';
      ctx.fill();

      // Level number in wheel center
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(s.level), 0, 0);

      // Draw stuck pins
      for (const p of s.pins) {
        ctx.save();
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.moveTo(0, wheelRadius);
        ctx.lineTo(0, wheelRadius + 45);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // Pin head
        ctx.beginPath();
        ctx.arc(0, wheelRadius + 45, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      // Draw Flying Pin
      if (s.flyingPin) {
        ctx.beginPath();
        ctx.moveTo(cx, s.flyingPin.y);
        ctx.lineTo(cx, s.flyingPin.y + 45);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, s.flyingPin.y + 45, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
      }

      // Draw current pending pin at bottom
      if (!s.flyingPin && s.pinsLeft > 0) {
        const startY = 270;
        ctx.beginPath();
        ctx.moveTo(cx, startY);
        ctx.lineTo(cx, startY + 45);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, startY + 45, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
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
          <p className="text-xs text-neutral-400">Launch pins without hitting existing needles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Stage</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{level}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Pins</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{pinsLeft}</span>
          </div>
        </div>
      </div>

      <div
        onClick={shootPin}
        className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer"
      >
        <canvas ref={canvasRef} width={340} height={340} className="w-full h-full block" />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Tap or press Spacebar to throw pins into the spinning target. Never hit another pin!
            </p>
            <button
              onClick={() => startLevel(1, 0)}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Play Now
            </button>
          </div>
        )}

        {gameState === 'LEVEL_CLEAR' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">STAGE {level} CLEARED!</h3>
            <p className="text-xs text-neutral-300 mb-4">Total Score: {score}</p>
            <button
              onClick={() => startLevel(level + 1, score)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              Next Stage →
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">PIN CRASH</h3>
            <p className="text-xs text-neutral-400 mb-1">You struck an existing pin!</p>
            <p className="text-xs text-amber-400 mb-4">Reached Stage {level} · Score: {score}</p>
            <button
              onClick={() => startLevel(1, 0)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-3 text-center">
        <button
          onClick={shootPin}
          disabled={gameState !== 'PLAYING'}
          className="w-full max-w-[280px] py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-98 disabled:opacity-50"
        >
          TAP / CLICK TO SHOOT PIN
        </button>
      </div>
    </div>
  );
};
