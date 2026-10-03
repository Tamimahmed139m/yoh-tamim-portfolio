import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, UtensilsCrossed, Check, Clock } from 'lucide-react';

interface Recipe {
  name: string;
  ingredients: string[];
}

const RECIPES: Recipe[] = [
  { name: 'Classic Burger', ingredients: ['🍞', '🥩', '🧀', '🥬'] },
  { name: 'Pepperoni Pizza', ingredients: ['🫓', '🍅', '🧀', '🍕'] },
  { name: 'Sweet Pancake', ingredients: ['🥞', '🧈', '🍯', '🍓'] },
  { name: 'Ice Cream Sundae', ingredients: ['🍨', '🍫', '🍒'] },
  { name: 'Hot Dog Deluxe', ingredients: ['🥖', '🌭', '🧅', '🥫'] },
];

const ALL_INGREDIENTS = ['🍞', '🥩', '🧀', '🥬', '🫓', '🍅', '🍕', '🥞', '🧈', '🍯', '🍓', '🍨', '🍫', '🍒', '🥖', '🌭', '🧅', '🥫'];

export const GameKitchenChef: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Cooking Master',
  onScoreUpdate,
}) => {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [currentOrder, setCurrentOrder] = useState<Recipe>(RECIPES[0]);
  const [assembled, setAssembled] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [ordersCompleted, setOrdersCompleted] = useState(0);

  const nextOrder = useCallback(() => {
    const r = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    setCurrentOrder(r);
    setAssembled([]);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(45);
    setOrdersCompleted(0);
    setAssembled([]);
    nextOrder();
    setGameState('PLAYING');
    playSound('slide');
  }, [nextOrder]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          setGameState('GAMEOVER');
          playSound('lose');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const addIngredient = (item: string) => {
    if (gameState !== 'PLAYING') return;

    const nextIndex = assembled.length;
    const expected = currentOrder.ingredients[nextIndex];

    if (item === expected) {
      // Correct item added!
      playSound('point');
      const nextAssembled = [...assembled, item];
      setAssembled(nextAssembled);

      // Check if complete
      if (nextAssembled.length === currentOrder.ingredients.length) {
        playSound('win');
        confetti({ particleCount: 30, spread: 40 });
        const newScore = score + 150;
        setScore(newScore);
        setOrdersCompleted(c => c + 1);
        if (onScoreUpdate) onScoreUpdate(newScore);
        setTimeout(nextOrder, 350);
      }
    } else {
      // Wrong ingredient!
      playSound('hit');
      // Shake penalty
      setScore(s => Math.max(0, s - 20));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Assemble recipes in correct order</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Time
            </span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{timeLeft}s</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between shadow-2xl">
        {gameState === 'PLAYING' && (
          <>
            {/* Active Ticket Banner */}
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Order: {currentOrder.name}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {assembled.length}/{currentOrder.ingredients.length}
                </span>
              </div>

              {/* Recipe blueprint row */}
              <div className="flex items-center justify-center gap-3 py-1">
                {currentOrder.ingredients.map((ing, idx) => {
                  const isDone = idx < assembled.length;
                  const isNext = idx === assembled.length;
                  return (
                    <div
                      key={idx}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        isDone
                          ? 'bg-emerald-950/60 border border-emerald-500/60 scale-95 opacity-60'
                          : isNext
                          ? 'bg-indigo-600/30 border-2 border-indigo-400 scale-110 shadow-md'
                          : 'bg-neutral-800/60 border border-neutral-700/40 opacity-70'
                      }`}
                    >
                      {ing}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preparation Board */}
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">
                Plate Assembly
              </span>
              <div className="w-full max-w-[220px] h-14 bg-neutral-900/60 border border-dashed border-neutral-700 rounded-xl flex items-center justify-center gap-2">
                {assembled.map((item, idx) => (
                  <span key={idx} className="text-2xl animate-in zoom-in-75 duration-150">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Ingredient Selection Tray (6 options shown, includes needed ones + decoys) */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-neutral-800">
              {currentOrder.ingredients
                .concat(ALL_INGREDIENTS.filter(i => !currentOrder.ingredients.includes(i)).slice(0, 8 - currentOrder.ingredients.length))
                .sort(() => 0.5 - Math.random())
                .slice(0, 8)
                .map((item, idx) => (
                  <button
                    key={`${item}-${idx}`}
                    onClick={() => addIngredient(item)}
                    className="h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-800 hover:border-neutral-600 rounded-xl flex items-center justify-center text-xl shadow transition-transform active:scale-95"
                  >
                    {item}
                  </button>
                ))}
            </div>
          </>
        )}

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-3">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Assemble ingredients quickly in order to serve dishes before time runs out!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Open Kitchen
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">TIME'S UP!</h3>
            <p className="text-xs text-neutral-400 mb-1">Orders Served: <span className="text-white font-bold">{ordersCompleted}</span></p>
            <p className="text-xs text-amber-400 mb-4">Total Score: {score}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Next Shift
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
