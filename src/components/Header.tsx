import React, { useState } from 'react';
import { Gamepad2, Search, Heart, Sparkles, FolderTree, Menu, X, Flame, Shield, Trophy } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
  onOpenAchievements?: () => void;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  onOpenAchievements,
  favoritesCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Games', path: '/games' },
    { label: 'Categories', path: '/categories' },
    { label: 'Popular', path: '/popular' },
    { label: 'Favorites', path: '/favorites', badge: favoritesCount > 0 ? String(favoritesCount) : null },
    { label: 'Admin', path: '/admin' },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-neutral-950/80 dark:bg-neutral-950/80 border-b border-neutral-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              NovaArcade
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
          {navLinks.map(link => {
            const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
            return (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`relative py-1 transition-colors hover:text-white whitespace-nowrap focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded ${
                  isActive ? 'text-white font-semibold' : 'text-neutral-400'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-1 text-[11px] font-mono text-rose-400 font-bold">
                    ({link.badge})
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          {/* Instant Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors text-xs font-medium"
            title="Search games (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-block text-[10px] bg-neutral-800 text-neutral-400 px-1 rounded font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Achievements Trigger */}
          {onOpenAchievements && (
            <button
              onClick={onOpenAchievements}
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-neutral-700 transition-colors"
              title="Player Achievements & Badges"
              aria-label="Achievements"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(m => !m)}
            className="md:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
          {navLinks.map(link => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-left ${
                  isActive ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-xs font-mono text-rose-400 font-bold">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
