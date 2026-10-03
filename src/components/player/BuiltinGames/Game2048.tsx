import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Award } from 'lucide-react';

type Board = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: 'bg-neutral-800 text-neutral-100', text: 'text-neutral-100' },
  4: { bg: 'bg-neutral-700 text-neutral-100', text: 'text-neutral-100' },
  8: { bg: 'bg-amber-700 text-amber-50', text: 'text-amber-50' },
  16: { bg: 'bg-orange-600 text-white', text: 'text-white' },
  32: { bg: 'bg-orange-500 text-white', text: 'text-white' },
  64: { bg: 'bg-red-500 text-white', text: 'text-white' },
  128: { bg: 'bg-yellow-500 text-neutral-900', text: 'text-neutral-900' },
  256: { bg: 'bg-yellow-400 text-neutral-900', text: 'text-neutral-900' },
  512: { bg: 'bg-emerald-500 text-white', text: 'text-white' },
  1024: { bg: 'bg-teal-500 text-white', text: 'text-white' },
  2048: { bg: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50', text: 'text-white' },
};

interface Game2048Props {
  title?: string;
  onScoreUpdate?: (score: number) => void;
}

export const Game2048: React.FC<Game2048Props> = ({ title = '2048 Puzzle', onScoreUpdate }) => {
  const [board, setBoard] = useState<Board>(() => getInitialBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game2048_best') || 0);
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  function getInitialBoard(): Board {
    const empty = Array(4).fill(0).map(() => Array(4).fill(0));
    addRandom(empty);
    addRandom(empty);
    return empty;
  }

  function addRandom(b: Board): boolean {
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) emptyCells.push([r, c]);
      }
    }
    if (emptyCells.length === 0) return false;
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    b[row][col] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  const resetGame = useCallback(() => {
    const fresh = getInitialBoard();
    setBoard(fresh);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
    playSound('slide');
  }, []);

  const slideRow = (row: number[]): { newRow: number[]; gained: number } => {
    const filtered = row.filter(val => val !== 0);
    const newRow: number[] = [];
    let gained = 0;
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        newRow.push(mergedVal);
        gained += mergedVal;
        i += 2;
      } else {
        newRow.push(filtered[i]);
        i += 1;
      }
    }
    while (newRow.length < 4) {
      newRow.push(0);
    }
    return { newRow, gained };
  };

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;

    let pointsGained = 0;
    const newBoard = board.map(row => [...row]);
    let moved = false;

    if (direction === 'left') {
      for (let r = 0; r < 4; r++) {
        const { newRow, gained } = slideRow(newBoard[r]);
        if (JSON.stringify(newBoard[r]) !== JSON.stringify(newRow)) moved = true;
        newBoard[r] = newRow;
        pointsGained += gained;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < 4; r++) {
        const reversed = [...newBoard[r]].reverse();
        const { newRow, gained } = slideRow(reversed);
        const unreversed = newRow.reverse();
        if (JSON.stringify(newBoard[r]) !== JSON.stringify(unreversed)) moved = true;
        newBoard[r] = unreversed;
        pointsGained += gained;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < 4; c++) {
        const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
        const { newRow, gained } = slideRow(col);
        for (let r = 0; r < 4; r++) {
          if (newBoard[r][c] !== newRow[r]) moved = true;
          newBoard[r][c] = newRow[r];
        }
        pointsGained += gained;
      }
    } else if (direction === 'down') {
      for (let c = 0; c < 4; c++) {
        const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
        const { newRow, gained } = slideRow(col);
        for (let r = 0; r < 4; r++) {
          if (newBoard[3 - r][c] !== newRow[r]) moved = true;
          newBoard[3 - r][c] = newRow[r];
        }
        pointsGained += gained;
      }
    }

    if (moved) {
      playSound('slide');
      addRandom(newBoard);
      setBoard(newBoard);
      const newScore = score + pointsGained;
      setScore(newScore);
      if (onScoreUpdate) onScoreUpdate(newScore);

      if (newScore > bestScore) {
        setBestScore(newScore);
        try {
          localStorage.setItem('game2048_best', String(newScore));
        } catch {}
      }

      if (pointsGained > 0) {
        playSound('point');
      }

      // Check win condition
      if (!hasWon) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (newBoard[r][c] === 2048) {
              setHasWon(true);
              playSound('win');
              confetti({ particleCount: 75, spread: 60 });
            }
          }
        }
      }

      // Check game over
      let canMove = false;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (newBoard[r][c] === 0) canMove = true;
          if (r < 3 && newBoard[r][c] === newBoard[r + 1][c]) canMove = true;
          if (c < 3 && newBoard[r][c] === newBoard[r][c + 1]) canMove = true;
        }
      }
      if (!canMove) {
        setGameOver(true);
        playSound('lose');
      }
    }
  }, [board, gameOver, hasWon, score, bestScore, onScoreUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') move('up');
        if (e.key === 'ArrowDown') move('down');
        if (e.key === 'ArrowLeft') move('left');
        if (e.key === 'ArrowRight') move('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto text-neutral-100 select-none">
      {/* Game Header Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Join matching tiles to reach high scores!</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-semibold">Score</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-semibold">Best</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">{bestScore}</span>
          </div>
          <button
            onClick={resetGame}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700"
            title="Restart Game"
            aria-label="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Board Container */}
      <div
        ref={boardRef}
        className="relative bg-neutral-900/90 border border-neutral-800 p-3 rounded-2xl aspect-square w-full max-w-[340px] shadow-2xl"
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 h-full w-full">
          {board.map((row, r) =>
            row.map((val, c) => {
              const tileStyle = val > 0 ? (TILE_COLORS[val] || { bg: 'bg-violet-600 text-white', text: 'text-white' }) : null;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`rounded-xl flex items-center justify-center font-bold transition-all duration-100 ${
                    val === 0
                      ? 'bg-neutral-950/60 border border-neutral-800/40'
                      : `${tileStyle?.bg} font-heading shadow-md transform scale-100`
                  } ${val >= 1000 ? 'text-lg' : val >= 100 ? 'text-xl' : 'text-2xl'}`}
                >
                  {val !== 0 && <span className="tabular-nums">{val}</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Win / Game Over Overlay */}
        {(gameOver || hasWon) && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            {hasWon && !gameOver ? (
              <>
                <Award className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-1">You reached 2048!</h3>
                <p className="text-xs text-neutral-300 mb-4">Legendary performance! Keep going or restart.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasWon(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
                  >
                    Keep Going
                  </button>
                  <button
                    onClick={resetGame}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    New Game
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white mb-1">Game Over</h3>
                <p className="text-xs text-neutral-400 mb-4">No more moves possible. Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-transform active:scale-95"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* On-screen Directional Controls for Mobile / Touch */}
      <div className="mt-4 flex flex-col items-center gap-1.5 md:hidden">
        <button
          onClick={() => move('up')}
          className="p-3 bg-neutral-800/80 active:bg-neutral-700 rounded-xl border border-neutral-700/60 text-white"
          aria-label="Move Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => move('left')}
            className="p-3 bg-neutral-800/80 active:bg-neutral-700 rounded-xl border border-neutral-700/60 text-white"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => move('down')}
            className="p-3 bg-neutral-800/80 active:bg-neutral-700 rounded-xl border border-neutral-700/60 text-white"
            aria-label="Move Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => move('right')}
            className="p-3 bg-neutral-800/80 active:bg-neutral-700 rounded-xl border border-neutral-700/60 text-white"
            aria-label="Move Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
