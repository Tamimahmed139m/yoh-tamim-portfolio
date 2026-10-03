import React, { useState } from 'react';
import { Game, GameCategory } from '../types/game';
import { GameGrid } from '../components/GameGrid';
import { Pagination } from '../components/Pagination';
import { SEOHead } from '../components/SEOHead';
import { ArrowLeft } from 'lucide-react';

interface CategoryDetailPageProps {
  categorySlug: string;
  categories: GameCategory[];
  allGames: Game[];
  favorites: string[];
  onSelectGame: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onBackToCategories: () => void;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  categorySlug,
  categories,
  allGames,
  favorites,
  onSelectGame,
  onToggleFavorite,
  onBackToCategories,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const currentCategory = categories.find(
    c => c.slug.toLowerCase() === categorySlug.toLowerCase() || c.name.toLowerCase() === categorySlug.toLowerCase()
  ) || {
    id: `cat-${categorySlug}`,
    name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
    slug: categorySlug,
    description: `Best ${categorySlug} browser games free to play online.`,
    count: 0,
    color: '#6366f1',
    iconName: 'Gamepad2',
  };

  const categoryGames = allGames.filter(g =>
    g.category.toLowerCase() === currentCategory.name.toLowerCase() ||
    g.categories.some(c => c.toLowerCase() === currentCategory.name.toLowerCase() || c.toLowerCase() === currentCategory.slug.toLowerCase())
  );

  const totalPages = Math.ceil(categoryGames.length / ITEMS_PER_PAGE);
  const paginated = categoryGames.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <SEOHead
        title={`Play Free ${currentCategory.name} Games Online`}
        description={`Discover and play the best free ${currentCategory.name} games on NovaArcade. Responsive controls and instant browser gameplay.`}
      />

      <div className="space-y-3">
        <button
          onClick={onBackToCategories}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Categories</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight">
              {currentCategory.name} Games
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {currentCategory.description} ({categoryGames.length} titles available)
            </p>
          </div>
        </div>
      </div>

      <GameGrid
        games={paginated}
        onSelectGame={onSelectGame}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={page => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        totalItems={categoryGames.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
};
