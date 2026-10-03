import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { StorageService } from '../services/storageService';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => StorageService.getTheme());

  useEffect(() => {
    StorageService.setTheme(theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-neutral-400 hover:text-white dark:hover:text-white hover:bg-neutral-800/60 dark:hover:bg-neutral-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
    </button>
  );
};
