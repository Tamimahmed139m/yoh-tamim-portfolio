import React, { useState } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Sparkles } from 'lucide-react';

const POP_PALETTE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

export const GamePopIt3D: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Pop It! 3D',
  onScoreUpdate,
}) => {
  const [popped, setPopped] = useState<boolean[]>(Array(36).fill(false));
  const [score, setScore] = useState(0);

  const togglePop = (index: number) => {
    playSound('point');
    const next = [...popped];
    next[index] = !next[index];
    setPopped(next);

    const count = next.filter(Boolean).length;
    setScore(count * 10);
    if (onScoreUpdate) onScoreUpdate(count * 10);

    if (count === 36) {
      playSound('win');
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  const flipPad = () => {
    playSound('slide');
    setPopped(Array(36).fill(false));
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Pop tactile silicone bubbles to relieve stress</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Popped</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">
              {popped.filter(Boolean).length}/36
            </span>
          </div>
          <button
            onClick={flipPad}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Flip Pad"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-2xl flex items-center justify-center">
        {/* Silicone Rainbow Shell */}
        <div className="w-full h-full rounded-3xl p-3 bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 shadow-2xl shadow-indigo-500/20 grid grid-cols-6 grid-rows-6 gap-2">
          {popped.map((isPopped, idx) => {
            const row = Math.floor(idx / 6);
            const color = POP_PALETTE[row];
            return (
              <button
                key={idx}
                onClick={() => togglePop(idx)}
                style={{ backgroundColor: color }}
                className={`rounded-full transition-all duration-150 flex items-center justify-center shadow-md active:scale-90 ${
                  isPopped
                    ? 'scale-90 opacity-60 inset-shadow-sm'
                    : 'scale-100 opacity-100 ring-2 ring-white/30'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    isPopped ? 'bg-black/30' : 'bg-white/40'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full mt-2 text-center text-xs text-neutral-400 font-medium">
        TAP BUBBLES TO POP · FLIP PAD TO POP AGAIN
      </div>
    </div>
  );
};
