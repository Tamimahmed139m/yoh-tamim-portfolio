import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Game, GameCategory } from './types/game';
import { StorageService } from './services/storageService';
import { getCategoriesWithCounts } from './data/gamesCatalog';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { AchievementsModal } from './components/AchievementsModal';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { PopularPage } from './pages/PopularPage';
import { AdminAuthGate } from './components/AdminAuthGate';
import { fetchSupabaseGames } from './services/supabaseGameService';

export default function App() {
  // Current Route State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  // Games Catalog State (merged with custom admin additions)
  const [games, setGames] = useState<Game[]>(() => StorageService.getAllGames());
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());
  const [recentPlays, setRecentPlays] = useState(() => StorageService.getRecentlyPlayed());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  // Load cloud games when Supabase is configured. Local catalog remains the fallback.
  useEffect(() => {
    let cancelled = false;
    fetchSupabaseGames().then(cloudGames => {
      if (cancelled || cloudGames.length === 0) return;
      setGames(current => {
        const byId = new Map(current.map(game => [game.id, game]));
        cloudGames.forEach(game => byId.set(game.id, game));
        return Array.from(byId.values());
      });
    });
    return () => { cancelled = true; };
  }, []);

  // Initialize theme
  useEffect(() => {
    const theme = StorageService.getTheme();
    StorageService.setTheme(theme);
  }, []);

  // Listen for storage events across components
  useEffect(() => {
    const handleFavUpdated = () => {
      setFavorites(StorageService.getFavorites());
    };
    const handleRecentUpdated = () => {
      setRecentPlays(StorageService.getRecentlyPlayed());
    };
    const handleCatalogUpdated = () => {
      setGames(StorageService.getAllGames());
    };
    const handleOpenSearchModal = () => {
      setIsSearchOpen(true);
    };

    window.addEventListener('favorites-updated', handleFavUpdated);
    window.addEventListener('recently-played-updated', handleRecentUpdated);
    window.addEventListener('catalog-updated', handleCatalogUpdated);
    window.addEventListener('open-search-modal', handleOpenSearchModal);

    return () => {
      window.removeEventListener('favorites-updated', handleFavUpdated);
      window.removeEventListener('recently-played-updated', handleRecentUpdated);
      window.removeEventListener('catalog-updated', handleCatalogUpdated);
      window.removeEventListener('open-search-modal', handleOpenSearchModal);
    };
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Safe navigation helper
  const navigate = useCallback((path: string) => {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Categories computed with accurate game counts
  const categories: GameCategory[] = useMemo(() => {
    return getCategoriesWithCounts(games);
  }, [games]);

  // Map recently played IDs to Game objects
  const recentlyPlayedGames = useMemo(() => {
    return recentPlays
      .map(r => games.find(g => g.id === r.gameId))
      .filter((g): g is Game => Boolean(g));
  }, [recentPlays, games]);

  const handleSelectGame = useCallback((game: Game) => {
    navigate(`/game/${game.slug}`);
  }, [navigate]);

  const handleToggleFavorite = useCallback((gameId: string) => {
    StorageService.toggleFavorite(gameId);
  }, []);

  // Resolve Route
  const renderCurrentPage = () => {
    // 1. Game Detail: /game/:slug
    if (currentPath.startsWith('/game/')) {
      const slug = currentPath.replace('/game/', '').replace(/\/$/, '');
      const game = games.find(g => g.slug === slug || g.id === slug);

      if (game) {
        return (
          <GameDetailsPage
            game={game}
            allGames={games}
            favorites={favorites}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={navigate}
          />
        );
      } else {
        // Fallback if slug not found
        return (
          <div className="max-w-xl mx-auto py-24 text-center px-4">
            <h2 className="text-2xl font-bold text-white mb-2 font-heading">Game Not Found</h2>
            <p className="text-xs text-neutral-400 mb-6">
              The game you are looking for does not exist in the current catalog.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              Return Home
            </button>
          </div>
        );
      }
    }

    // 2. Category Detail: /categories/:slug
    if (currentPath.startsWith('/categories/') && currentPath !== '/categories') {
      const catSlug = currentPath.replace('/categories/', '').replace(/\/$/, '');
      return (
        <CategoryDetailPage
          categorySlug={catSlug}
          categories={categories}
          allGames={games}
          favorites={favorites}
          onSelectGame={handleSelectGame}
          onToggleFavorite={handleToggleFavorite}
          onBackToCategories={() => navigate('/categories')}
        />
      );
    }

    // 3. Static Pages
    switch (currentPath) {
      case '/games':
        return (
          <GamesPage
            games={games}
            categories={categories}
            favorites={favorites}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
          />
        );

      case '/categories':
        return (
          <CategoriesPage
            categories={categories}
            onSelectCategory={catName => navigate(`/categories/${catName.toLowerCase()}`)}
          />
        );

      case '/popular':
        return (
          <PopularPage
            games={games}
            favorites={favorites}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
          />
        );

      case '/favorites':
        return (
          <FavoritesPage
            allGames={games}
            favorites={favorites}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onExplore={() => navigate('/games')}
          />
        );

      case '/admin':
        return (
          <AdminAuthGate
            games={games}
            categories={categories}
            favoritesCount={favorites.length}
            onRefreshCatalog={() => setGames(StorageService.getAllGames())}
          />
        );

      case '/':
      default:
        return (
          <HomePage
            games={games}
            categories={categories}
            favorites={favorites}
            recentlyPlayed={recentlyPlayedGames}
            onSelectGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Header Contract */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        favoritesCount={favorites.length}
      />

      {/* Main Routed Content Area */}
      <main className="flex-1 w-full">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigate} />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        games={games}
        onSelectGame={handleSelectGame}
      />

      {/* Player Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />
    </div>
  );
}
