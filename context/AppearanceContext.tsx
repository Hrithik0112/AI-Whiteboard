'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { defaultAppearance, parseAppearance, type Appearance } from '@/lib/appearance';

const AppearanceContext = createContext<{
  appearance: Appearance;
  updateAppearance: (changes: Partial<Appearance>) => void;
  resetAppearance: () => void;
  ready: boolean;
  saved: boolean;
} | null>(null);

export function AppearanceProvider({ children, accountId = 'guest' }: { children: React.ReactNode; accountId?: string }) {
  const storageKey = `archflow:appearance:${accountId}`;
  const [appearance, setAppearance] = useState<Appearance>(defaultAppearance);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);

  const apply = useCallback((next: Appearance) => {
    document.documentElement.dataset.colorScheme = next.colorScheme;
    document.documentElement.dataset.font = next.font;
    setAppearance(next);
  }, []);

  useEffect(() => {
    try {
      apply(parseAppearance(JSON.parse(localStorage.getItem(storageKey) || '{}')));
      setSaved(true);
    } catch {
      apply(defaultAppearance);
      setSaved(false);
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      try { apply(parseAppearance(JSON.parse(event.newValue || '{}'))); setSaved(true); }
      catch { /* Ignore malformed data from another tab. */ }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [apply, storageKey]);

  const updateAppearance = (changes: Partial<Appearance>) => {
    const next = parseAppearance({ ...appearance, ...changes });
    apply(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return <AppearanceContext.Provider value={{ appearance, updateAppearance, resetAppearance: () => updateAppearance(defaultAppearance), ready, saved }}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
  return context;
}
