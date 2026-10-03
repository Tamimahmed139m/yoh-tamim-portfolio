import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { StorageService } from '../services/storageService';
import { playSound } from '../utils/audio';
import { Trophy, Send, Award, Medal } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface LeaderboardWidgetProps {
  gameId: string;
  gameTitle: string;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  gameId,
  gameTitle,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    StorageService.getLeaderboard(gameId)
  );
  const [playerName, setPlayerName] = useState('');
  const [playerScore, setPlayerScore] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail === gameId) {
        setEntries(StorageService.getLeaderboard(gameId));
      }
    };
    window.addEventListener('leaderboard-updated', handleUpdate);
    return () => window.removeEventListener('leaderboard-updated', handleUpdate);
  }, [gameId]);

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = parseInt(playerScore, 10);
    if (!scoreVal || scoreVal <= 0) return;

    playSound('win');
    StorageService.submitScore(gameId, playerName.trim() || 'Player', scoreVal);
    setPlayerScore('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-heading tracking-tight">
            Leaderboard Ranks
          </h3>
        </div>
        <span className="text-[11px] text-neutral-400 font-mono">High Scores</span>
      </div>

      {/* Ranks List */}
      <div className="space-y-2">
        {entries.slice(0, 5).map(entry => (
          <div
            key={`${entry.rank}-${entry.playerName}`}
            className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-5 h-5 rounded-md font-mono font-bold flex items-center justify-center text-[10px] ${
                  entry.rank === 1
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : entry.rank === 2
                    ? 'bg-slate-700/40 text-slate-300'
                    : entry.rank === 3
                    ? 'bg-amber-900/30 text-amber-600'
                    : 'text-neutral-500'
                }`}
              >
                {entry.rank}
              </span>
              <span className="text-sm">{entry.avatar}</span>
              <span className="font-semibold text-neutral-200 truncate max-w-[110px]">
                {entry.playerName}
              </span>
            </div>
            <span className="font-mono font-bold text-white tabular-nums">
              {formatNumber(entry.score)}
            </span>
          </div>
        ))}
      </div>

      {/* Submit Score Form */}
      <form onSubmit={handleSubmitScore} className="pt-2 border-t border-neutral-800 space-y-2">
        <span className="text-[11px] font-semibold text-neutral-300 block">Post Your Record</span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Your Alias"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            placeholder="Score"
            required
            value={playerScore}
            onChange={e => setPlayerScore(e.target.value)}
            className="w-20 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
        {submitted && (
          <p className="text-[11px] text-emerald-400 font-medium">Record registered on leaderboard!</p>
        )}
      </form>
    </div>
  );
};
