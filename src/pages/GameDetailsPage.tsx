import React, { useState } from 'react';
import { Game } from '../types/game';
import { GamePlayer } from '../components/player/GamePlayer';
import { GameCard } from '../components/GameCard';
import { SEOHead } from '../components/SEOHead';
import { LeaderboardWidget } from '../components/LeaderboardWidget';
import { ReviewSection } from '../components/ReviewSection';
import { EmbedShareModal } from '../components/EmbedShareModal';
import { AchievementsModal } from '../components/AchievementsModal';
import { ThumbnailStudioModal } from '../components/ThumbnailStudioModal';
import { Heart, Share2, Star, Check, Sparkles, Gamepad2, Info, Compass, Trophy, Code, Palette } from 'lucide-react';
import { formatNumber, formatDate } from '../utils/formatters';
import { StorageService } from '../services/storageService';
import { playSound } from '../utils/audio';

interface GameDetailsPageProps {
  game: Game;
  allGames: Game[];
  favorites: string[];
  onSelectGame: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onNavigate: (path: string) => void;
}

export const GameDetailsPage: React.FC<GameDetailsPageProps> = ({
  game,
  allGames,
  favorites,
  onSelectGame,
  onToggleFavorite,
  onNavigate,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [userRating, setUserRating] = useState<number>(() => {
    return StorageService.getUserRatings()[game.id] || 0;
  });

  const isFav = favorites.includes(game.id);

  // Related games (same category, different game)
  const relatedGames = allGames
    .filter(g => g.id !== game.id && (g.category === game.category || g.categories.some(c => game.categories.includes(c))))
    .slice(0, 6);

  const handleShare = async () => {
    playSound('click');
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${game.title} - Play Free Online`,
          text: `Play ${game.title} online for free on NovaArcade!`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {}
  };

  const handleRate = (stars: number) => {
    playSound('point');
    setUserRating(stars);
    StorageService.setUserRating(game.id, stars);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Dynamic SEO */}
      <SEOHead
        title={`${game.title} - Play Free Online`}
        description={`Play ${game.title} online for free. ${game.description.slice(0, 140)}`}
        schemaData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: game.title,
          applicationCategory: 'GameApplication',
          operatingSystem: 'All',
          description: game.description,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: game.rating,
            ratingCount: Math.floor(game.plays / 15),
          },
        }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-400">
        <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">
          Home
        </button>
        <span aria-hidden="true">/</span>
        <button onClick={() => onNavigate('/games')} className="hover:text-white transition-colors">
          Games
        </button>
        <span aria-hidden="true">/</span>
        <button
          onClick={() => onNavigate(`/categories/${game.category.toLowerCase()}`)}
          className="hover:text-white transition-colors"
        >
          {game.category}
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-200 font-semibold truncate max-w-[200px]">{game.title}</span>
      </nav>

      {/* Main Game Screen & Side Info Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Game Player (8 cols) */}
        <div className="lg:col-span-8 w-full">
          <GamePlayer game={game} />
        </div>

        {/* Right Column: Game Metadata & Actions (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-neutral-900 border border-neutral-800 p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span>{game.category}</span>
              <span className="font-mono tabular-nums">{formatNumber(game.plays)} plays</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white font-heading tracking-tight leading-snug">
              {game.title}
            </h1>
          </div>

          {/* Rating Display & User Star Rating */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-lg font-bold font-mono tabular-nums text-white">
                {game.rating}
              </span>
              <span className="text-xs text-neutral-500">/ 5.0</span>
            </div>

            {/* Interactive Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="p-1 focus:outline-none hover:scale-110 transition-transform"
                  title={`Rate ${star} star`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= (userRating || Math.floor(game.rating))
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                playSound('click');
                onToggleFavorite(game.id);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all ${
                isFav
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{isFav ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white transition-colors"
            >
              {copiedShare ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Actions (Embed, Achievements, Studio) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                playSound('click');
                setIsEmbedOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Embed Game & QR Code"
            >
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>Embed</span>
            </button>

            <button
              onClick={() => {
                playSound('point');
                setIsAchievementsOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="View Player Achievements"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Badges</span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                setIsStudioOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Customize Thumbnail Artwork"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thumbnail</span>
            </button>
          </div>

          {/* Controls Box */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200 uppercase tracking-wider">
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Controls</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">{game.controls}</p>
          </div>

          {/* Tags */}
          <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-400 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-neutral-300">Tags:</span>
            {game.tags.map(tag => (
              <span key={tag} className="text-neutral-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Section: About & How to Play */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-neutral-800/80">
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <h3 className="text-lg font-bold text-white font-heading">About This Game</h3>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {game.description}
          </p>
          <div className="pt-3 border-t border-neutral-800/60 grid grid-cols-2 gap-2 text-xs text-neutral-400">
            <div>Added: <span className="text-neutral-200">{formatDate(game.dateAdded)}</span></div>
            <div>Category: <span className="text-neutral-200">{game.category}</span></div>
            <div>Platform: <span className="text-neutral-200">HTML5 Browser</span></div>
            <div>Device: <span className="text-neutral-200">Desktop & Mobile</span></div>
          </div>
        </div>

        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h3 className="text-lg font-bold text-white font-heading">How to Play</h3>
          </div>
          <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
            {game.howToPlay}
          </div>
        </div>
      </div>

      {/* Community Ranks & Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-neutral-800/80">
        <div className="lg:col-span-5">
          <LeaderboardWidget gameId={game.id} gameTitle={game.title} />
        </div>
        <div className="lg:col-span-7">
          <ReviewSection gameId={game.id} gameTitle={game.title} />
        </div>
      </div>

      {/* Related Games */}
      {relatedGames.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-neutral-800/80">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white font-heading tracking-tight">
              More {game.category} Games
            </h3>
            <button
              onClick={() => onNavigate(`/categories/${game.category.toLowerCase()}`)}
              className="text-xs font-semibold text-neutral-400 hover:text-white"
            >
              View all {game.category} →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relatedGames.map(rel => (
              <GameCard
                key={rel.id}
                game={rel}
                onSelect={onSelectGame}
                isFavorite={favorites.includes(rel.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* Interactive Modals */}
      <EmbedShareModal
        isOpen={isEmbedOpen}
        onClose={() => setIsEmbedOpen(false)}
        game={game}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />

      <ThumbnailStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        games={allGames}
        selectedGameId={game.id}
        onThumbnailUpdated={() => {
          window.dispatchEvent(new Event('catalog-updated'));
        }}
      />
    </div>
  );
};
