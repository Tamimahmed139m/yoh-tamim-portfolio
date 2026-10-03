import React from 'react';
import { Play, Compass, Sparkles, Flame, Trophy } from 'lucide-react';
import { Game } from '../types/game';

interface HeroBannerProps {
  onPlayNow: () => void;
  onExploreGames: () => void;
  featuredGames: Game[];
  onSelectGame: (game: Game) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onPlayNow,
  onExploreGames,
  featuredGames,
  onSelectGame,
}) => {
  const showcaseGame = featuredGames[0];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 via-indigo-950/40 to-neutral-950 border border-neutral-800 shadow-2xl p-6 sm:p-10 lg:p-12 mb-12">
      {/* Background ambient glow circles */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline and Call-to-actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>330+ FREE BROWSER GAMES</span>
            <span aria-hidden="true">·</span>
            <span>NO INSTALLS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-heading">
            PLAY. DISCOVER.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              HAVE FUN.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 max-w-xl leading-relaxed">
            Play hundreds of free browser games instantly. Enjoy smooth action, brain-teasing puzzles, racing thrills, and arcade classics on any device.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onPlayNow}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>PLAY NOW</span>
            </button>
            <button
              onClick={onExploreGames}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 font-semibold text-sm transition-colors"
            >
              <Compass className="w-4 h-4 text-neutral-400" />
              <span>EXPLORE GAMES</span>
            </button>
          </div>
        </div>

        {/* Right Column: Hero Spotlight Card */}
        {showcaseGame && (
          <div className="lg:col-span-5 flex justify-center">
            <div
              onClick={() => onSelectGame(showcaseGame)}
              className="group relative w-full max-w-sm rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-4/3 overflow-hidden bg-neutral-950">
                <img
                  src={showcaseGame.thumbnailUrl}
                  alt={showcaseGame.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                
                {/* Floating Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{showcaseGame.category}</span>
                  <span className="text-amber-400 font-semibold">★ {showcaseGame.rating}</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                  {showcaseGame.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  {showcaseGame.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
