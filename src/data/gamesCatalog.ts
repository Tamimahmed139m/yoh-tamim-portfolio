import { Game, GameCategory, PlayableType } from '../types/game';
import { RAW_GAME_TITLES } from './rawGamesList';
import { generateGameThumbnail } from '../utils/thumbnailGenerator';

// Helper to sanitize title to unique slug
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// Category classification heuristic
function inferCategories(title: string): { primary: string; categories: string[] } {
  const lower = title.toLowerCase();

  if (lower.includes('solitaire') || lower.includes('klondike') || lower.includes('tri peaks') || lower.includes('freecell')) {
    return { primary: 'Solitaire', categories: ['Solitaire', 'Card', 'Puzzle'] };
  }
  if (lower.includes('mahjong') || lower.includes('monsterjong')) {
    return { primary: 'Mahjong', categories: ['Mahjong', 'Board', 'Puzzle'] };
  }
  if (lower.includes('chess') || lower.includes('checkers') || lower.includes('backgammon') || lower.includes('reversi') || lower.includes('domino')) {
    return { primary: 'Board', categories: ['Board', 'Strategy'] };
  }
  if (lower.includes('card') || lower.includes('poker') || lower.includes('blackjack') || lower.includes('rummy') || lower.includes('yatzy') || lower.includes('okey')) {
    return { primary: 'Card', categories: ['Card', 'Board'] };
  }
  if (lower.includes('racing') || lower.includes('race') || lower.includes('drift') || lower.includes('speed') || lower.includes('car') || lower.includes('truck') || lower.includes('parking') || lower.includes('moto') || lower.includes('traffic')) {
    return { primary: 'Racing', categories: ['Racing', 'Arcade', 'Action'] };
  }
  if (lower.includes('soccer') || lower.includes('penalty') || lower.includes('football') || lower.includes('basketball') || lower.includes('hoop') || lower.includes('dunk') || lower.includes('golf') || lower.includes('bowling') || lower.includes('tennis') || lower.includes('billiards') || lower.includes('baseball') || lower.includes('keeper')) {
    return { primary: 'Sports', categories: ['Sports', 'Arcade'] };
  }
  if (lower.includes('cooking') || lower.includes('kitchen') || lower.includes('chef') || lower.includes('pizza') || lower.includes('cake') || lower.includes('biscuit') || lower.includes('burger') || lower.includes('donut') || lower.includes('food') || lower.includes('froyo') || lower.includes('ice-cream') || lower.includes('recipe')) {
    return { primary: 'Cooking', categories: ['Cooking', 'Simulation', 'Girls'] };
  }
  if (lower.includes('makeup') || lower.includes('make up') || lower.includes('dress up') || lower.includes('fashion') || lower.includes('beauty') || lower.includes('lily') || lower.includes('wedding') || lower.includes('dolly') || lower.includes('ballet') || lower.includes('salon')) {
    return { primary: 'Girls', categories: ['Girls', 'Dress Up', 'Beauty'] };
  }
  if (lower.includes('match') || lower.includes('bubble') || lower.includes('jewel') || lower.includes('pop') || lower.includes('crush') || lower.includes('fruit') || lower.includes('candy') || lower.includes('blast') || lower.includes('collapse')) {
    return { primary: 'Match 3', categories: ['Match 3', 'Puzzle', 'Arcade'] };
  }
  if (lower.includes('word') || lower.includes('text') || lower.includes('quiz') || lower.includes('guess') || lower.includes('trivia') || lower.includes('hangman') || lower.includes('crossword')) {
    return { primary: 'Word', categories: ['Word', 'Puzzle', 'Educational'] };
  }
  if (lower.includes('sniper') || lower.includes('gun') || lower.includes('shoot') || lower.includes('cannon') || lower.includes('archer') || lower.includes('bomb') || lower.includes('tank') || lower.includes('defly')) {
    return { primary: 'Shooting', categories: ['Shooting', 'Action'] };
  }
  if (lower.includes('puzzle') || lower.includes('sort') || lower.includes('cube') || lower.includes('block') || lower.includes('jigsaw') || lower.includes('2048') || lower.includes('maze') || lower.includes('connect') || lower.includes('brain') || lower.includes('tangram') || lower.includes('sudoku') || lower.includes('0h') || lower.includes('hextris')) {
    return { primary: 'Puzzle', categories: ['Puzzle', 'Arcade'] };
  }
  if (lower.includes('runner') || lower.includes('run') || lower.includes('rush') || lower.includes('flip') || lower.includes('jump') || lower.includes('escape') || lower.includes('spin') || lower.includes('smash') || lower.includes('roll') || lower.includes('fall')) {
    return { primary: 'Hyper Casual', categories: ['Hyper Casual', 'Arcade'] };
  }
  if (lower.includes('fight') || lower.includes('hero') || lower.includes('ninja') || lower.includes('attack') || lower.includes('alien') || lower.includes('knight') || lower.includes('dragon') || lower.includes('clash') || lower.includes('pirate') || lower.includes('zombie')) {
    return { primary: 'Action', categories: ['Action', 'Adventure'] };
  }

  return { primary: 'Arcade', categories: ['Arcade', 'Action'] };
}

