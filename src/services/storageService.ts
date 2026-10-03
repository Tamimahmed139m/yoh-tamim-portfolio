import { Game, GameReview, LeaderboardEntry } from '../types/game';
import { INITIAL_GAMES } from '../data/gamesCatalog';
import { AchievementService } from './achievementService';
import { supabase } from './supabaseClient';

const FAVORITES_KEY = 'nova_arcade_favorites_v1';
const RECENT_KEY = 'nova_arcade_recent_v1';
const RATINGS_KEY = 'nova_arcade_ratings_v1';
const CUSTOM_GAMES_KEY = 'nova_arcade_custom_games_v1';
const DELETED_IDS_KEY = 'nova_arcade_deleted_ids_v1';
const REVIEWS_KEY = 'nova_arcade_reviews_v1';
const LEADERBOARDS_KEY = 'nova_arcade_leaderboards_v1';
const THEME_KEY = 'nova_arcade_theme_v1';

export interface RecentPlay {
  gameId: string;
  timestamp: number;
}

const gameToRow = (game: Game) => ({
  id: game.id, title: game.title, slug: game.slug, category: game.category, categories: game.categories,
  thumbnail_url: game.thumbnailUrl, description: game.description, controls: game.controls, how_to_play: game.howToPlay,
  game_url: game.gameUrl, featured: game.featured, popular: game.popular, is_new: game.isNew, rating: game.rating,
  plays: game.plays, date_added: game.dateAdded, playable_type: game.playableType, custom_source_html: game.customSourceHtml, tags: game.tags,
});

const syncGameToCloud = (game: Game) => {
  if (!supabase) return;
  void supabase.from('games').upsert(gameToRow(game), { onConflict: 'id' }).then(({ error }) => {
    if (error) console.warn('Supabase game sync failed:', error.message);
  });
};

const deleteGameFromCloud = (gameId: string) => {
  if (!supabase) return;
  void supabase.from('games').delete().eq('id', gameId).then(({ error }) => {
    if (error) console.warn('Supabase game delete failed:', error.message);
  });
};

