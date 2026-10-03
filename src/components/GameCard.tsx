import React from 'react';
import { Game } from '../types/game';
import { Play, Heart, Star } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { StorageService } from '../services/storageService';
import { playSound } from '../utils/audio';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    if (onToggleFavorite) {
      onToggleFavorite(game.id);
    } else {
      StorageService.toggleFavorite(game.id);
    }
  };

  return (
    <div
      onClick={() => onSelect(game)}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 hover:border-indigo-500/50 shadow-md hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer select-none"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-950">
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Favorite Button (top right) */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all duration-150 z-10 ${
            isFavorite
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-neutral-900/60 text-neutral-300 hover:text-white border border-neutral-700/40 hover:bg-neutral-900/90'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-400' : ''}`} />
        </button>

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-indigo-600/95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 transform scale-75 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Details (Zero-Pill Typography) */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-1">
        <h3 className="text-sm font-bold text-neutral-100 group-hover:text-indigo-400 transition-colors truncate font-heading tracking-tight">
          {game.title}
        </h3>

        {/* Unboxed Metadata with Typographic Separators */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span className="truncate max-w-[85px]">{game.category}</span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="inline-flex items-center gap-0.5 text-amber-400 font-medium">
            <Star className="w-3 h-3 fill-amber-400" />
            <span className="tabular-nums font-mono">{game.rating}</span>
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="tabular-nums font-mono text-neutral-400 truncate">
            {formatNumber(game.plays)}
          </span>
        </div>
      </div>
    </div>
  );
};
