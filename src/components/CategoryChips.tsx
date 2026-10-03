import React from 'react';
import { GameCategory } from '../types/game';

interface CategoryChipsProps {
  categories: GameCategory[];
  activeCategory: string; // 'all' or category name
  onSelectCategory: (categoryName: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-1.5 min-w-max p-1 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeCategory.toLowerCase() === 'all'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Games
        </button>

        {categories.map(cat => {
          const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{cat.name}</span>
              {cat.count > 0 && (
                <span className="text-[10px] font-mono text-neutral-500 font-normal">
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
