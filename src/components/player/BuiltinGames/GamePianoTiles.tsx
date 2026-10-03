import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Music } from 'lucide-react';

interface PianoTile {
  id: number;
  lane: number; // 0, 1, 2, 3
  y: number;
  hit: boolean;
}

export const GamePianoTiles: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Perfect Piano',
  onScoreUpdate,
}) => {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('game_piano_high') || 0);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    tiles: [] as PianoTile[],
    speed: 3.5,
    score: 0,
    nextId: 1,
    lastSpawnY: 0,
  });

  const startGame = useCallback(() => {
    const initialTiles: PianoTile[] = [];
    for (let i = 0; i < 5; i++) {
      initialTiles.push({
        id: i + 1,
        lane: Math.floor(Math.random() * 4),
        y: -i * 80,
        hit: false,
      });
    }

    stateRef.current = {
      tiles: initialTiles,
      speed: 3.8,
      score: 0,
      nextId: 6,
      lastSpawnY: -4 * 80,
    };
    setScore(0);
    setGameState('PLAYING');
    playSound('slide');
  }, []);

  const tapLane = (laneIndex: number) => {
    if (gameState !== 'PLAYING') return;
    const s = stateRef.current;

    // Find lowest unhit tile in the lane
    const target = s.tiles
      .filter(t => !t.hit && t.lane === laneIndex)
      .sort((a, b) => b.y - a.y)[0];

    // Must be in hitting zone (y between 180 and 320)
    if (target && target.y >= 160 && target.y <= 310) {
      target.hit = true;
      playSound('point');
      s.score += 10;
      setScore(s.score);
      if (onScoreUpdate) onScoreUpdate(s.score);
      s.speed = Math.min(8, 3.8 + s.score * 0.02);
    } else {
      // Missed tap or wrong lane
      playSound('hit');
    }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;

    const loop = () => {
      const s = stateRef.current;

      // Move tiles downwards
      for (let i = s.tiles.length - 1; i >= 0; i--) {
        const t = s.tiles[i];
        t.y += s.speed;

        // Missed tile fell past bottom of screen
        if (!t.hit && t.y > 330) {
          playSound('lose');
          if (s.score > highScore) {
            setHighScore(s.score);
            try {
              localStorage.setItem('game_piano_high', String(s.score));
            } catch {}
          }
          setGameState('GAMEOVER');
          return;
        }

        // Remove off-screen
        if (t.y > 380) {
          s.tiles.splice(i, 1);
        }
      }

      // Spawn next tile as lowest moves down
      const topTile = s.tiles[s.tiles.length - 1];
      if (topTile && topTile.y > -40) {
        s.tiles.push({
          id: s.nextId++,
          lane: Math.floor(Math.random() * 4),
          y: topTile.y - 85,
          hit: false,
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, highScore, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Tap falling piano keys in rhythm</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-center">
            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Notes</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">{score / 10}</span>
          </div>
          <button
            onClick={startGame}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Piano Lanes */}
      <div className="relative w-full aspect-square max-w-[340px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
        <div className="grid grid-cols-4 w-full h-full divide-x divide-neutral-800">
          {[0, 1, 2, 3].map(laneIdx => (
            <button
              key={laneIdx}
              onClick={() => tapLane(laneIdx)}
              className="relative h-full w-full bg-neutral-900/40 hover:bg-neutral-800/40 active:bg-neutral-750/60 transition-colors focus:outline-none"
            >
              {/* Target Hit line */}
              <div className="absolute bottom-12 inset-x-0 h-1 bg-indigo-500/40" />

              {/* Falling tiles in this lane */}
              {stateRef.current.tiles
                .filter(t => t.lane === laneIdx)
                .map(t => (
                  <div
                    key={t.id}
                    style={{ top: `${t.y}px` }}
                    className={`absolute inset-x-1.5 h-20 rounded-xl shadow-lg transition-transform ${
                      t.hit
                        ? 'bg-neutral-800/50 opacity-30 scale-95'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/40'
                    }`}
                  />
                ))}
            </button>
          ))}
        </div>

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center cursor-default z-20">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <Music className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">{title.toUpperCase()}</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[220px]">
              Tap the black piano keys before they reach the bottom line. Don't miss a single note!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Start Playing
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20 cursor-default">
            <h3 className="text-2xl font-bold text-white mb-1 font-heading">MISSED NOTE!</h3>
            <p className="text-xs text-neutral-400 mb-4">Notes Hit: {score / 10}</p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-2 text-center text-xs text-neutral-400 font-medium">
        TAP THE 4 LANES AS TILES REACH THE BOTTOM
      </div>
    </div>
  );
};
