import React, { useState } from 'react';
import { Game } from '../types/game';
import { GameGrid } from '../components/GameGrid';
import { Pagination } from '../components/Pagination';
import { SEOHead } from '../components/SEOHead';
import { Flame } from 'lucide-react';

interface PopularPageProps {
  games: Game[];
  favorites: string[];
  onSelectGame: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const PopularPage: React.FC<PopularPageProps> = ({
  games,
  favorites,
  onSelectGame,
  onToggleFavorite,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const popularGames = [...games].sort((a, b) => b.plays - a.plays);
  const totalPages = Math.ceil(popularGames.length / ITEMS_PER_PAGE);
  const paginated = popularGames.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <SEOHead
        title="Most Popular Games – Top Rated"
        description="Play the most popular free online games on NovaArcade. Millions of plays, top rated browser action, puzzles, and racing hits."
      />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight">
              Most Popular Games
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Ranked by overall player sessions and community acclaim
          </p>
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
        totalItems={popularGames.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
};
