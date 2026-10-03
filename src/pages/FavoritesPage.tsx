import React from 'react';
import { Game } from '../types/game';
import { GameGrid } from '../components/GameGrid';
import { SEOHead } from '../components/SEOHead';
import { Heart, Compass } from 'lucide-react';

interface FavoritesPageProps {
  allGames: Game[];
  favorites: string[];
  onSelectGame: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onExplore: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  allGames,
  favorites,
  onSelectGame,
  onToggleFavorite,
  onExplore,
}) => {
  const favoriteGames = allGames.filter(g => favorites.includes(g.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <SEOHead
        title="Your Favorite Games"
        description="Access and play your saved favorite games anytime on NovaArcade. Stored securely and ready for instant browser gaming."
      />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight">
              My Favorites
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {favoriteGames.length} {favoriteGames.length === 1 ? 'game' : 'games'} saved to your library
          </p>
        </div>

        {favoriteGames.length > 0 && (
          <button
            onClick={onExplore}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover More</span>
          </button>
        )}
      </div>

      <GameGrid
        games={favoriteGames}
        onSelectGame={onSelectGame}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        emptyTitle="No favorite games yet"
        emptySubtitle="Click the heart icon on any game card to bookmark it here for quick access!"
      />
    </div>
  );
};
