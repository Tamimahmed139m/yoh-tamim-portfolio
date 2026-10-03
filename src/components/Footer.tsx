import React from 'react';
import { Gamepad2, Heart, Shield, Code, Sparkles, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-neutral-950 border-t border-neutral-800/80 text-neutral-400 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <span className="font-heading text-lg font-bold text-white tracking-tight">
                NovaArcade
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your premier portal for instant HTML5 web gaming. Play hundreds of curated browser games with no downloads, zero installs, and smooth performance on desktop, tablet, and mobile.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3">
              Explore Games
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/games')} className="hover:text-white transition-colors">
                  All 330+ Games
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/popular')} className="hover:text-white transition-colors">
                  Most Played Games
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/categories')} className="hover:text-white transition-colors">
                  Game Categories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/favorites')} className="hover:text-white transition-colors">
                  Saved Favorites
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3">
              Top Genres
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/categories/puzzle')} className="hover:text-white transition-colors">
                  Puzzle & Logic
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/categories/action')} className="hover:text-white transition-colors">
                  Action & Adventure
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/categories/racing')} className="hover:text-white transition-colors">
                  Racing & Cars
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/categories/solitaire')} className="hover:text-white transition-colors">
                  Solitaire & Cards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/categories/sports')} className="hover:text-white transition-colors">
                  Sports & Football
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Legal */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3">
              Platform & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/admin')} className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Admin Dashboard</span>
                  <span className="text-[10px] text-indigo-400 font-mono">SQL</span>
                </button>
              </li>
              <li>
                <span className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                  DMCA / Copyright Compliance
                </span>
              </li>
              <li>
                <span className="text-neutral-500 hover:text-neutral-300 cursor-pointer">
                  Developer Submissions
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2026 NovaArcade. All rights reserved.</p>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Responsive HTML5 Canvas & WebGL Engine</span>
            <span aria-hidden="true">·</span>
            <span>Supabase Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
