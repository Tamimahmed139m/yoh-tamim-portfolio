import React, { useState, useEffect, useRef } from 'react';
import { Game } from '../../types/game';
import { PlayableEngineDispatcher } from './PlayableEngineDispatcher';
import { StorageService } from '../../services/storageService';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Play,
  AlertTriangle,
  Loader2,
  Gamepad2,
} from 'lucide-react';

interface GamePlayerProps {
  game: Game;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({ game, onFullscreenChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Track recently played
  useEffect(() => {
    StorageService.addRecentlyPlayed(game.id);
  }, [game.id]);

  // Simulate smooth loading screen
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [game.id, gameKey]);

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (onFullscreenChange) onFullscreenChange(fs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [onFullscreenChange]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback
    }
  };

  const handleRestart = () => {
    setGameKey(k => k + 1);
  };

  const renderGameContent = () => {
    return <PlayableEngineDispatcher game={game} gameKey={gameKey} />;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col ${
        isFullscreen ? 'h-screen w-screen rounded-none border-0' : 'aspect-16/10 min-h-[460px]'
      }`}
    >
      {/* Top Floating Player Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-neutral-950/90 via-neutral-950/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 text-xs font-semibold text-neutral-200">
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[180px]">{game.title}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-1 pointer-events-auto bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 rounded-lg p-0.5">
          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title={isPaused ? 'Resume Game' : 'Pause Game'}
            aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Restart Game"
            aria-label="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMuted(m => !m)}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Loading Screen */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-neutral-950 flex flex-col items-center justify-center p-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <span className="text-sm font-medium text-neutral-300 tracking-wide">Loading Game...</span>
            <span className="text-xs text-neutral-500 mt-1">Preparing canvas runtime</span>
          </div>
        )}

        {/* Error Fallback */}
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">Game couldn't be loaded</h4>
            <p className="text-xs text-neutral-400 mb-4 max-w-sm">
              We encountered an issue while initializing the game player runtime.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          renderGameContent()
        )}

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-30 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold text-white mb-2 font-heading">GAME PAUSED</h3>
            <p className="text-xs text-neutral-400 mb-4">Press resume to jump right back into the action</p>
            <button
              onClick={() => setIsPaused(false)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" /> Resume Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
