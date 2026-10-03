import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Car, CheckCircle2 } from 'lucide-react';

interface CarItem {
  id: number;
  row: number;
  col: number;
  length: number; // 2 or 3
  dir: 'H' | 'V'; // Horizontal or Vertical
  color: string;
  cleared: boolean;
}

const CAR_PALETTE = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const GameParkingJam: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Parking Jam',
  onScoreUpdate,
}) => {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initLevel = useCallback(() => {
    // 6x6 Parking Lot grid
    const layout: CarItem[] = [
      { id: 1, row: 1, col: 0, length: 2, dir: 'H', color: CAR_PALETTE[0], cleared: false },
      { id: 2, row: 2, col: 1, length: 2, dir: 'V', color: CAR_PALETTE[1], cleared: false },
      { id: 3, row: 4, col: 0, length: 2, dir: 'H', color: CAR_PALETTE[2], cleared: false },
      { id: 4, row: 0, col: 3, length: 3, dir: 'V', color: CAR_PALETTE[3], cleared: false },
      { id: 5, row: 3, col: 2, length: 2, dir: 'H', color: CAR_PALETTE[4], cleared: false },
      { id: 6, row: 4, col: 4, length: 2, dir: 'V', color: CAR_PALETTE[5], cleared: false },
    ];
    setCars(layout);
    setMoves(0);
    setIsWon(false);
    playSound('slide');
  }, []);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  const tapCar = (carId: number) => {
    if (isWon) return;
    const target = cars.find(c => c.id === carId);
    if (!target || target.cleared) return;

    // Check if path to escape is blocked by another un-cleared car
    const isBlocked = cars.some(other => {
      if (other.id === carId || other.cleared) return false;

      if (target.dir === 'H') {
        // Escaping towards the right (col > target.col + length - 1)
        if (other.dir === 'V') {
          return other.col >= target.col + target.length && other.row <= target.row && other.row + other.length > target.row;
        }
        return other.row === target.row && other.col > target.col;
      } else {
        // Escaping downwards (row > target.row + length - 1)
        if (other.dir === 'H') {
          return other.row >= target.row + target.length && other.col <= target.col && other.col + other.length > target.col;
        }
        return other.col === target.col && other.row > target.row;
      }
    });

    if (isBlocked) {
      playSound('hit'); // Blocked honk
    } else {
      playSound('whoosh'); // Zoom away!
      const newCars = cars.map(c => (c.id === carId ? { ...c, cleared: true } : c));
      setCars(newCars);
      setMoves(m => m + 1);

      if (newCars.every(c => c.cleared)) {
        setIsWon(true);
        playSound('win');
        confetti({ particleCount: 70, spread: 60 });
        if (onScoreUpdate) onScoreUpdate(400);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Tap cars with clear exits to unjam the lot</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Moves</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{moves}</span>
          </div>
          <button
            onClick={initLevel}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Reset Grid"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6x6 Parking Lot Grid */}
      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-900 border-4 border-dashed border-amber-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-center overflow-hidden">
        {/* Lot floor markings */}
        <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="bg-neutral-950/60 rounded border border-neutral-800/40" />
          ))}
        </div>

        {/* Cars Overlay */}
        <div className="absolute inset-2.5">
          {cars.map(car => {
            if (car.cleared) return null;
            const cellSize = 51.5;
            const width = car.dir === 'H' ? car.length * cellSize - 4 : cellSize - 4;
            const height = car.dir === 'V' ? car.length * cellSize - 4 : cellSize - 4;
            const top = car.row * cellSize + 2;
            const left = car.col * cellSize + 2;

            return (
              <button
                key={car.id}
                onClick={() => tapCar(car.id)}
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  top: `${top}px`,
                  left: `${left}px`,
                  backgroundColor: car.color,
                }}
                className="absolute rounded-xl shadow-lg border border-white/20 flex items-center justify-center font-bold text-white transition-transform active:scale-95 cursor-pointer"
              >
                <Car className="w-4 h-4 opacity-80" />
              </button>
            );
          })}
        </div>

        {isWon && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">PARKING UNJAMMED!</h3>
            <p className="text-xs text-neutral-300 mb-4">All cars escaped in {moves} moves!</p>
            <button
              onClick={initLevel}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-2 text-center text-xs text-neutral-400 font-medium">
        TAP CAR TO DRIVE FORWARD IF PATH IS CLEAR
      </div>
    </div>
  );
};
