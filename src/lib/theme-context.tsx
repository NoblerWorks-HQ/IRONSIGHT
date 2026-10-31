'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ACCENT_PRESETS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  MODE_STORAGE_KEY,
  applyAccent,
  applyMode,
  isAccentId,
  type AccentId,
  type ThemeMode,
} from './theme';

interface ThemeContextValue {
  accent: AccentId;
  mode: ThemeMode;
  cycleAccent: () => void;
  setAccent: (accent: AccentId) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable: theme lasts this visit */ }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start from the defaults so server and first client render match. The real
  // theme is already on <html> (THEME_INIT_SCRIPT), so only the switcher's label
  // catches up after mount, never the page colours. The DOM is written only by
  // the user actions below, so this sync can never flash the default back in.
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  useEffect(() => {
    const root = document.documentElement;
    const t = root.getAttribute('data-theme');
    // Post-hydration sync with the attributes the inline script set: setState here is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAccentId(t)) setAccentState(t);
    if (root.getAttribute('data-mode') === 'light') setModeState('light');
  }, []);

  const setAccent = useCallback((next: AccentId) => {
    setAccentState(next);
    applyAccent(next);
    save(ACCENT_STORAGE_KEY, next);
  }, []);

  const cycleAccent = useCallback(() => {
    setAccentState(prev => {
      const i = ACCENT_PRESETS.findIndex(p => p.id === prev);
      const next = ACCENT_PRESETS[(i + 1) % ACCENT_PRESETS.length].id;
      applyAccent(next);
      save(ACCENT_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      applyMode(next);
      save(MODE_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ accent, mode, cycleAccent, setAccent, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
