import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Droplets, CheckCircle2 } from 'lucide-react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

export const GameColorWaterSort: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Color Water Sort 3D',
  onScoreUpdate,
}) => {
  const [tubes, setTubes] = useState<string[][]>([]);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initLevel = useCallback((lvl: number) => {
    // 4 filled tubes (4 layers each) + 2 empty tubes
    const pool = [
      ...Array(4).fill(COLORS[0]),
      ...Array(4).fill(COLORS[1]),
      ...Array(4).fill(COLORS[2]),
      ...Array(4).fill(COLORS[3]),
    ];
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const t1 = pool.slice(0, 4);
    const t2 = pool.slice(4, 8);
    const t3 = pool.slice(8, 12);
    const t4 = pool.slice(12, 16);
    const t5: string[] = [];
    const t6: string[] = [];

    setTubes([t1, t2, t3, t4, t5, t6]);
    setSelectedTube(null);
    setMoves(0);
    setIsWon(false);
    playSound('slide');
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [initLevel, level]);

  const handleTubeClick = (index: number) => {
    if (isWon) return;

    if (selectedTube === null) {
      // Select source tube (only if not empty)
      if (tubes[index].length > 0) {
        playSound('click');
        setSelectedTube(index);
      }
    } else {
      if (selectedTube === index) {
        // Deselect
        setSelectedTube(null);
        return;
      }

      // Try to pour from selectedTube to index
      const src = tubes[selectedTube];
      const dest = tubes[index];

      // Destination cannot be full (max 4 layers)
      if (dest.length < 4) {
        const topColor = src[src.length - 1];

        // Valid if dest is empty OR dest top color matches
        if (dest.length === 0 || dest[dest.length - 1] === topColor) {
          playSound('whoosh');
          const newTubes = tubes.map(t => [...t]);

          // Pour matching consecutive colors
          while (
            newTubes[selectedTube].length > 0 &&
            newTubes[index].length < 4 &&
            newTubes[selectedTube][newTubes[selectedTube].length - 1] === topColor
          ) {
            const poured = newTubes[selectedTube].pop()!;
            newTubes[index].push(poured);
          }

          setTubes(newTubes);
          setSelectedTube(null);
          setMoves(m => m + 1);

          // Check win condition (every tube is either empty OR has 4 identical colors)
          const allSorted = newTubes.every(t => {
            if (t.length === 0) return true;
            if (t.length === 4) {
              return t.every(c => c === t[0]);
            }
            return false;
          });

          if (allSorted) {
            playSound('win');
            confetti({ particleCount: 75, spread: 60 });
            setIsWon(true);
            if (onScoreUpdate) onScoreUpdate(level * 200);
          }
          return;
        }
      }

      // Invalid move sound
      playSound('hit');
      setSelectedTube(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Sort liquids until each tube holds one color</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Moves</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{moves}</span>
          </div>
          <button
            onClick={() => initLevel(level)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Restart Level"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Test Tubes Shelf */}
      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-2xl flex flex-col justify-center items-center">
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
          {tubes.map((tube, idx) => {
            const isSelected = selectedTube === idx;
            return (
              <button
                key={idx}
                onClick={() => handleTubeClick(idx)}
                className={`relative h-36 w-14 mx-auto rounded-b-2xl border-2 border-t-0 flex flex-col-reverse p-1 bg-neutral-900/50 shadow-lg transition-all duration-150 ${
                  isSelected
                    ? '-translate-y-3 border-indigo-400 shadow-indigo-500/30'
                    : 'border-neutral-700/60 hover:border-neutral-500'
                }`}
              >
                {/* Lip of tube */}
                <div className="absolute -top-1 left-0 right-0 h-1.5 rounded-t-sm bg-neutral-700" />

                {/* Color Layers */}
                {tube.map((color, cIdx) => (
                  <div
                    key={cIdx}
                    className="w-full h-7 rounded-sm transition-all duration-200"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </button>
            );
          })}
        </div>

        {isWon && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">PERFECTLY SORTED!</h3>
            <p className="text-xs text-neutral-300 mb-4">Completed in {moves} moves</p>
            <button
              onClick={() => {
                setLevel(l => l + 1);
                initLevel(level + 1);
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              Next Level →
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-2 text-center text-xs text-neutral-400 font-medium">
        TAP SOURCE TUBE → TAP DESTINATION TUBE
      </div>
    </div>
  );
};
