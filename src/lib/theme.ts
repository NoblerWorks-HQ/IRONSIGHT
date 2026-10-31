// Colour themes: an accent preset (chrome only) and a light/dark mode.
// The colours themselves live in src/app/globals.css as [data-theme] / [data-mode]
// blocks on <html>; this module only knows the ids, labels and storage keys.
// tests/theme-contrast.test.mjs checks every preset in both modes for WCAG AA.

export const ACCENT_PRESETS = [
  { id: 'mono', label: 'MONO', swatch: '#ffffff' },
  { id: 'cyan', label: 'CYAN', swatch: '#00d4ff' },
  { id: 'amber', label: 'AMBER', swatch: '#e6cf7a' },
  { id: 'nvg', label: 'NVG', swatch: '#a6ff4d' },
  { id: 'red', label: 'RED', swatch: '#ff7a5c' },
  { id: 'violet', label: 'VIOLET', swatch: '#c3a6ff' },
  { id: 'ice', label: 'ICE', swatch: '#bfe9ff' },
] as const;

export type AccentId = (typeof ACCENT_PRESETS)[number]['id'];
export type ThemeMode = 'dark' | 'light';

export const DEFAULT_ACCENT: AccentId = 'mono';
export const DEFAULT_MODE: ThemeMode = 'dark';

export const ACCENT_STORAGE_KEY = 'ironsight-theme';
export const MODE_STORAGE_KEY = 'ironsight-mode';

export function isAccentId(v: unknown): v is AccentId {
  return typeof v === 'string' && ACCENT_PRESETS.some(p => p.id === v);
}

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === 'dark' || v === 'light';
}

/** Theme lives on <html>. The default accent and mode leave no attribute behind,
 *  so a visitor with nothing saved renders exactly the :root palette. */
export function applyAccent(accent: AccentId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (accent === DEFAULT_ACCENT) root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', accent);
}

export function applyMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === DEFAULT_MODE) root.removeAttribute('data-mode');
  else root.setAttribute('data-mode', mode);
}

/** Inline <head> script: applies the saved theme before hydration so there is no flash.
 *  Kept dependency-free and in step with applyAccent / applyMode above. */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('${ACCENT_STORAGE_KEY}');var m=localStorage.getItem('${MODE_STORAGE_KEY}');var ok=${JSON.stringify(ACCENT_PRESETS.map(p => p.id))};if(t&&t!=='${DEFAULT_ACCENT}'&&ok.indexOf(t)>-1)d.setAttribute('data-theme',t);if(m==='light')d.setAttribute('data-mode','light');}catch(e){}})();`;
