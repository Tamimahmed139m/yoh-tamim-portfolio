import React, { useState } from 'react';
import { Game, GameCategory, SortOption } from '../types/game';
import { HeroBanner } from '../components/HeroBanner';
import { CategoryChips } from '../components/CategoryChips';
import { GameGrid } from '../components/GameGrid';
import { Pagination } from '../components/Pagination';
import { SEOHead } from '../components/SEOHead';
import { History, Sparkles, SlidersHorizontal, ArrowUpDown, Boxes, FileSpreadsheet, Palette } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface HomePageProps {
  games: Game[];
  categories: GameCategory[];
  favorites: string[];
  recentlyPlayed: Game[];
  onSelectGame: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  games,
  categories,
  favorites,
  recentlyPlayed,
  onSelectGame,
  onToggleFavorite,
  onNavigate,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('most-played');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 24;

  const featuredGames = games.filter(g => g.featured).slice(0, 8);
  const threeDGames = games
    .filter(
      g =>
        g.title.includes('3D') ||
        g.title.toLowerCase().includes('slope') ||
        g.title.toLowerCase().includes('tunnel') ||
        g.title.toLowerCase().includes('bowling') ||
        g.title.toLowerCase().includes('cars arena') ||
        g.title.toLowerCase().includes('pop it') ||
        g.category.toLowerCase().includes('3d')
    )
    .slice(0, 6);

  // Filter & sort
  const filteredGames = games.filter(game => {
    if (activeCategory.toLowerCase() === 'all') return true;
    return (
      game.category.toLowerCase() === activeCategory.toLowerCase() ||
      game.categories.some(c => c.toLowerCase() === activeCategory.toLowerCase())
    );
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'most-played':
        return b.plays - a.plays;
      case 'highest-rated':
        return b.rating - a.rating;
      case 'recently-added':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      case 'a-z':
        return a.title.localeCompare(b.title);
      case 'z-a':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedGames.length / ITEMS_PER_PAGE);
  const paginatedGames = sortedGames.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handlePlayNow = () => {
    // Pick first featured game (e.g. 2048 or knife rain)
    const playable = games.find(g => g.playableType !== 'coming-soon') || games[0];
    if (playable) onSelectGame(playable);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <SEOHead
        title="Play 330+ Free Browser Games Online"
        description="Play hundreds of free browser games instantly on NovaArcade. Responsive HTML5 gameplay, instant search, puzzle, action, racing, and arcade favorites."
      />

      {/* Hero Section */}
      <HeroBanner
        onPlayNow={handlePlayNow}
        onExploreGames={() => {
          const el = document.getElementById('catalog-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        featuredGames={featuredGames}
        onSelectGame={onSelectGame}
      />

      {/* Continue Playing (Recently Played Shelf) */}
      {recentlyPlayed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white font-heading tracking-tight">
                Continue Playing
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/favorites')}
              className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Saved Favorites →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyPlayed.slice(0, 6).map(game => (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 p-2 cursor-pointer transition-all duration-200"
              >
                <div className="aspect-4/3 rounded-lg overflow-hidden bg-neutral-950 mb-2">
                  <img
                    src={game.thumbnailUrl}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-bold text-neutral-200 truncate group-hover:text-indigo-400">
                  {game.title}
                </h4>
                <span className="text-[11px] text-neutral-500">{game.category}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Games Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-heading tracking-tight">
              Featured Games
            </h2>
          </div>
          <span className="text-xs text-neutral-400">
            Hand-picked community highlights
          </span>
        </div>

        <GameGrid
          games={featuredGames.slice(0, 6)}
          onSelectGame={onSelectGame}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />
      </section>

      {/* 3D WebGL Games Showcase Shelf */}
      {threeDGames.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-neutral-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white font-heading tracking-tight">
                Genuine 3D WebGL Games
              </h2>
            </div>
            <span className="text-xs text-neutral-400">
              3D physics, real-time lighting & interactive graphics
            </span>
          </div>

          <GameGrid
            games={threeDGames}
            onSelectGame={onSelectGame}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
          />
        </section>
      )}

      {/* Catalog Section with Category Filter & Sorting */}
      <section id="catalog-section" className="space-y-6 pt-4 border-t border-neutral-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
              All Games
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Browse {filteredGames.length} free browser games in our active library
            </p>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <label htmlFor="sort-select" className="sr-only">Sort Games</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-neutral-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="most-played" className="bg-neutral-900 text-white">Most Played</option>
                <option value="highest-rated" className="bg-neutral-900 text-white">Highest Rated</option>
                <option value="recently-added" className="bg-neutral-900 text-white">Recently Added</option>
                <option value="a-z" className="bg-neutral-900 text-white">Title A–Z</option>
                <option value="z-a" className="bg-neutral-900 text-white">Title Z–A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Horizontal Tabs */}
        <CategoryChips
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleCategoryChange}
        />

        {/* Paginated Game Grid */}
        <GameGrid
          games={paginatedGames}
          onSelectGame={onSelectGame}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={page => {
            setCurrentPage(page);
            const el = document.getElementById('catalog-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          totalItems={sortedGames.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </section>
    </div>
  );
};