export const StorageService = {
  // Favorites
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavorite(gameId: string): boolean {
    return this.getFavorites().includes(gameId);
  },

  toggleFavorite(gameId: string): boolean {
    const list = this.getFavorites();
    const index = list.indexOf(gameId);
    let isNowFavorite = false;
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.unshift(gameId);
      isNowFavorite = true;
    }
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('favorites-updated'));
    } catch {}

    if (list.length >= 3) {
      AchievementService.unlock('fav-collector');
    }
    return isNowFavorite;
  },

  // Recently Played
  getRecentlyPlayed(): RecentPlay[] {
    try {
      const data = localStorage.getItem(RECENT_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRecentlyPlayed(gameId: string): void {
    const list = this.getRecentlyPlayed().filter(item => item.gameId !== gameId);
    list.unshift({ gameId, timestamp: Date.now() });
    const trimmed = list.slice(0, 30);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
      window.dispatchEvent(new Event('recently-played-updated'));
    } catch {}

    // Track Achievements
    AchievementService.unlock('first-game');
    if (trimmed.length >= 5) {
      AchievementService.unlock('five-games');
    }
    if (gameId.toLowerCase().includes('3d') || gameId.includes('slope') || gameId.includes('bowling')) {
      AchievementService.unlock('threed-adventurer');
    }
  },

  // Ratings
  getUserRatings(): Record<string, number> {
    try {
      const data = localStorage.getItem(RATINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setUserRating(gameId: string, rating: number): void {
    const ratings = this.getUserRatings();
    ratings[gameId] = rating;
    try {
      localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
    } catch {}
  },

  // Reviews
  getAllReviews(): Record<string, GameReview[]> {
    try {
      const data = localStorage.getItem(REVIEWS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  getGameReviews(gameId: string): GameReview[] {
    const all = this.getAllReviews();
    if (all[gameId] && all[gameId].length > 0) {
      return all[gameId];
    }
    // Default initial seeded reviews
    return [
      {
        id: `rev-seed-1-${gameId}`,
        gameId,
        author: 'Alex_Gamer99',
        avatarColor: '#6366f1',
        rating: 5,
        comment: 'Super smooth controls and very fun to play! One of my favorites.',
        date: '2 days ago',
        likes: 12,
      },
      {
        id: `rev-seed-2-${gameId}`,
        gameId,
        author: 'CyberKnight',
        avatarColor: '#06b6d4',
        rating: 5,
        comment: 'Runs great on mobile browser without any lags. Highly recommended!',
        date: '1 week ago',
        likes: 8,
      },
    ];
  },

  addGameReview(review: GameReview): void {
    const all = this.getAllReviews();
    const list = all[review.gameId] || this.getGameReviews(review.gameId);
    list.unshift(review);
    all[review.gameId] = list;
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('reviews-updated', { detail: review.gameId }));
    } catch {}
  },

  // High Scores & Leaderboard
  getLeaderboard(gameId: string): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(LEADERBOARDS_KEY);
      const all = data ? JSON.parse(data) : {};
      if (all[gameId] && all[gameId].length > 0) return all[gameId];
    } catch {}

    // Default seeded leaderboard
    return [
      { rank: 1, playerName: 'NeonVortex', score: 3850, date: 'Oct 02', avatar: '👑' },
      { rank: 2, playerName: 'ShadowBlade', score: 2940, date: 'Oct 01', avatar: '⚡' },
      { rank: 3, playerName: 'PixelMaster', score: 2180, date: 'Sep 29', avatar: '🎯' },
      { rank: 4, playerName: 'ArcadeQueen', score: 1850, date: 'Sep 28', avatar: '💎' },
      { rank: 5, playerName: 'NovaRider', score: 1420, date: 'Sep 27', avatar: '🚀' },
    ];
  },

  submitScore(gameId: string, playerName: string, score: number): void {
    try {
      const data = localStorage.getItem(LEADERBOARDS_KEY);
      const all = data ? JSON.parse(data) : {};
      const list: LeaderboardEntry[] = all[gameId] || this.getLeaderboard(gameId);

      list.push({
        rank: 0,
        playerName: playerName || 'Player',
        score,
        date: 'Today',
        avatar: '🎮',
      });

      // Sort descending and keep top 10
      list.sort((a, b) => b.score - a.score);
      const updated = list.slice(0, 10).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
      all[gameId] = updated;

      localStorage.setItem(LEADERBOARDS_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('leaderboard-updated', { detail: gameId }));
    } catch {}

    if (score >= 500) {
      AchievementService.unlock('high-scorer');
    }
  },

  // Custom games added by Admin / Package uploader
  getCustomGames(): Game[] {
    try {
      const data = localStorage.getItem(CUSTOM_GAMES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomGame(game: Game): void {
    const custom = this.getCustomGames();
    const existingIndex = custom.findIndex(g => g.id === game.id);
    if (existingIndex >= 0) {
      custom[existingIndex] = game;
    } else {
      custom.unshift(game);
    }
    try {
      localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(custom));
      window.dispatchEvent(new Event('catalog-updated'));
    } catch {}
    syncGameToCloud(game);
    AchievementService.unlock('custom-creator');
  },

  saveBulkGames(newGames: Game[]): number {
    const custom = this.getCustomGames();
    let addedCount = 0;

    newGames.forEach(game => {
      const existingIndex = custom.findIndex(g => g.id === game.id || g.slug === game.slug);
      if (existingIndex >= 0) {
        custom[existingIndex] = game;
      } else {
        custom.unshift(game);
        addedCount++;
      }
    });

    try {
      localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(custom));
      window.dispatchEvent(new Event('catalog-updated'));
    } catch {}
    newGames.forEach(syncGameToCloud);
    AchievementService.unlock('custom-creator');
    return addedCount;
  },

  getDeletedGameIds(): string[] {
    try {
      const data = localStorage.getItem(DELETED_IDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  deleteGame(gameId: string): void {
    const custom = this.getCustomGames().filter(g => g.id !== gameId);
    try {
      localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(custom));
    } catch {}

    const deleted = this.getDeletedGameIds();
    if (!deleted.includes(gameId)) {
      deleted.push(gameId);
      try {
        localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted));
      } catch {}
    }
    deleteGameFromCloud(gameId);
    window.dispatchEvent(new Event('catalog-updated'));
  },

  getAllGames(): Game[] {
    const deletedIds = new Set(this.getDeletedGameIds());
    const customGames = this.getCustomGames();
    const customMap = new Map(customGames.map(g => [g.id, g]));

    const result: Game[] = [];

    INITIAL_GAMES.forEach(game => {
      if (deletedIds.has(game.id)) return;
      if (customMap.has(game.id)) {
        result.push(customMap.get(game.id)!);
        customMap.delete(game.id);
      } else {
        result.push(game);
      }
    });

    customMap.forEach(customGame => {
      if (!deletedIds.has(customGame.id)) {
        result.unshift(customGame);
      }
    });

    return result;
  },

  // Export Catalog as JSON
  exportCatalogJSON(): string {
    const games = this.getAllGames();
    return JSON.stringify(games, null, 2);
  },

  // Export Catalog as CSV
  exportCatalogCSV(): string {
    const games = this.getAllGames();
    const headers = ['id', 'title', 'slug', 'category', 'rating', 'plays', 'dateAdded', 'playableType', 'description'];
    const rows = games.map(g => [
      `"${g.id}"`,
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.slug}"`,
      `"${g.category}"`,
      g.rating,
      g.plays,
      `"${g.dateAdded}"`,
      `"${g.playableType}"`,
      `"${g.description.replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  // Theme
  getTheme(): 'dark' | 'light' {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    return 'dark';
  },

  setTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
};
