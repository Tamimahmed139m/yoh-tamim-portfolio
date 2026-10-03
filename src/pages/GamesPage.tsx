import React, { useState } from 'react';
import { Game, GameCategory, SortOption } from '../types/game';
import { GameGrid } from '../components/GameGrid';
import { Pagination } from '../components/Pagination';
import { SEOHead } from '../components/SEOHead';
import { Search, ArrowUpDown, Filter, X } from 'lucide-react';

interface GamesPageProps {
  games: Game[];
  categories: GameCategory[];
  favorites: string[];
  onSelectGame: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const GamesPage: React.FC<GamesPageProps> = ({
  games,
  categories,
  favorites,
  onSelectGame,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('most-played');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const filtered = games.filter(g => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategory.toLowerCase() === 'all' ||
      g.category.toLowerCase() === selectedCategory.toLowerCase() ||
      g.categories.some(c => c.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCat;
  });

  const sorted = [...filtered].sort((a, b) => {
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

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('most-played');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <SEOHead
        title="All HTML5 Games Catalog"
        description="Search, filter, and discover over 330 free HTML5 browser games on NovaArcade. Instant play with zero installs."
      />

      {/* Header and Filter Controls */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight">
            Game Catalog
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Displaying {sorted.length} games available for instant play
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by title, tag, or keyword..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown and Sort Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <label htmlFor="games-category-select" className="sr-only">Filter by Category</label>
              <select
                id="games-category-select"
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-neutral-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-neutral-900 text-white">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name} className="bg-neutral-900 text-white">
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <label htmlFor="games-sort-select" className="sr-only">Sort Games</label>
              <select
                id="games-sort-select"
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

            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <GameGrid
        games={paginated}
        onSelectGame={onSelectGame}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        emptyTitle={`No games match "${searchQuery || selectedCategory}"`}
        emptySubtitle="Try adjusting your filters or search terms."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={page => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        totalItems={sorted.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
};
