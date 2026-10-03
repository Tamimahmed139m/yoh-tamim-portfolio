import React, { useState, useEffect, useRef } from 'react';
import { Game } from '../types/game';
import { Search, X, Gamepad2, ArrowRight } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  onSelectGame: (game: Game) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  games,
  onSelectGame,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const matched = games.filter(g => {
      return (
        g.title.toLowerCase().includes(trimmed) ||
        g.category.toLowerCase().includes(trimmed) ||
        g.tags.some(t => t.toLowerCase().includes(trimmed)) ||
        g.description.toLowerCase().includes(trimmed)
      );
    });

    setResults(matched.slice(0, 10)); // Top 10 matches
  }, [query, games]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          const evt = new CustomEvent('open-search-modal');
          window.dispatchEvent(evt);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-800 gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search 330+ HTML5 games (e.g. 2048, Car, Bubble, Solitaire)..."
            className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-white rounded bg-neutral-800 border border-neutral-700 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Type any game title, category, or keyword to search instantly.
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map(game => (
                <div
                  key={game.id}
                  onClick={() => {
                    onSelectGame(game);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800/80 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={game.thumbnailUrl}
                      alt={game.title}
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-100 group-hover:text-indigo-400 transition-colors truncate">
                        {game.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span>{game.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400">★ {game.rating}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums font-mono">{formatNumber(game.plays)} plays</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Gamepad2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-300">No games found for "{query}"</p>
              <p className="text-xs text-neutral-500 mt-1">Try another keyword like Racing, Puzzle, or 3D.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
