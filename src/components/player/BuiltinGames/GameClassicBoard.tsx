import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Crown, Sparkles } from 'lucide-react';

interface Card {
  id: number;
  val: number;
  suit: '♠' | '♥' | '♦' | '♣';
  color: 'red' | 'black';
  cleared: boolean;
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

function rankLabel(val: number): string {
  if (val === 1) return 'A';
  if (val === 11) return 'J';
  if (val === 12) return 'Q';
  if (val === 13) return 'K';
  return String(val);
}

export const GameClassicBoard: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Solitaire Classic',
  onScoreUpdate,
}) => {
  const [tableCards, setTableCards] = useState<Card[]>([]);
  const [stockCards, setStockCards] = useState<Card[]>([]);
  const [activeWaste, setActiveWaste] = useState<Card | null>(null);
  const [score, setScore] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initGame = useCallback(() => {
    // Deck of 52
    const deck: Card[] = [];
    let id = 0;
    for (const suit of SUITS) {
      const color = suit === '♥' || suit === '♦' ? 'red' : 'black';
      for (const val of RANKS) {
        deck.push({ id: id++, val, suit, color, cleared: false });
      }
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // 12 cards on the table
    const table = deck.slice(0, 12);
    const stock = deck.slice(12);

    setTableCards(table);
    setStockCards(stock.slice(1));
    setActiveWaste(stock[0]);
    setScore(0);
    setIsWon(false);
    playSound('slide');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const drawStock = () => {
    if (stockCards.length === 0) return;
    playSound('click');
    const next = stockCards[0];
    setActiveWaste(next);
    setStockCards(stockCards.slice(1));
  };

  const handleCardClick = (card: Card) => {
    if (card.cleared || !activeWaste) return;

    // Check if card is 1 above or 1 below the active waste (TriPeaks / Golf Solitaire rule)
    const diff = Math.abs(card.val - activeWaste.val);
    const isAdjacent = diff === 1 || (card.val === 13 && activeWaste.val === 1) || (card.val === 1 && activeWaste.val === 13);

    if (isAdjacent) {
      playSound('point');
      card.cleared = true;
      setActiveWaste(card);
      const newScore = score + 100;
      setScore(newScore);
      if (onScoreUpdate) onScoreUpdate(newScore);

      // Check win
      if (tableCards.every(c => c.cleared)) {
        setIsWon(true);
        playSound('win');
        confetti({ particleCount: 80, spread: 70 });
      }
    } else {
      playSound('hit');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Match cards ±1 rank of the draw pile</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
          </div>
          <button
            onClick={initGame}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Deal Again"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Felt Card Table */}
      <div className="relative w-full aspect-square max-w-[340px] bg-[#0f5132] border-4 border-[#3e2723] rounded-2xl p-3 shadow-2xl flex flex-col justify-between">
        {/* Table Cards Grid (3 rows of 4) */}
        <div className="grid grid-cols-4 gap-2 flex-1 items-center">
          {tableCards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={card.cleared}
              className={`h-16 rounded-lg font-bold flex flex-col items-center justify-center shadow-md transition-all ${
                card.cleared
                  ? 'opacity-0 pointer-events-none'
                  : 'bg-white hover:scale-105 active:scale-95 border border-neutral-300'
              } ${card.color === 'red' ? 'text-red-600' : 'text-neutral-900'}`}
            >
              <span className="text-sm font-heading leading-none">{rankLabel(card.val)}</span>
              <span className="text-lg leading-none">{card.suit}</span>
            </button>
          ))}
        </div>

        {/* Bottom Draw & Waste Deck */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#14532d]">
          {/* Draw Stock */}
          <button
            onClick={drawStock}
            disabled={stockCards.length === 0}
            className="relative w-12 h-16 rounded-lg bg-blue-900 border-2 border-white/60 flex items-center justify-center text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 disabled:opacity-30"
          >
            <Crown className="w-5 h-5 text-amber-300" />
            <span className="absolute -bottom-1 text-[9px] font-mono text-neutral-300">
              {stockCards.length}
            </span>
          </button>

          {/* Active Waste */}
          {activeWaste && (
            <div
              className={`w-12 h-16 rounded-lg bg-white border-2 border-indigo-400 flex flex-col items-center justify-center shadow-lg animate-in zoom-in-75 ${
                activeWaste.color === 'red' ? 'text-red-600' : 'text-neutral-900'
              }`}
            >
              <span className="text-sm font-heading font-bold leading-none">{rankLabel(activeWaste.val)}</span>
              <span className="text-lg leading-none">{activeWaste.suit}</span>
            </div>
          )}
        </div>

        {isWon && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <Sparkles className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">TABLE CLEARED!</h3>
            <p className="text-xs text-neutral-300 mb-4">Total Score: {score}</p>
            <button
              onClick={initGame}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              Play Another Hand
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-2 text-center text-[11px] text-neutral-400">
        Tap deck to draw · Tap table card 1 higher or lower to clear
      </div>
    </div>
  );
};
