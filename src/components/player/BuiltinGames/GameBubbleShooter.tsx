import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

interface Bubble {
  x: number;
  y: number;
  color: string;
}

const BUBBLE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const RADIUS = 14;

interface GameBubbleShooterProps {
  title?: string;
  category?: string;
  onScoreUpdate?: (score: number) => void;
}

export const GameBubbleShooter: React.FC<GameBubbleShooterProps> = ({
  title = 'Bubble Shooter',
  category = 'Arcade',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('MENU');
  const [score, setScore] = useState(0);

  const stateRef = useRef({
    bubbles: [] as Bubble[],
    currentBubbleColor: BUBBLE_COLORS[0],
    aimAngle: -Math.PI / 2,
    bullet: null as { x: number; y: number; vx: number; vy: number; color: string } | null,
    score: 0,
  });

  const nextColor = () => BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];

  const initGame = useCallback(() => {
    const bubbles: Bubble[] = [];
    // 5 rows of bubbles
    const rows = 4;
    const cols = 9;
    const startX = 28;
    const startY = 30;

    for (let r = 0; r < rows; r++) {
      const offsetX = r % 2 === 1 ? RADIUS : 0;
      for (let c = 0; c < cols; c++) {
        bubbles.push({
          x: startX + c * (RADIUS * 2 + 3) + offsetX,
          y: startY + r * (RADIUS * 2 + 1),
          color: nextColor(),
        });
      }
    }

    stateRef.current = {
      bubbles,
      currentBubbleColor: nextColor(),
      aimAngle: -Math.PI / 2,
      bullet: null,
      score: 0,
    };
    setScore(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  const shoot = useCallback(() => {
    const s = stateRef.current;
    if (gameState !== 'PLAYING' || s.bullet) return;

    playSound('whoosh');
    const speed = 9;
    s.bullet = {
      x: 170,
      y: 310,
      vx: Math.cos(s.aimAngle) * speed,
      vy: Math.sin(s.aimAngle) * speed,
      color: s.currentBubbleColor,
    };
    s.currentBubbleColor = nextColor();
  }, [gameState]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const dx = px - 170;
    const dy = py - 310;
    let angle = Math.atan2(dy, dx);
    // Restrict angle to upper half
    if (angle > -0.2) angle = -0.2;
    if (angle < -Math.PI + 0.2) angle = -Math.PI + 0.2;
    stateRef.current.aimAngle = angle;
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

      // Update bullet
      if (s.bullet) {
        s.bullet.x += s.bullet.vx;
        s.bullet.y += s.bullet.vy;

        // Wall bounce
        if (s.bullet.x - RADIUS <= 0 || s.bullet.x + RADIUS >= canvas.width) {
          s.bullet.vx *= -1;
          playSound('hit');
        }

        // Top wall hit or bubble collision
        let hit = false;
        if (s.bullet.y - RADIUS <= 15) {
          hit = true;
        } else {
          for (let i = 0; i < s.bubbles.length; i++) {
            const b = s.bubbles[i];
            const dist = Math.hypot(b.x - s.bullet.x, b.y - s.bullet.y);
            if (dist < RADIUS * 1.8) {
              hit = true;
              break;
            }
          }
        }

        if (hit) {
          // Snap bullet as a new bubble
          const newBubble: Bubble = {
            x: s.bullet.x,
            y: s.bullet.y,
            color: s.bullet.color,
          };
          s.bubbles.push(newBubble);
          s.bullet = null;
          playSound('click');

          // Find matches
          const matches: Bubble[] = [newBubble];
          const visited = new Set<Bubble>([newBubble]);
          const queue = [newBubble];

          while (queue.length > 0) {
            const current = queue.shift()!;
            for (const other of s.bubbles) {
              if (!visited.has(other) && other.color === current.color) {
                const d = Math.hypot(other.x - current.x, other.y - current.y);
                if (d < RADIUS * 2.3) {
                  visited.add(other);
                  matches.push(other);
                  queue.push(other);
                }
              }
            }
          }

          if (matches.length >= 3) {
            // Pop matched bubbles!
            playSound('point');
            s.bubbles = s.bubbles.filter(b => !matches.includes(b));
            s.score += matches.length * 20;
            setScore(s.score);
            if (onScoreUpdate) onScoreUpdate(s.score);

            if (s.bubbles.length === 0) {
              playSound('win');
              confetti({ particleCount: 70, spread: 70 });
              setGameState('VICTORY');
              return;
            }
          }

          // Check if bubbles reached bottom
          if (s.bubbles.some(b => b.y > 270)) {
            playSound('lose');
            setGameState('GAMEOVER');
            return;
          }
        }
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ceiling line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(canvas.width, 16);
      ctx.stroke();

      // Draw all grid bubbles
      for (const b of s.bubbles) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fill();

        // Highlight glint
        ctx.beginPath();
        ctx.arc(b.x - 4, b.y - 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Aim Line
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(170, 310);
      ctx.lineTo(170 + Math.cos(s.aimAngle) * 60, 310 + Math.sin(s.aimAngle) * 60);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current Launcher Shooter
      ctx.beginPath();
      ctx.arc(170, 310, RADIUS + 1, 0, Math.PI * 2);
      ctx.fillStyle = s.currentBubbleColor;
      ctx.shadowColor = s.currentBubbleColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Flying bullet
      if (s.bullet) {
        ctx.beginPath();
        ctx.arc(s.bullet.x, s.bullet.y, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = s.bullet.color;
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
          <p className="text-xs text-neutral-400">Aim and shoot to match 3 or more bubbles</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
          <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
          <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
        </div>
      </div>

      <div
        onClick={shoot}
        className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onPointerMove={handlePointerMove}
          className="w-full h-full block"
        />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Move pointer to aim, tap or click to launch bubbles and clear the board.
            </p>
            <button
              onClick={initGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Start Game
            </button>
          </div>
        )}

        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">BOARD CLEARED!</h3>
            <p className="text-xs text-neutral-300 mb-4">Total Score: {score}</p>
            <button
              onClick={initGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">BUBBLES REACHED BOTTOM</h3>
            <p className="text-xs text-neutral-400 mb-4">Final Score: {score}</p>
            <button
              onClick={initGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-3 text-center">
        <button
          onClick={shoot}
          disabled={gameState !== 'PLAYING'}
          className="w-full max-w-[280px] py-2.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-50"
        >
          TAP TO LAUNCH BUBBLE
        </button>
      </div>
    </div>
  );
};
