import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Lightbulb, RotateCcw, CheckCircle2 } from 'lucide-react';

interface WordItem {
  word: string;
  found: boolean;
  cells: [number, number][]; // row, col
}

interface GameWordSearchProps {
  title?: string;
  category?: string;
  onScoreUpdate?: (score: number) => void;
}

// Thematic dictionaries for games
const THEME_DICTIONARIES: Record<string, string[]> = {
  cooking: ['RECIPE', 'CHEF', 'SPICE', 'GRILL', 'TASTE', 'BAKE'],
  sports: ['HOOP', 'SCORE', 'MATCH', 'CHAMP', 'COACH', 'ARENA'],
  action: ['BLADE', 'STRIKE', 'SNIPER', 'ARMOR', 'HERO', 'STEEL'],
  racing: ['DRIFT', 'TURBO', 'SPEED', 'MOTOR', 'TRACK', 'BOOST'],
  animals: ['PANDA', 'TIGER', 'KOALA', 'EAGLE', 'SHARK', 'ZEBRA'],
  puzzle: ['SOLVE', 'LOGIC', 'MATCH', 'BRAIN', 'SHAPE', 'CUBE'],
  word: ['LETTER', 'SPELL', 'ALPHA', 'VOCAB', 'SOLVE', 'WORDS'],
};

