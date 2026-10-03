import React from 'react';
import { Game } from '../types/game';
import { GameCard } from './GameCard';
import { Gamepad2 } from 'lucide-react';

interface GameGridProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  favorites: string[];
  onToggleFavorite?: (gameId: string) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export const GameGrid: React.FC<GameGridProps> = ({
  games,
  onSelectGame,
  favorites,
  onToggleFavorite,
  isLoading = false,
  emptyTitle = 'No games found',
  emptySubtitle = 'Try changing your search query or category filters.',
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {Array.from({ length: 12 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-neutral-900 border border-neutral-800 p-2 space-y-3 animate-pulse"
          >
            <div className="aspect-4/3 bg-neutral-800 rounded-xl" />
            <div className="h-4 bg-neutral-800 rounded w-3/4" />
            <div className="h-3 bg-neutral-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="py-16 px-4 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800/60 my-6">
        <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto mb-3">
          <Gamepad2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white mb-1 font-heading">{emptyTitle}</h4>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
      {games.map(game => (
        <GameCard
          key={game.id}
          game={game}
          onSelect={onSelectGame}
          isFavorite={favorites.includes(game.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};
