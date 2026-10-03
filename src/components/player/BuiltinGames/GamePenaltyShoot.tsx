import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Trophy } from 'lucide-react';

export const GamePenaltyShoot: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Penalty Shootout',
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const stateRef = useRef({
    ballX: 170,
    ballY: 280,
    ballRadius: 14,
    isShooting: false,
    vx: 0,
    vy: 0,
    goalieX: 170,
    goalieSpeed: 2.2,
    goalieDirection: 1,
    score: 0,
    streak: 0,
    attempts: 5,
    dragStart: null as { x: number; y: number } | null,
    dragCurrent: null as { x: number; y: number } | null,
  });

  const resetBall = useCallback(() => {
    const s = stateRef.current;
    s.ballX = 170;
    s.ballY = 280;
    s.vx = 0;
    s.vy = 0;
    s.isShooting = false;
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = {
      ballX: 170,
      ballY: 280,
      ballRadius: 14,
      isShooting: false,
      vx: 0,
      vy: 0,
      goalieX: 170,
      goalieSpeed: 2.2,
      goalieDirection: 1,
      score: 0,
      streak: 0,
      attempts: 5,
      dragStart: null,
      dragCurrent: null,
    };
    setScore(0);
    setStreak(0);
    setAttemptsLeft(5);
    setFeedbackText('');
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || stateRef.current.isShooting) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    stateRef.current.dragStart = { x: px, y: py };
    stateRef.current.dragCurrent = { x: px, y: py };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragStart || stateRef.current.isShooting) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    stateRef.current.dragCurrent = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerUp = () => {
    const s = stateRef.current;
    if (!s.dragStart || !s.dragCurrent || s.isShooting) return;

    const dx = s.dragCurrent.x - s.dragStart.x;
    const dy = s.dragCurrent.y - s.dragStart.y;
    s.dragStart = null;
    s.dragCurrent = null;

    // Must swipe upwards
    if (dy > -15) return;

    playSound('whoosh');
    s.isShooting = true;
    s.vx = Math.max(-5, Math.min(5, dx * 0.15));
    s.vy = Math.max(-12, Math.min(-6, dy * 0.18));
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

      // Move goalie side to side
      s.goalieX += s.goalieSpeed * s.goalieDirection;
      if (s.goalieX <= 100 || s.goalieX >= 240) {
        s.goalieDirection *= -1;
      }

      // Update ball physics
      if (s.isShooting) {
        s.ballX += s.vx;
        s.ballY += s.vy;
        s.ballRadius = Math.max(9, s.ballRadius - 0.12); // Perspective scaling

        // Goal Post boundaries: X between 80 and 260, Y between 50 and 110
        if (s.ballY <= 105) {
          // Check goalie save
          const goalieDist = Math.hypot(s.ballX - s.goalieX, s.ballY - 95);
          if (goalieDist < 26) {
            // SAVED!
            playSound('hit');
            setFeedbackText('SAVED BY GOALIE!');
            s.streak = 0;
            s.attempts -= 1;
            setStreak(0);
            setAttemptsLeft(s.attempts);

            if (s.attempts <= 0) {
              setTimeout(() => setGameState('GAMEOVER'), 800);
            } else {
              setTimeout(resetBall, 700);
            }
          } else if (s.ballX >= 85 && s.ballX <= 255) {
            // GOAL!!
            playSound('point');
            confetti({ particleCount: 40, spread: 50 });
            setFeedbackText('GOAL! +100 PTS');
            s.streak += 1;
            s.score += 100 + s.streak * 20;
            setScore(s.score);
            setStreak(s.streak);
            if (onScoreUpdate) onScoreUpdate(s.score);

            // Faster goalie
            s.goalieSpeed = Math.min(5, 2.2 + s.streak * 0.3);
            setTimeout(resetBall, 600);
          } else {
            // MISSED WIDE
            playSound('lose');
            setFeedbackText('MISSED THE NET!');
            s.streak = 0;
            s.attempts -= 1;
            setStreak(0);
            setAttemptsLeft(s.attempts);

            if (s.attempts <= 0) {
              setTimeout(() => setGameState('GAMEOVER'), 800);
            } else {
              setTimeout(resetBall, 700);
            }
          }
        }
      }

      // RENDER
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pitch Grass (Dark Emerald)
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Field lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 40, 240, 110); // Penalty box

      // Goal Net
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(80, 50, 180, 60);

      // Goal Net Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      for (let x = 80; x <= 260; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, 110);
        ctx.stroke();
      }
      for (let y = 50; y <= 110; y += 15) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(260, y);
        ctx.stroke();
      }

      // Goal Posts (White frame)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(80, 110);
      ctx.lineTo(80, 50);
      ctx.lineTo(260, 50);
      ctx.lineTo(260, 110);
      ctx.stroke();

      // Goalkeeper
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(s.goalieX, 90, 14, 0, Math.PI * 2);
      ctx.fill();
      // Goalkeeper gloves
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.goalieX - 20, 84, 8, 8);
      ctx.fillRect(s.goalieX + 12, 84, 8, 8);

      // Penalty Spot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(170, 280, 4, 0, Math.PI * 2);
      ctx.fill();

      // Swipe Guide Line
      if (s.dragStart && s.dragCurrent && !s.isShooting) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(s.ballX, s.ballY);
        const dx = s.dragCurrent.x - s.dragStart.x;
        const dy = s.dragCurrent.y - s.dragStart.y;
        ctx.lineTo(s.ballX + dx * 0.8, s.ballY + dy * 0.8);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ball (Football / Basketball texture)
      ctx.save();
      ctx.translate(s.ballX, s.ballY);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, s.ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ball pentagon pattern
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, s.ballRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, resetBall, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Swipe or drag ball upwards to shoot</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Streak</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{streak}x</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Balls</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{attemptsLeft}</span>
          </div>
        </div>
      </div>

      <div
        className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center touch-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block"
        />

        {feedbackText && gameState === 'PLAYING' && (
          <div className="absolute top-4 inset-x-0 text-center pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700 text-xs font-bold font-mono text-white shadow-lg animate-in fade-in">
              {feedbackText}
            </span>
          </div>
        )}

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Drag and flick the ball towards the net to beat the goalkeeper! Build streaks for higher scores.
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Kick Off
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">FULL TIME</h3>
            <p className="text-xs text-neutral-400 mb-1">Final Score: <span className="text-white font-bold">{score}</span></p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Play Match Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-3 text-center text-xs text-neutral-400 font-medium">
        CLICK & FLICK UPWARDS TO SHOOT
      </div>
    </div>
  );
};