// Map specific game titles to high-polish built-in playable mini-games
function determinePlayableType(slug: string): PlayableType {
  if (slug === '2048' || slug.includes('2048')) return 'builtin-2048';
  if (slug === 'hextris' || slug.includes('hex-zen') || slug.includes('hex-blitz')) return 'builtin-hextris';
  if (slug === 'knife-rain' || slug === 'color-pin' || slug.includes('pick-a-lock') || slug.includes('peet-a-lock')) return 'builtin-kniferain';
  if (slug === 'word-search-classic' || slug.includes('7-words') || slug.includes('words-of-wonders')) return 'builtin-wordsearch';
  if (slug === 'matching-card-heroes' || slug.includes('easter-card-match') || slug.includes('pair-up-3d')) return 'builtin-memory';
  if (slug === 'neon-rider' || slug === 'speed-master' || slug.includes('color-tunnel') || slug.includes('slope')) return 'builtin-runner';
  if (slug === 'smarty-bubbles' || slug.includes('bubble-spirit') || slug.includes('candy-bubble') || slug.includes('bubble-woods')) return 'builtin-bubble';
  if (slug === 'angry-flappy-wings' || slug === 'birdy-rush' || slug.includes('ufo-run')) return 'builtin-flappy';

  return 'coming-soon';
}

function buildDescription(title: string, category: string): string {
  const templates = [
    `Experience exciting gameplay in ${title}! Test your reflexes, sharpen your tactics, and conquer every challenging stage in this top-rated ${category} game.`,
    `Jump into ${title}, a fast-paced and addictive ${category} adventure. Play for the highest score, master unique levels, and challenge your friends directly in your browser.`,
    `Discover ${title}, crafted for endless browser fun! Complete thrilling missions, unlock rewards, and enjoy polished graphics in this standout ${category} favorite.`,
    `Play ${title} for free! Designed with responsive controls and engaging challenges, it is one of the most entertaining ${category} titles online.`
  ];
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return templates[hash % templates.length];
}

function buildControls(category: string, title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('racing') || lower.includes('car') || lower.includes('drift')) {
    return 'Arrow Keys / WASD to steer, Spacebar for Handbrake / Boost. Touch on-screen pedals on mobile.';
  }
  if (lower.includes('basketball') || lower.includes('soccer') || lower.includes('penalty')) {
    return 'Mouse Click & Drag to aim trajectory. Release to shoot. Tap and swipe on touchscreens.';
  }
  if (category === 'Puzzle' || category === 'Match 3' || category === 'Solitaire' || category === 'Mahjong') {
    return 'Left Click / Tap to select and move tiles or cards. Drag or tap to place.';
  }
  if (category === 'Cooking' || category === 'Girls' || category === 'Dress Up') {
    return 'Mouse Click / Tap items to prepare dishes, style outfits, or apply makeup.';
  }
  return 'Mouse Click / Spacebar / Touch to interact, jump, or activate actions.';
}

function buildHowToPlay(category: string, title: string): string {
  return `1. Click Play or tap the screen to initiate your session.
2. Follow the on-screen indicators and objectives for ${title}.
3. Reach target scores, defeat obstacles, or clear the board before time runs out.
4. Try to achieve 3 stars and beat your personal best record!`;
}

// Generate the master catalog
export function generateMasterCatalog(): Game[] {
  const slugCounts = new Map<string, number>();
  const catalog: Game[] = [];

  RAW_GAME_TITLES.forEach((title, index) => {
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = `game-${index + 1}`;

    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);

    const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
    const { primary, categories } = inferCategories(title);
    const playableType = determinePlayableType(slug);

    // Realistic ratings and play counts
    const hash = (index * 73 + title.length * 37) % 1000;
    const rating = Number((4.2 + (hash % 8) * 0.1).toFixed(1));
    const plays = 25000 + ((hash * 1381) % 950000);
    const featured = index < 12 || index % 28 === 0 || playableType !== 'coming-soon';
    const popular = plays > 350000 || index % 7 === 0;
    const isNew = index % 15 === 0 || index > RAW_GAME_TITLES.length - 20;

    // ISO dates within the last 6 months
    const daysAgo = (index * 2) % 180;
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];

    const game: Game = {
      id: `game-${index + 1}`,
      title,
      slug,
      category: primary,
      categories,
      thumbnailUrl: generateGameThumbnail(title, primary),
      description: buildDescription(title, primary),
      controls: buildControls(primary, title),
      howToPlay: buildHowToPlay(primary, title),
      gameUrl: `/games/${slug}/`,
      featured,
      popular,
      isNew,
      rating,
      plays,
      dateAdded: date,
      playableType,
      tags: [...categories, primary.toLowerCase(), 'html5', 'browser-game'],
    };

    catalog.push(game);
  });

  return catalog;
}

