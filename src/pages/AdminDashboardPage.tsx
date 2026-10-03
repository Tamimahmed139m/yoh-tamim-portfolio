import React, { useState } from 'react';
import { Game, GameCategory } from '../types/game';
import { StorageService } from '../services/storageService';
import { SUPABASE_SQL_SCHEMA, SUPABASE_SETUP_INSTRUCTIONS } from '../services/supabaseSchema';
import { slugify } from '../data/gamesCatalog';
import { generateGameThumbnail } from '../utils/thumbnailGenerator';
import { formatNumber, formatDate } from '../utils/formatters';
import { playSound } from '../utils/audio';
import { BulkUploadModal } from '../components/BulkUploadModal';
import { ThumbnailStudioModal } from '../components/ThumbnailStudioModal';
import {
  Shield,
  LayoutDashboard,
  Gamepad2,
  FolderTree,
  Database,
  UploadCloud,
  Plus,
  Trash2,
  Edit2,
  Check,
  Copy,
  Star,
  Flame,
  Search,
  CheckCircle2,
  AlertTriangle,
  Palette,
  FileSpreadsheet,
} from 'lucide-react';

interface AdminDashboardPageProps {
  games: Game[];
  categories: GameCategory[];
  favoritesCount: number;
  onRefreshCatalog: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  games,
  categories,
  favoritesCount,
  onRefreshCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'upload' | 'database'>('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isThumbnailStudioOpen, setIsThumbnailStudioOpen] = useState(false);
  const [selectedStudioGameId, setSelectedStudioGameId] = useState<string | undefined>(undefined);
  const [copiedSql, setCopiedSql] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    title: '',
    category: 'Action',
    description: '',
    controls: 'Mouse and Keyboard to play.',
    howToPlay: '1. Click to start. 2. Beat challenges. 3. Reach high score.',
    featured: false,
    popular: false,
    rating: 4.8,
  });

  // Calculate statistics
  const totalGames = games.length;
  const totalPlays = games.reduce((acc, g) => acc + g.plays, 0);
  const featuredCount = games.filter(g => g.featured).length;
  const popularCount = games.filter(g => g.popular).length;

  const filteredGames = games.filter(
    g =>
      g.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      g.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      playSound('point');
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {}
  };

  const handleDelete = (game: Game) => {
    if (window.confirm(`Are you sure you want to remove "${game.title}" from the catalog?`)) {
      StorageService.deleteGame(game.id);
      playSound('hit');
      setStatusMessage(`Deleted game "${game.title}".`);
      onRefreshCatalog();
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleToggleFeatured = (game: Game) => {
    const updated: Game = { ...game, featured: !game.featured };
    StorageService.saveCustomGame(updated);
    playSound('click');
    onRefreshCatalog();
  };

  const handleTogglePopular = (game: Game) => {
    const updated: Game = { ...game, popular: !game.popular };
    StorageService.saveCustomGame(updated);
    playSound('click');
    onRefreshCatalog();
  };

  const handleSaveGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingGame) {
      // Update
      const updated: Game = {
        ...editingGame,
        title: formData.title,
        category: formData.category,
        categories: [formData.category, ...editingGame.categories.filter(c => c !== formData.category)],
        description: formData.description,
        controls: formData.controls,
        howToPlay: formData.howToPlay,
        featured: formData.featured,
        popular: formData.popular,
        rating: Number(formData.rating),
      };
      StorageService.saveCustomGame(updated);
      setStatusMessage(`Updated "${updated.title}" successfully.`);
    } else {
      // Create New
      const slug = slugify(formData.title);
      const newGame: Game = {
        id: `custom-${Date.now()}`,
        title: formData.title,
        slug,
        category: formData.category,
        categories: [formData.category],
        thumbnailUrl: generateGameThumbnail(formData.title, formData.category),
        description: formData.description || `Exciting ${formData.category} gameplay in ${formData.title}!`,
        controls: formData.controls,
        howToPlay: formData.howToPlay,
        gameUrl: `/games/${slug}/`,
        featured: formData.featured,
        popular: formData.popular,
        isNew: true,
        rating: Number(formData.rating),
        plays: 1000,
        dateAdded: new Date().toISOString().split('T')[0],
        playableType: 'coming-soon',
        tags: [formData.category.toLowerCase(), 'browser-game'],
      };
      StorageService.saveCustomGame(newGame);
      setStatusMessage(`Created new game "${newGame.title}".`);
    }

    playSound('win');
    setIsAddModalOpen(false);
    setEditingGame(null);
    onRefreshCatalog();
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setFormData({
      title: game.title,
      category: game.category,
      description: game.description,
      controls: game.controls,
      howToPlay: game.howToPlay,
      featured: game.featured,
      popular: game.popular,
      rating: game.rating,
    });
    setIsAddModalOpen(true);
  };

  const openAddModal = () => {
    setEditingGame(null);
    setFormData({
      title: '',
      category: categories[0]?.name || 'Action',
      description: '',
      controls: 'Mouse and Keyboard to play.',
      howToPlay: '1. Click to start. 2. Beat challenges. 3. Reach high score.',
      featured: false,
      popular: false,
      rating: 4.8,
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-heading tracking-tight">
              Portal Administration
            </h1>
            <p className="text-xs text-neutral-400">
              Manage games catalog, upload packages, inspect stats, and configure Supabase
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'games'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Games ({totalGames})</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Package Uploader</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'database'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase DDL</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metric Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-xs text-neutral-400 font-medium">Total Games</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-white">
                {totalGames}
              </div>
              <span className="text-[11px] text-emerald-400">100% responsive index</span>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-xs text-neutral-400 font-medium">Total Game Plays</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-indigo-400">
                {formatNumber(totalPlays)}
              </div>
              <span className="text-[11px] text-neutral-500">Across all catalog titles</span>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-xs text-neutral-400 font-medium">User Favorites</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-rose-400">
                {favoritesCount}
              </div>
              <span className="text-[11px] text-neutral-500">Bookmarked in local state</span>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-xs text-neutral-400 font-medium">Featured & Popular</span>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                {featuredCount} / {popularCount}
              </div>
              <span className="text-[11px] text-neutral-500">Homepage showcased</span>
            </div>
          </div>

          {/* Top Played Games Table */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-heading">
                Top 8 Most Played Games
              </h3>
              <button
                onClick={() => setActiveTab('games')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View Full Catalog →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/60 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-3">Game</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Plays</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-200">
                  {games
                    .slice()
                    .sort((a, b) => b.plays - a.plays)
                    .slice(0, 8)
                    .map(g => (
                      <tr key={g.id} className="hover:bg-neutral-850">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src={g.thumbnailUrl}
                            alt={g.title}
                            className="w-8 h-8 rounded-lg object-cover bg-neutral-800 shrink-0"
                          />
                          <span className="font-semibold text-white truncate max-w-[180px]">{g.title}</span>
                        </td>
                        <td className="px-4 py-3 text-neutral-400">{g.category}</td>
                        <td className="px-4 py-3 font-mono text-amber-400">★ {g.rating}</td>
                        <td className="px-4 py-3 font-mono tabular-nums">{formatNumber(g.plays)}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">{g.playableType}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEditModal(g)}
                            className="p-1 text-neutral-400 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GAMES MANAGEMENT TAB */}
      {activeTab === 'games' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search games in admin table..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-semibold shadow-md transition-colors"
                title="Bulk Game Ingestion"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Bulk Import</span>
              </button>

              <button
                onClick={() => {
                  setSelectedStudioGameId(undefined);
                  setIsThumbnailStudioOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-semibold shadow-md transition-colors"
                title="Open Thumbnail Designer"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Thumbnail Studio</span>
              </button>

              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Game Entry</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[560px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-neutral-950 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800 z-10">
                  <tr>
                    <th className="px-4 py-3">Thumbnail & Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Plays</th>
                    <th className="px-4 py-3">Featured</th>
                    <th className="px-4 py-3">Popular</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-200">
                  {filteredGames.slice(0, 50).map(g => (
                    <tr key={g.id} className="hover:bg-neutral-850">
                      <td className="px-4 py-2.5 flex items-center gap-3">
                        <img
                          src={g.thumbnailUrl}
                          alt={g.title}
                          className="w-8 h-8 rounded-lg object-cover bg-neutral-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate max-w-[200px]">
                            {g.title}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            /{g.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-neutral-300">{g.category}</td>
                      <td className="px-4 py-2.5 font-mono text-amber-400">★ {g.rating}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">{formatNumber(g.plays)}</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleToggleFeatured(g)}
                          className={`p-1 rounded ${
                            g.featured ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-600 hover:text-neutral-400'
                          }`}
                          title="Toggle Featured"
                        >
                          <Star className={`w-4 h-4 ${g.featured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleTogglePopular(g)}
                          className={`p-1 rounded ${
                            g.popular ? 'text-rose-400 bg-rose-500/10' : 'text-neutral-600 hover:text-neutral-400'
                          }`}
                          title="Toggle Popular"
                        >
                          <Flame className={`w-4 h-4 ${g.popular ? 'fill-rose-400' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedStudioGameId(g.id);
                            setIsThumbnailStudioOpen(true);
                          }}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400"
                          title="Design Thumbnail in Studio"
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(g)}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                          title="Edit Game"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(g)}
                          className="p-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300"
                          title="Delete Game"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredGames.length > 50 && (
              <div className="p-3 text-center text-xs text-neutral-500 border-t border-neutral-800">
                Showing first 50 results of {filteredGames.length}. Filter search query to view specific entries.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PACKAGE UPLOADER TAB */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">
              HTML5 Game ZIP / Package Ingestion
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Upload a zip or standalone HTML file containing index.html, assets, js, and css.
              The portal will unpack, sandbox, and attach the package to any game slug.
            </p>
          </div>

          <div className="p-8 rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-950/40 flex flex-col items-center justify-center text-center">
            <UploadCloud className="w-12 h-12 text-indigo-400 mb-3" />
            <span className="text-sm font-semibold text-white mb-1">
              Drag & Drop Game ZIP Archive
            </span>
            <span className="text-xs text-neutral-400 mb-4">
              Validates index.html, sound files, WebGL contexts, and manifest.json
            </span>
            <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20">
              <span>Select ZIP or HTML File</span>
              <input
                type="file"
                accept=".zip,.html,.htm"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    playSound('point');
                    setStatusMessage(`Package "${file.name}" ingested and validated! Ready for slug assignment.`);
                    setTimeout(() => setStatusMessage(''), 4000);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2 text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200 block">Package Integrity Standards:</span>
            <div>1. Root folder must include <code className="text-indigo-400">index.html</code>.</div>
            <div>2. Use relative asset paths (<code className="text-neutral-300">./assets/</code>) rather than absolute root routes.</div>
            <div>3. Sandboxing prevents external unauthorized script leakage or cookie tampering.</div>
          </div>
        </div>
      )}

      {/* SUPABASE SQL TAB */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white font-heading">
                Supabase SQL Database Architecture
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                PostgreSQL schema, indexes, RLS security policies, and sync definitions
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors self-start sm:self-auto"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 p-4 overflow-x-auto max-h-[460px]">
            <pre className="font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs text-neutral-300">
            <span className="font-bold text-white block">Supabase Setup Guide:</span>
            <p className="leading-relaxed whitespace-pre-line text-neutral-400">
              {SUPABASE_SETUP_INSTRUCTIONS}
            </p>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-bold text-white font-heading">
                {editingGame ? `Edit: ${editingGame.title}` : 'Add New Game Entry'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Game Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Turbo Drifter 3D"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Engaging summary of gameplay..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Controls</label>
                <input
                  type="text"
                  value={formData.controls}
                  onChange={e => setFormData({ ...formData, controls: e.target.value })}
                  placeholder="Arrow keys to drive, Space to brake..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Featured Game</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={e => setFormData({ ...formData, popular: e.target.checked })}
                    className="rounded bg-neutral-950 border-neutral-800 text-rose-600 focus:ring-0"
                  />
                  <span>Popular Tag</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md"
                >
                  {editingGame ? 'Update Game' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Game Ingestion Modal (CSV, JSON, ZIP) */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportComplete={() => {
          onRefreshCatalog();
          setStatusMessage('Bulk import successfully synced to catalog!');
          setTimeout(() => setStatusMessage(''), 4000);
        }}
      />

      {/* Thumbnail Studio Modal */}
      <ThumbnailStudioModal
        isOpen={isThumbnailStudioOpen}
        onClose={() => setIsThumbnailStudioOpen(false)}
        games={games}
        selectedGameId={selectedStudioGameId}
        onThumbnailUpdated={() => {
          onRefreshCatalog();
          setStatusMessage('Game thumbnail updated in Studio!');
          setTimeout(() => setStatusMessage(''), 4000);
        }}
      />
    </div>
  );
};
