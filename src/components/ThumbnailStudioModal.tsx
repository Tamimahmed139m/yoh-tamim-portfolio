import React, { useState } from 'react';
import { Game } from '../types/game';
import {
  buildCustomThumbnailSvg,
  ThumbnailConfig,
  CATEGORY_PALETTES,
} from '../utils/thumbnailGenerator';
import { StorageService } from '../services/storageService';
import { playSound } from '../utils/audio';
import {
  X,
  Sparkles,
  Download,
  Upload,
  Link2,
  Check,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';

interface ThumbnailStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  selectedGameId?: string;
  onThumbnailUpdated: () => void;
}

export const ThumbnailStudioModal: React.FC<ThumbnailStudioModalProps> = ({
  isOpen,
  onClose,
  games,
  selectedGameId,
  onThumbnailUpdated,
}) => {
  const initialGame = games.find(g => g.id === selectedGameId) || games[0];

  const [activeTab, setActiveTab] = useState<'designer' | 'upload' | 'url'>('designer');
  const [targetGameId, setTargetGameId] = useState(initialGame ? initialGame.id : '');
  const [config, setConfig] = useState<ThumbnailConfig>({
    title: initialGame ? initialGame.title : 'My Epic Game',
    category: initialGame ? initialGame.category : 'Arcade',
    colorA: '#6366f1',
    colorB: '#1e1b4b',
    pattern: 'grid',
    icon: 'gamepad',
    badge: 'HOT',
  });

  const [customDataUrl, setCustomDataUrl] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentSvgUrl = buildCustomThumbnailSvg(config);
  const previewUrl = activeTab === 'designer' ? currentSvgUrl : activeTab === 'upload' ? (customDataUrl || currentSvgUrl) : (customImageUrl || currentSvgUrl);

  const handleGameSelect = (gId: string) => {
    setTargetGameId(gId);
    const g = games.find(item => item.id === gId);
    if (g) {
      const palette = CATEGORY_PALETTES[g.category] || { a: '#6366f1', b: '#1e1b4b', icon: 'gamepad' };
      setConfig(prev => ({
        ...prev,
        title: g.title,
        category: g.category,
        colorA: palette.a,
        colorB: palette.b,
        icon: palette.icon,
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      setCustomDataUrl(result);
      playSound('point');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyToGame = () => {
    const g = games.find(item => item.id === targetGameId);
    if (!g) return;

    playSound('win');
    const updatedGame: Game = {
      ...g,
      thumbnailUrl: previewUrl,
      customThumbnailData: previewUrl,
    };
    StorageService.saveCustomGame(updatedGame);
    setSavedSuccess(true);
    onThumbnailUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `${config.title.toLowerCase().replace(/\s+/g, '-')}-thumbnail.svg`;
    link.href = previewUrl;
    link.click();
    playSound('point');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Thumbnail Studio & Manager
              </h3>
              <p className="text-xs text-neutral-400">
                Design custom vector thumbnails or upload custom graphic assets
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-y-auto">
          {/* Left Column: Live Preview & Destination Game */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Apply to Game:
              </label>
              <select
                value={targetGameId}
                onChange={e => handleGameSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {games.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Thumbnail Live Card Preview */}
            <div className="rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 p-2 shadow-xl aspect-4/3 flex items-center justify-center relative">
              <img
                src={previewUrl}
                alt="Thumbnail Preview"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyToGame}
                disabled={savedSuccess}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
                <span>{savedSuccess ? 'Applied!' : 'Save & Apply to Game'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 rounded-xl"
                title="Download SVG"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Tabbed Customization Controls */}
          <div className="md:col-span-7 space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
              <button
                onClick={() => setActiveTab('designer')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'designer' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Vector Studio</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'upload' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'url' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
            </div>

            {/* TAB 1: DESIGNER */}
            {activeTab === 'designer' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Title Text</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={e => setConfig({ ...config, title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Color Gradient A</label>
                    <input
                      type="color"
                      value={config.colorA}
                      onChange={e => setConfig({ ...config, colorA: e.target.value })}
                      className="w-full h-8 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Color Gradient B</label>
                    <input
                      type="color"
                      value={config.colorB}
                      onChange={e => setConfig({ ...config, colorB: e.target.value })}
                      className="w-full h-8 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Pattern</label>
                    <select
                      value={config.pattern}
                      onChange={e => setConfig({ ...config, pattern: e.target.value as ThumbnailConfig['pattern'] })}
                      className="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="grid">Grid Pattern</option>
                      <option value="circuit">Circuit Board</option>
                      <option value="hex">Hexagon Lattice</option>
                      <option value="dots">Modern Dots</option>
                      <option value="neon">Neon Waveform</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Central Icon</label>
                    <select
                      value={config.icon}
                      onChange={e => setConfig({ ...config, icon: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="gamepad">Gamepad</option>
                      <option value="car">Racing Car</option>
                      <option value="trophy">Sports Trophy</option>
                      <option value="puzzle">Puzzle Piece</option>
                      <option value="target">Bullseye Target</option>
                      <option value="sword">Action Sword</option>
                      <option value="sparkles">Magic Sparkles</option>
                      <option value="utensils">Cooking Chef</option>
                      <option value="zap">Lightning Bolt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Corner Badge Tag</label>
                  <input
                    type="text"
                    value={config.badge || ''}
                    onChange={e => setConfig({ ...config, badge: e.target.value })}
                    placeholder="e.g. 3D, HOT, NEW, PRO"
                    className="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD */}
            {activeTab === 'upload' && (
              <div className="p-6 rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-950/40 flex flex-col items-center justify-center text-center">
                <ImageIcon className="w-10 h-10 text-indigo-400 mb-2" />
                <span className="text-xs font-semibold text-white mb-1">
                  Upload Custom Image
                </span>
                <span className="text-[11px] text-neutral-500 mb-4">
                  Supports PNG, JPG, WebP, SVG (Recommended 400x300px)
                </span>
                <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* TAB 3: URL */}
            {activeTab === 'url' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Image Direct Web Address:
                </label>
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={e => setCustomImageUrl(e.target.value)}
                  placeholder="https://example.com/assets/game-thumbnail.webp"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
