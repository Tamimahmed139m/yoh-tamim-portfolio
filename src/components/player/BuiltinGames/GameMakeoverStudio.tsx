import React, { useState } from 'react';
import { playSound } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, Camera, Heart, RotateCcw } from 'lucide-react';

const HAIRSTYLES = ['Short Bob', 'Long Waves', 'High Ponytail', 'Bun & Bangs'];
const HAIR_COLORS = ['#382012', '#d97706', '#dc2626', '#e0e7ff', '#7c3aed'];
const OUTFITS = [
  { name: 'Royal Gown', color: '#db2777', emoji: '👗' },
  { name: 'Casual Chic', color: '#3b82f6', emoji: '👚' },
  { name: 'Summer Floral', color: '#10b981', emoji: '🥻' },
  { name: 'Party Sparkle', color: '#8b5cf6', emoji: '✨' },
];
const LIP_COLORS = ['#e11d48', '#be123c', '#f43f5e', '#ec4899', '#f97316'];
const ACCESSORIES = ['👑 Crown', '🎀 Ribbon', '💎 Necklace', '🕶️ Shades', '🌸 Flower'];

export const GameMakeoverStudio: React.FC<{ title?: string; onScoreUpdate?: (score: number) => void }> = ({
  title = 'Fashion Studio',
  onScoreUpdate,
}) => {
  const [hairIndex, setHairIndex] = useState(1);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [outfitIndex, setOutfitIndex] = useState(0);
  const [lipColor, setLipColor] = useState(LIP_COLORS[0]);
  const [accessory, setAccessory] = useState(ACCESSORIES[0]);
  const [activeTab, setActiveTab] = useState<'hair' | 'outfit' | 'lips' | 'accessory'>('hair');
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  const takeSnapshot = () => {
    playSound('win');
    confetti({ particleCount: 50, spread: 60 });
    setSnapshotTaken(true);
    if (onScoreUpdate) onScoreUpdate(500);
    setTimeout(() => setSnapshotTaken(false), 2000);
  };

  const resetLook = () => {
    playSound('slide');
    setHairIndex(1);
    setHairColor(HAIR_COLORS[0]);
    setOutfitIndex(0);
    setLipColor(LIP_COLORS[0]);
    setAccessory(ACCESSORIES[0]);
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-md mx-auto text-neutral-100 select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-neutral-400">Design your dream look & take photos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetLook}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={takeSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap Photo</span>
          </button>
        </div>
      </div>

      {/* Main Avatar Stage */}
      <div className="relative w-full aspect-square max-w-[340px] bg-gradient-to-b from-rose-950/40 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-between p-4">
        {/* Model Avatar Display */}
        <div className="relative flex-1 w-full flex items-center justify-center">
          {/* Avatar Base Silhouette & Face */}
          <div className="relative w-44 h-52 flex flex-col items-center justify-center">
            {/* Accessory Top */}
            <div className="absolute -top-3 z-30 text-2xl animate-in zoom-in-50">
              {accessory.split(' ')[0]}
            </div>

            {/* Hair */}
            <div
              className="absolute -top-1 w-28 h-20 rounded-t-full transition-colors z-10"
              style={{ backgroundColor: hairColor }}
            />

            {/* Face */}
            <div className="relative w-24 h-28 bg-[#fcd34d] rounded-3xl z-20 flex flex-col items-center justify-center border-2 border-[#f59e0b]/40 shadow-lg">
              {/* Eyes */}
              <div className="flex items-center justify-between w-14 mb-2">
                <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full" />
                <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full" />
              </div>
              {/* Blush */}
              <div className="flex items-center justify-between w-16 mb-2">
                <div className="w-3 h-1.5 bg-rose-400/50 rounded-full" />
                <div className="w-3 h-1.5 bg-rose-400/50 rounded-full" />
              </div>
              {/* Lips */}
              <div
                className="w-5 h-2 rounded-full transition-colors"
                style={{ backgroundColor: lipColor }}
              />
            </div>

            {/* Outfit */}
            <div
              className="absolute -bottom-4 w-32 h-24 rounded-t-3xl z-10 flex items-center justify-center text-3xl shadow-xl transition-colors"
              style={{ backgroundColor: OUTFITS[outfitIndex].color }}
            >
              <span className="opacity-90">{OUTFITS[outfitIndex].emoji}</span>
            </div>
          </div>

          {snapshotTaken && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-100 z-40">
              <span className="text-sm font-bold text-neutral-900 flex items-center gap-1">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Beautiful Snapshot Saved!
              </span>
            </div>
          )}
        </div>

        {/* Styling Category Tabs */}
        <div className="w-full flex items-center justify-center gap-1.5 pt-2 border-t border-neutral-800">
          {(['hair', 'outfit', 'lips', 'accessory'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Wardrobe Options Selector */}
        <div className="w-full pt-2 flex items-center justify-center gap-2 overflow-x-auto">
          {activeTab === 'hair' && (
            <>
              {HAIR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setHairColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    hairColor === c ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </>
          )}

          {activeTab === 'outfit' && (
            <>
              {OUTFITS.map((o, idx) => (
                <button
                  key={o.name}
                  onClick={() => setOutfitIndex(idx)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium border flex items-center gap-1 transition-all ${
                    outfitIndex === idx
                      ? 'bg-rose-500/20 border-rose-500 text-white'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>{o.emoji}</span>
                  <span>{o.name}</span>
                </button>
              ))}
            </>
          )}

          {activeTab === 'lips' && (
            <>
              {LIP_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setLipColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    lipColor === c ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </>
          )}

          {activeTab === 'accessory' && (
            <>
              {ACCESSORIES.map(acc => (
                <button
                  key={acc}
                  onClick={() => setAccessory(acc)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                    accessory === acc
                      ? 'bg-rose-500/20 border-rose-500 text-white'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