export const INITIAL_GAMES = generateMasterCatalog();

// Categories master list
export const CATEGORY_DEFINITIONS: GameCategory[] = [
  { id: 'cat-action', name: 'Action', slug: 'action', iconName: 'Flame', color: '#E11D48', count: 0, description: 'High-adrenaline combat, brawlers, and heroic showdowns.' },
  { id: 'cat-arcade', name: 'Arcade', slug: 'arcade', iconName: 'Gamepad2', color: '#7C3AED', count: 0, description: 'Classic arcade experiences, retro hits, and reflex testers.' },
  { id: 'cat-puzzle', name: 'Puzzle', slug: 'puzzle', iconName: 'Puzzle', color: '#2563EB', count: 0, description: 'Brain teasers, logic grids, block matches, and riddles.' },
  { id: 'cat-racing', name: 'Racing', slug: 'racing', iconName: 'Car', color: '#D97706', count: 0, description: 'High-speed track racing, drift tournaments, and parking challenges.' },
  { id: 'cat-sports', name: 'Sports', slug: 'sports', iconName: 'Trophy', color: '#16A34A', count: 0, description: 'Soccer penalties, basketball dunks, tennis, and pool tables.' },
  { id: 'cat-match3', name: 'Match 3', slug: 'match-3', iconName: 'Sparkles', color: '#EC4899', count: 0, description: 'Jewel crushers, bubble shooters, and color matches.' },
  { id: 'cat-cooking', name: 'Cooking', slug: 'cooking', iconName: 'UtensilsCrossed', color: '#F97316', count: 0, description: 'Bake cakes, manage kitchens, and serve gourmet recipes.' },
  { id: 'cat-girls', name: 'Girls & Fashion', slug: 'girls', iconName: 'Heart', color: '#F43F5E', count: 0, description: 'Makeovers, stylish outfit dress-ups, and salon creations.' },
  { id: 'cat-card', name: 'Card', slug: 'card', iconName: 'Layers', color: '#0284C7', count: 0, description: 'Blackjack, poker, solitaire variants, and deck challenges.' },
  { id: 'cat-solitaire', name: 'Solitaire', slug: 'solitaire', iconName: 'Crown', color: '#4F46E5', count: 0, description: 'Classic Klondike, Spider, FreeCell, and TriPeaks solitaire.' },
  { id: 'cat-mahjong', name: 'Mahjong', slug: 'mahjong', iconName: 'Grid', color: '#0D9488', count: 0, description: 'Traditional and 3D tile matching pair puzzles.' },
  { id: 'cat-board', name: 'Board', slug: 'board', iconName: 'Dices', color: '#9333EA', count: 0, description: 'Chess, checkers, backgammon, dominoes, and dice games.' },
  { id: 'cat-shooting', name: 'Shooting', slug: 'shooting', iconName: 'Crosshair', color: '#DC2626', count: 0, description: 'Target archery, sniper missions, and tactical shooters.' },
  { id: 'cat-hypercasual', name: 'Hyper Casual', slug: 'hyper-casual', iconName: 'Zap', color: '#8B5CF6', count: 0, description: 'One-tap runners, quick reflex games, and endless loops.' },
  { id: 'cat-word', name: 'Word', slug: 'word', iconName: 'BookOpen', color: '#0891B2', count: 0, description: 'Word searches, vocabulary quizzes, and crossword puzzles.' }
];

// Calculate category counts dynamically
export function getCategoriesWithCounts(games: Game[]): GameCategory[] {
  return CATEGORY_DEFINITIONS.map(cat => {
    const count = games.filter(g =>
      g.category.toLowerCase() === cat.name.toLowerCase() ||
      g.categories.some(c => c.toLowerCase() === cat.name.toLowerCase() || c.toLowerCase() === cat.slug.toLowerCase())
    ).length;
    return { ...cat, count };
  });
}
