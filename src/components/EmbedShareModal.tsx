import React, { useState } from 'react';
import { Game } from '../types/game';
import { playSound } from '../utils/audio';
import { X, Copy, Check, Code, QrCode, Share2 } from 'lucide-react';

interface EmbedShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

export const EmbedShareModal: React.FC<EmbedShareModalProps> = ({
  isOpen,
  onClose,
  game,
}) => {
  const [copiedType, setCopiedType] = useState<'link' | 'embed' | null>(null);
  const [embedWidth, setEmbedWidth] = useState('800');
  const [embedHeight, setEmbedHeight] = useState('600');

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const gamePageUrl = `${origin}/game/${game.slug}`;
  const embedCode = `<iframe src="${gamePageUrl}" width="${embedWidth}" height="${embedHeight}" frameborder="0" allowfullscreen allow="autoplay; fullscreen; gamepad"></iframe>`;

  // Quick SVG QR Code generator representation
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    gamePageUrl
  )}&bgcolor=090d16&color=38bdf8`;

  const copyToClipboard = async (text: string, type: 'link' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      playSound('point');
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-heading">
              Share & Embed: {game.title}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Direct Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 block">Game URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={gamePageUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 font-mono focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(gamePageUrl, 'link')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedType === 'link' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'link' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Embed iFrame Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                <span>Embed Code (for blogs, websites & forums)</span>
              </label>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>Size:</span>
                <input
                  type="text"
                  value={embedWidth}
                  onChange={e => setEmbedWidth(e.target.value)}
                  className="w-12 px-1 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-center font-mono"
                />
                <span>×</span>
                <input
                  type="text"
                  value={embedHeight}
                  onChange={e => setEmbedHeight(e.target.value)}
                  className="w-12 px-1 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-center font-mono"
                />
              </div>
            </div>

            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={embedCode}
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-400 focus:outline-none leading-relaxed"
              />
              <button
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="absolute right-2.5 bottom-2.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold border border-neutral-700 flex items-center gap-1 transition-colors"
              >
                {copiedType === 'embed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'embed' ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Mobile Instant QR Code Handover */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center gap-4">
            <img
              src={qrSvgUrl}
              alt="Game QR Code"
              className="w-20 h-20 rounded-xl bg-neutral-900 border border-neutral-800 p-1"
            />
            <div className="space-y-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-heading">
                <QrCode className="w-3.5 h-3.5 text-indigo-400" /> Play on Mobile Device
              </span>
              <p className="text-[11px] text-neutral-400 leading-snug">
                Scan this code with your smartphone camera to immediately play {game.title} on touchscreens with zero install.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
