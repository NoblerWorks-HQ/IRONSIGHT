'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CONFLICTS, DEFAULT_CONFLICT, isConflictKey } from './index';
import type { ConflictConfig, ConflictKey } from './types';

const STORAGE_KEY = 'ironsight-conflict';

interface ConflictContextValue {
  key: ConflictKey;
  config: ConflictConfig;
  setConflict: (key: ConflictKey) => void;
  toggle: () => void;
  ready: boolean; // becomes true once the persisted choice has been read
}

const ConflictContext = createContext<ConflictContextValue | null>(null);

export function ConflictProvider({ children }: { children: React.ReactNode }) {
  // Always start from the default so server and first client render match
  // (avoids hydration mismatch); the persisted choice is applied in an effect.
  const [key, setKey] = useState<ConflictKey>(DEFAULT_CONFLICT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isConflictKey(stored) && stored !== key) setKey(stored);
    } catch {
      // localStorage unavailable — stay on default
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setConflict = useCallback((next: ConflictKey) => {
    setKey(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => {
    setKey(prev => {
      const next: ConflictKey = prev === 'iran-israel' ? 'russia-ukraine' : 'iran-israel';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const value: ConflictContextValue = {
    key,
    config: CONFLICTS[key],
    setConflict,
    toggle,
    ready,
  };

  return <ConflictContext.Provider value={value}>{children}</ConflictContext.Provider>;
}

export function useConflict(): ConflictContextValue {
  const ctx = useContext(ConflictContext);
  if (!ctx) throw new Error('useConflict must be used within a ConflictProvider');
  return ctx;
}
