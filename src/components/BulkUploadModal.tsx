import React, { useState } from 'react';
import { Game } from '../types/game';
import { slugify } from '../data/gamesCatalog';
import { generateGameThumbnail } from '../utils/thumbnailGenerator';
import { StorageService } from '../services/storageService';
import { playSound } from '../utils/audio';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
} from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'zip' | 'export'>('csv');
  const [rawText, setRawText] = useState('');
  const [parseResults, setParseResults] = useState<{
    parsed: Game[];
    errors: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Example CSV Template
  const SAMPLE_CSV = `title,category,rating,plays,description
Galactic Defender 3D,Action,4.9,850000,Defend deep-space colonies against robotic invader fleets.
Cyber Drift Tokyo,Racing,4.8,620000,Drift through neon highway interchanges in customized tuner cars.
Sweet Bakery Tycoon,Cooking,4.7,450000,Manage your dream dessert shop and serve gourmet cupcakes.
Royal Solitaire Deluxe,Solitaire,4.8,910000,Classic card sorting challenge with golden card backs.`;

  const handleValidateText = () => {
    if (!rawText.trim()) return;

    try {
      // 1. Try parsing JSON first
      if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
        const data = JSON.parse(rawText);
        const list = Array.isArray(data) ? data : [data];
        const validGames: Game[] = list.map((item, idx) => {
          const title = item.title || `Imported Game ${idx + 1}`;
          const category = item.category || 'Arcade';
          const slug = slugify(title);
          return {
            id: item.id || `bulk-json-${Date.now()}-${idx}`,
            title,
            slug,
            category,
            categories: [category],
            thumbnailUrl: item.thumbnailUrl || generateGameThumbnail(title, category),
            description: item.description || `Exciting ${category} browser game in ${title}.`,
            controls: item.controls || 'Mouse and Keyboard to play.',
            howToPlay: item.howToPlay || '1. Click Play. 2. Beat challenges.',
            gameUrl: `/games/${slug}/`,
            featured: Boolean(item.featured),
            popular: Boolean(item.popular),
            isNew: true,
            rating: Number(item.rating) || 4.8,
            plays: Number(item.plays) || 50000,
            dateAdded: new Date().toISOString().split('T')[0],
            playableType: item.playableType || 'coming-soon',
            tags: [category.toLowerCase(), 'browser-game'],
          };
        });

        setParseResults({ parsed: validGames, errors: [] });
        playSound('point');
        return;
      }

      // 2. Parse CSV
      const lines = rawText.trim().split('\n');
      if (lines.length < 2) {
        setParseResults({ parsed: [], errors: ['CSV must have header row + at least 1 game row.'] });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const parsed: Game[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Basic CSV split
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const title = values[headers.indexOf('title')] || values[0];
        const category = values[headers.indexOf('category')] || 'Arcade';
        const rating = Number(values[headers.indexOf('rating')]) || 4.7;
        const plays = Number(values[headers.indexOf('plays')]) || 35000;
        const description = values[headers.indexOf('description')] || `Exciting ${category} game.`;

        if (!title) {
          errors.push(`Row ${i + 1}: Missing game title.`);
          continue;
        }

        const slug = slugify(title);
        parsed.push({
          id: `bulk-csv-${Date.now()}-${i}`,
          title,
          slug,
          category,
          categories: [category],
          thumbnailUrl: generateGameThumbnail(title, category),
          description,
          controls: 'Mouse and Keyboard to play.',
          howToPlay: '1. Click to start. 2. Reach top score.',
          gameUrl: `/games/${slug}/`,
          featured: false,
          popular: false,
          isNew: true,
          rating,
          plays,
          dateAdded: new Date().toISOString().split('T')[0],
          playableType: 'coming-soon',
          tags: [category.toLowerCase(), 'browser-game'],
        });
      }

      setParseResults({ parsed, errors });
      playSound('point');
    } catch (err) {
      setParseResults({ parsed: [], errors: [`Parse error: ${(err as Error).message}`] });
      playSound('lose');
    }
  };

  const handleExecuteImport = () => {
    if (!parseResults || parseResults.parsed.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const added = StorageService.saveBulkGames(parseResults.parsed);
      setIsProcessing(false);
      setSuccessCount(added);
      playSound('win');
      onImportComplete();
      setTimeout(() => {
        setSuccessCount(null);
        setParseResults(null);
        setRawText('');
        onClose();
      }, 1500);
    }, 400);
  };

  const handleMultiZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newGames: Game[] = [];

    Array.from(files).forEach((file, idx) => {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const title = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      const slug = slugify(title);
      const category = title.toLowerCase().includes('car') || title.toLowerCase().includes('race')
        ? 'Racing'
        : title.toLowerCase().includes('puzzle')
        ? 'Puzzle'
        : 'Arcade';

      newGames.push({
        id: `batch-zip-${Date.now()}-${idx}`,
        title,
        slug,
        category,
        categories: [category],
        thumbnailUrl: generateGameThumbnail(title, category),
        description: `Verified HTML5 package for ${title}.`,
        controls: 'Mouse and touch to play.',
        howToPlay: '1. Click Play. 2. Enjoy instant HTML5 action.',
        gameUrl: `/games/${slug}/`,
        featured: false,
        popular: false,
        isNew: true,
        rating: 4.8,
        plays: 15000,
        dateAdded: new Date().toISOString().split('T')[0],
        playableType: 'uploaded',
        tags: [category.toLowerCase(), 'package-upload'],
      });
    });

    const added = StorageService.saveBulkGames(newGames);
    playSound('win');
    setSuccessCount(added);
    onImportComplete();
    setTimeout(() => {
      setSuccessCount(null);
      onClose();
    }, 1500);
  };

  const handleExportJSON = () => {
    const json = StorageService.exportCatalogJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nova-arcade-catalog-${Date.now()}.json`;
    link.click();
    playSound('point');
  };

  const handleExportCSV = () => {
    const csv = StorageService.exportCatalogCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nova-arcade-catalog-${Date.now()}.csv`;
    link.click();
    playSound('point');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Bulk Game Ingestion & Export Suite
              </h3>
              <p className="text-xs text-neutral-400">
                Import dozens of games simultaneously via CSV, JSON, or multiple ZIPs
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-4 pb-2 border-b border-neutral-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'csv'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV / JSON Import</span>
          </button>
          <button
            onClick={() => setActiveTab('zip')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'zip'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Multi-ZIP Ingestion</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Catalog</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {successCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3 text-emerald-300 text-xs animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-semibold">
                Success! Successfully imported {successCount} games into the live catalog!
              </span>
            </div>
          )}

          {/* TAB 1: CSV / JSON */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Paste CSV formatted rows or JSON array below:</span>
                <button
                  onClick={() => setRawText(SAMPLE_CSV)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Load Sample CSV
                </button>
              </div>

              <textarea
                rows={8}
                value={rawText}
                onChange={e => {
                  setRawText(e.target.value);
                  setParseResults(null);
                }}
                placeholder="title,category,rating,plays,description..."
                className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={handleValidateText}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700"
                >
                  Validate Data
                </button>

                {parseResults && parseResults.parsed.length > 0 && (
                  <button
                    onClick={handleExecuteImport}
                    disabled={isProcessing}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Import {parseResults.parsed.length} Games Now</span>
                  </button>
                )}
              </div>

              {parseResults && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Ready to import {parseResults.parsed.length} valid games</span>
                  </div>
                  {parseResults.errors.length > 0 && (
                    <div className="text-amber-400 space-y-1 pt-1">
                      {parseResults.errors.map((err, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MULTI-ZIP */}
          {activeTab === 'zip' && (
            <div className="p-8 rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-950/40 flex flex-col items-center justify-center text-center space-y-3">
              <UploadCloud className="w-12 h-12 text-teal-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Batch Upload Multiple Game Packages</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  Select multiple .zip or .html packages. The system will auto-extract titles, sanitize slugs, and create entries for each.
                </p>
              </div>
              <label className="cursor-pointer px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95">
                <span>Select Multiple Files (.zip, .html)</span>
                <input
                  type="file"
                  multiple
                  accept=".zip,.html,.htm"
                  onChange={handleMultiZipUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 3: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400 leading-relaxed">
                Download the complete active games catalog including titles, categories, ratings, play counts, and slugs.
                Perfect for database seeding, analytics, or backups.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleExportJSON}
                  className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500/50 flex flex-col items-center justify-center text-center space-y-2 hover:bg-neutral-850 transition-colors"
                >
                  <FileText className="w-7 h-7 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Export as JSON</span>
                  <span className="text-[11px] text-neutral-500">Structured data with array of objects</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 flex flex-col items-center justify-center text-center space-y-2 hover:bg-neutral-850 transition-colors"
                >
                  <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Export as CSV</span>
                  <span className="text-[11px] text-neutral-500">Comma-separated spreadsheet format</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
