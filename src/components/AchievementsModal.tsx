import React from 'react';
import { AchievementService } from '../services/achievementService';
import { Trophy, X, Check, Lock, Sparkles } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const achievements = AchievementService.getAll();
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Player Achievements
              </h3>
              <p className="text-xs text-neutral-400">
                Unlock badges and milestones by playing games
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="px-6 py-3.5 bg-neutral-950/50 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-neutral-300">Progress</span>
              <span className="font-mono text-amber-400">{unlockedCount}/{achievements.length} Unlocked</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Achievement List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {achievements.map(ach => {
            const isUnlocked = Boolean(ach.unlockedAt);
            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                  isUnlocked
                    ? 'bg-neutral-850/80 border-amber-500/40 shadow-sm'
                    : 'bg-neutral-950/40 border-neutral-800/80 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    isUnlocked ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-neutral-800/60'
                  }`}
                >
                  {ach.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate font-heading">
                      {ach.title}
                    </h4>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded font-mono ${
                        ach.tier === 'diamond'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          : ach.tier === 'gold'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : ach.tier === 'silver'
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-orange-950 text-orange-300'
                      }`}
                    >
                      {ach.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    {ach.description}
                  </p>
                </div>

                <div className="shrink-0">
                  {isUnlocked ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
