import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, Sparkles, Heart, Trophy } from 'lucide-react';

interface CardItem {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameMemoryCardProps {
  title?: string;
  category?: string;
  onScoreUpdate?: (score: number) => void;
}

// Diverse thematic symbol packs
const THEME_ICONS: Record<string, string[]> = {
  animals: ['🐼', '🦁', '🐯', '🦄', '🐱', '🐶', '🦊', '🐰'],
  cooking: ['🍕', '🍔', '🍣', '🍰', '🍩', '🥑', '🌮', '🍦'],
  sports: ['⚽', '🏀', '🏈', '🎾', '🎳', '🥊', '⛳', '🎯'],
  action: ['⚔️', '🛡️', '👑', '💎', '🐉', '🧙', '🏹', '🔮'],
  space: ['🚀', '🛸', '🪐', '👾', '⚡', '🌌', '🤖', '🛰️'],
  default: ['🚀', '🎮', '💎', '🔥', '⚡', '🏆', '⭐', '👾'],
};

export const GameMemoryCard: React.FC<GameMemoryCardProps> = ({
  title = 'Memory Match',
  category = 'Puzzle',
  onScoreUpdate,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const initGame = useCallback(() => {
    const titleKey = title.toLowerCase();
    const catKey = category.toLowerCase();

    let iconPool = THEME_ICONS.default;
    if (catKey === 'cooking' || titleKey.includes('cook') || titleKey.includes('food') || titleKey.includes('fruit')) {
      iconPool = THEME_ICONS.cooking;
    } else if (catKey === 'sports' || titleKey.includes('ball') || titleKey.includes('soccer')) {
      iconPool = THEME_ICONS.sports;
    } else if (catKey === 'action' || titleKey.includes('hero') || titleKey.includes('ninja') || titleKey.includes('magic')) {
      iconPool = THEME_ICONS.action;
    } else if (titleKey.includes('cat') || titleKey.includes('dog') || titleKey.includes('panda') || titleKey.includes('pet') || titleKey.includes('zoo')) {
      iconPool = THEME_ICONS.animals;
    } else if (titleKey.includes('space') || titleKey.includes('alien') || titleKey.includes('star')) {
      iconPool = THEME_ICONS.space;
    }

    // 8 pairs = 16 cards (4x4)
    const deckSymbols = [...iconPool, ...iconPool];
    // Shuffle
    for (let i = deckSymbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckSymbols[i], deckSymbols[j]] = [deckSymbols[j], deckSymbols[i]];
    }

    const deck: CardItem[] = deckSymbols.map((symbol, idx) => ({
      id: idx,
      symbol,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setIsLocked(false);
    setIsWon(false);
    playSound('slide');
  }, [category, title]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardClick = (idx: number) => {
    if (isLocked) return;
    if (cards[idx].isFlipped || cards[idx].isMatched) return;

    playSound('click');
    const newFlipped = [...flippedIndices, idx];
    const updatedCards = cards.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c));
    setCards(updatedCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsLocked(true);

      const [firstIdx, secondIdx] = newFlipped;
      if (updatedCards[firstIdx].symbol === updatedCards[secondIdx].symbol) {
        // MATCH!
        playSound('point');
        setTimeout(() => {
          setCards(prev =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIndices([]);
          setIsLocked(false);
          const nextMatches = matches + 1;
          setMatches(nextMatches);

          if (onScoreUpdate) onScoreUpdate(nextMatches * 150);

          if (nextMatches === 8) {
            setIsWon(true);
            playSound('win');
            confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
          }
        }, 400);
      } else {
        // NO MATCH
        setTimeout(() => {
          setCards(prev =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center p-3 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-3 px-1">
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
            {title}
          </span>
          <span className="text-sm font-extrabold text-white font-heading">
            Matches: {matches} / 8
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">
            Moves: {moves}
          </div>
          <button
            onClick={initGame}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            title="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4x4 Cards Grid */}
      <div className="w-full max-w-sm aspect-square bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2.5 grid grid-cols-4 gap-2 shadow-2xl">
        {cards.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => handleCardClick(idx)}
            className={`w-full h-full rounded-xl flex items-center justify-center text-2xl transition-all duration-300 perspective-1000 ${
              c.isMatched
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-white scale-95 opacity-80'
                : c.isFlipped
                ? 'bg-indigo-600 border border-indigo-400 text-white scale-100 shadow-lg'
                : 'bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-transparent active:scale-95'
            }`}
          >
            {c.isFlipped || c.isMatched ? (
              <span className="transform animate-in zoom-in-50">{c.symbol}</span>
            ) : (
              <Sparkles className="w-4 h-4 text-neutral-600" />
            )}
          </button>
        ))}
      </div>

      {/* Win Banner */}
      {isWon && (
        <div className="w-full max-w-sm mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/50 text-center animate-in zoom-in-95">
          <span className="text-xs font-bold text-indigo-300 block">All Pairs Matched!</span>
          <span className="text-xs text-neutral-300">Completed in {moves} moves</span>
        </div>
      )}
    </div>
  );
};
