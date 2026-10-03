export type PlayableType =
  | 'builtin-2048'
  | 'builtin-hextris'
  | 'builtin-kniferain'
  | 'builtin-wordsearch'
  | 'builtin-memory'
  | 'builtin-runner'
  | 'builtin-bubble'
  | 'builtin-flappy'
  | 'builtin-3d-slope'
  | 'builtin-3d-bowling'
  | 'builtin-water-sort'
  | 'builtin-cut-the-rope'
  | 'builtin-parking-jam'
  | 'builtin-pop-it'
  | 'builtin-supermarket'
  | 'builtin-fruit-ninja'
  | 'builtin-8-ball'
  | 'builtin-piano'
  | 'builtin-draw-puzzle'
  | 'builtin-racer'
  | 'builtin-penalty'
  | 'builtin-chef'
  | 'builtin-makeover'
  | 'builtin-space-shooter'
  | 'builtin-tower'
  | 'builtin-board'
  | 'uploaded'
  | 'external'
  | 'coming-soon';

export interface GameReview {
  id: string;
  gameId: string;
  author: string;
  avatarColor: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  date: string;
  avatar: string;
}

export interface Game {
  id: string;
  title: string;
  slug: string;
  category: string;
  categories: string[];
  thumbnailUrl: string;
  description: string;
  controls: string;
  howToPlay: string;
  gameUrl: string;
  featured: boolean;
  popular: boolean;
  isNew: boolean;
  rating: number; // e.g. 4.8
  plays: number; // e.g. 145000
  dateAdded: string; // ISO date string or YYYY-MM-DD
  playableType: PlayableType;
  customSourceHtml?: string;
  tags: string[];
  bannerColor?: string;
  badge?: string;
  customThumbnailData?: string;
  reviews?: GameReview[];
}

export interface GameCategory {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  color: string;
  count: number;
  description: string;
}

export type SortOption = 'most-played' | 'highest-rated' | 'recently-added' | 'a-z' | 'z-a';

export interface FilterState {
  category: string;
  searchQuery: string;
  sortBy: SortOption;
  featuredOnly?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  unlockedAt?: number;
}
