import { Achievement } from '../types/game';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/audio';

const ACHIEVEMENTS_KEY = 'nova_arcade_achievements_v1';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-game',
    title: 'First Step',
    description: 'Launch and play your first online game on NovaArcade.',
    icon: '🎮',
    tier: 'bronze',
  },
  {
    id: 'five-games',
    title: 'Arcade Veteran',
    description: 'Play 5 different browser games in your library.',
    icon: '⭐',
    tier: 'silver',
  },
  {
    id: 'fav-collector',
    title: 'Collector',
    description: 'Bookmark at least 3 games to your personal Favorites.',
    icon: '❤️',
    tier: 'silver',
  },
  {
    id: 'threed-adventurer',
    title: '3D Dimension',
    description: 'Experience genuine 3D WebGL gameplay in Slope or Bowling.',
    icon: '🌌',
    tier: 'gold',
  },
  {
    id: 'high-scorer',
    title: 'Century Marksman',
    description: 'Earn a high score of 500 or more in any challenge.',
    icon: '🏆',
    tier: 'gold',
  },
  {
    id: 'custom-creator',
    title: 'Portal Architect',
    description: 'Design a custom thumbnail or upload a game package.',
    icon: '🎨',
    tier: 'diamond',
  },
];

export const AchievementService = {
  getUnlocked(): Record<string, number> {
    try {
      const data = localStorage.getItem(ACHIEVEMENTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  isUnlocked(id: string): boolean {
    return Boolean(this.getUnlocked()[id]);
  },

  unlock(id: string): void {
    const current = this.getUnlocked();
    if (current[id]) return;

    current[id] = Date.now();
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(current));
    } catch {}

    const ach = ALL_ACHIEVEMENTS.find(a => a.id === id);
    if (ach) {
      playSound('win');
      confetti({ particleCount: 60, spread: 60 });
      window.dispatchEvent(
        new CustomEvent('achievement-unlocked', { detail: { ...ach, unlockedAt: current[id] } })
      );
    }
  },

  getAll(): Achievement[] {
    const unlocked = this.getUnlocked();
    return ALL_ACHIEVEMENTS.map(a => ({
      ...a,
      unlockedAt: unlocked[a.id],
    }));
  },
};
