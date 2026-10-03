import React from 'react';
import { GameCategory, Game } from '../types/game';
import { SEOHead } from '../components/SEOHead';
import { Gamepad2, ArrowRight } from 'lucide-react';

interface CategoriesPageProps {
  categories: GameCategory[];
  onSelectCategory: (categoryName: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onSelectCategory,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <SEOHead
        title="Game Categories"
        description="Browse browser games by category: Action, Puzzle, Arcade, Racing, Cooking, Solitaire, Sports, Mahjong, and more on NovaArcade."
      />

      <div>
        <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight">
          Explore Categories
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Pick your favorite gaming genre and jump right into the action
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.name)}
            className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-850 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: cat.color }}
                >
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-400">
                  {cat.count} games
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors font-heading">
                {cat.name}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400 group-hover:text-indigo-400 transition-colors">
              <span>Browse Games</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