export const GameWordSearch: React.FC<GameWordSearchProps> = ({
  title = 'Word Puzzle',
  category = 'Puzzle',
  onScoreUpdate,
}) => {
  const GRID_SIZE = 8;
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [hintMessage, setHintMessage] = useState<string>('');
  const [hintsLeft, setHintsLeft] = useState(3);
  const [score, setScore] = useState(0);

  const initGame = useCallback(() => {
    // Determine words based on category and title
    const catKey = category.toLowerCase();
    const titleKey = title.toLowerCase();

    let pool: string[] = ['GAME', 'PLAY', 'NOVA', 'HERO', 'RACE', 'QUEST'];
    if (THEME_DICTIONARIES[catKey]) {
      pool = THEME_DICTIONARIES[catKey];
    } else if (titleKey.includes('cook') || titleKey.includes('food') || titleKey.includes('kebab')) {
      pool = THEME_DICTIONARIES.cooking;
    } else if (titleKey.includes('ball') || titleKey.includes('dunk') || titleKey.includes('soccer')) {
      pool = THEME_DICTIONARIES.sports;
    } else if (titleKey.includes('sniper') || titleKey.includes('alien') || titleKey.includes('fight')) {
      pool = THEME_DICTIONARIES.action;
    } else if (titleKey.includes('cat') || titleKey.includes('dog') || titleKey.includes('panda')) {
      pool = THEME_DICTIONARIES.animals;
    }

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newGrid: string[][] = Array(GRID_SIZE).fill('').map(() =>
      Array(GRID_SIZE).fill('').map(() => letters[Math.floor(Math.random() * letters.length)])
    );

    const placedWords: WordItem[] = [];

    // Word 1: pool[0] (horizontal row 1)
    const w1 = pool[0];
    const w1Cells: [number, number][] = [];
    const r1 = 1;
    const cStart1 = Math.max(0, Math.min(GRID_SIZE - w1.length, 1));
    for (let c = 0; c < w1.length; c++) {
      newGrid[r1][cStart1 + c] = w1[c];
      w1Cells.push([r1, cStart1 + c]);
    }
    placedWords.push({ word: w1, found: false, cells: w1Cells });

    // Word 2: pool[1] (vertical col 1)
    const w2 = pool[1];
    const w2Cells: [number, number][] = [];
    const col2 = 6;
    const rStart2 = Math.max(0, Math.min(GRID_SIZE - w2.length, 2));
    for (let r = 0; r < w2.length; r++) {
      newGrid[rStart2 + r][col2] = w2[r];
      w2Cells.push([rStart2 + r, col2]);
    }
    placedWords.push({ word: w2, found: false, cells: w2Cells });

    // Word 3: pool[2] (horizontal row 5)
    const w3 = pool[2];
    const w3Cells: [number, number][] = [];
    const r3 = 5;
    const cStart3 = Math.max(0, Math.min(GRID_SIZE - w3.length, 2));
    for (let c = 0; c < w3.length; c++) {
      newGrid[r3][cStart3 + c] = w3[c];
      w3Cells.push([r3, cStart3 + c]);
    }
    placedWords.push({ word: w3, found: false, cells: w3Cells });

    // Word 4: pool[3] (vertical col 2)
    const w4 = pool[3];
    const w4Cells: [number, number][] = [];
    const col4 = 1;
    const rStart4 = Math.max(0, Math.min(GRID_SIZE - w4.length, 3));
    for (let r = 0; r < w4.length; r++) {
      newGrid[rStart4 + r][col4] = w4[r];
      w4Cells.push([rStart4 + r, col4]);
    }
    placedWords.push({ word: w4, found: false, cells: w4Cells });

    setGrid(newGrid);
    setWords(placedWords);
    setSelectedCells([]);
    setHintMessage('');
    setHintsLeft(3);
    setScore(0);
  }, [category, title]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCellClick = (r: number, c: number) => {
    playSound('click');
    const isAlreadySelected = selectedCells.some(([sr, sc]) => sr === r && sc === c);
    let nextCells: [number, number][];

    if (isAlreadySelected) {
      nextCells = selectedCells.filter(([sr, sc]) => !(sr === r && sc === c));
    } else {
      nextCells = [...selectedCells, [r, c]];
    }

    setSelectedCells(nextCells);

    // Form word from selected cells
    const currentWord = nextCells.map(([cr, cc]) => grid[cr]?.[cc] || '').join('');
    const reversedWord = currentWord.split('').reverse().join('');

    // Check if matches any unfound word
    const matchedWord = words.find(
      w => !w.found && (w.word === currentWord || w.word === reversedWord)
    );

    if (matchedWord) {
      playSound('win');
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });

      const updatedWords = words.map(w =>
        w.word === matchedWord.word ? { ...w, found: true } : w
      );
      setWords(updatedWords);
      setSelectedCells([]);

      const newScore = score + 100 * matchedWord.word.length;
      setScore(newScore);
      if (onScoreUpdate) onScoreUpdate(newScore);

      // Check all won
      if (updatedWords.every(w => w.found)) {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
        playSound('win');
      }
    }
  };

  const useHint = () => {
    if (hintsLeft <= 0) return;
    playSound('point');
    const unfound = words.find(w => !w.found);
    if (!unfound) return;

    setHintsLeft(h => h - 1);
    setHintMessage(`Look for "${unfound.word}"! Starts at row ${unfound.cells[0][0] + 1}, column ${unfound.cells[0][1] + 1}.`);
    setTimeout(() => setHintMessage(''), 4000);
  };

  const isCellInWord = (r: number, c: number) => {
    return words.some(w => w.found && w.cells.some(([wr, wc]) => wr === r && wc === c));
  };

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(([sr, sc]) => sr === r && sc === c);
  };

  const allFound = words.length > 0 && words.every(w => w.found);

  return (
    <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center p-3 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-3 px-1">
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
            {title}
          </span>
          <span className="text-sm font-extrabold text-white font-heading">
            {words.filter(w => w.found).length} / {words.length} Words
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={useHint}
            disabled={hintsLeft <= 0 || allFound}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hintsLeft > 0 && !allFound
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-neutral-900 border-neutral-800 text-neutral-600'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Hint ({hintsLeft})</span>
          </button>

          <button
            onClick={initGame}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            title="Reset Puzzle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hintMessage && (
        <div className="w-full max-w-sm mb-2 p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs text-center font-mono">
          {hintMessage}
        </div>
      )}

      {/* Target Word Badges */}
      <div className="w-full max-w-sm flex flex-wrap gap-1.5 mb-3 justify-center">
        {words.map(w => (
          <div
            key={w.word}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-1 ${
              w.found
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 line-through opacity-75'
                : 'bg-neutral-900 text-neutral-200 border border-neutral-800'
            }`}
          >
            {w.found && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            <span>{w.word}</span>
          </div>
        ))}
      </div>

      {/* 8x8 Grid */}
      <div className="w-full max-w-sm aspect-square bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2 grid grid-cols-8 gap-1 shadow-2xl">
        {grid.map((row, r) =>
          row.map((letter, c) => {
            const found = isCellInWord(r, c);
            const selected = isCellSelected(r, c);

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`w-full h-full rounded-lg font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition-all ${
                  found
                    ? 'bg-emerald-500 text-neutral-950 shadow-md font-extrabold scale-95'
                    : selected
                    ? 'bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-400 scale-105'
                    : 'bg-neutral-950/70 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800/80 active:scale-95'
                }`}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      {/* Victory Banner */}
      {allFound && (
        <div className="w-full max-w-sm mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/50 text-center animate-in zoom-in-95">
          <span className="text-xs font-bold text-emerald-300 block">Puzzle Solved!</span>
          <span className="text-xs text-neutral-300">Final Score: {score} pts</span>
        </div>
      )}
    </div>
  );
};
