'use client';

import { useTheme } from '@/lib/theme-context';
import { ACCENT_PRESETS } from '@/lib/theme';

// Header control beside the THEATER toggle: one button cycles the accent preset
// (its swatch always shown, its name on wide screens and in the tooltip / accessible
// name), one flips light / dark mode. Kept narrow: the header has no spare width.
export default function ThemeSwitcher() {
  const { accent, mode, cycleAccent, toggleMode } = useTheme();
  const i = ACCENT_PRESETS.findIndex(p => p.id === accent);
  const current = ACCENT_PRESETS[i];
  const next = ACCENT_PRESETS[(i + 1) % ACCENT_PRESETS.length];
  const nextMode = mode === 'dark' ? 'light' : 'dark';

  const btn =
    'flex items-center gap-1 whitespace-nowrap text-[9px] font-bold tracking-[1px] px-2 text-(--text-secondary) hover:text-(--text-accent) transition-colors focus-visible:outline-1 focus-visible:outline-(--accent) focus-visible:-outline-offset-2';

  return (
    <div className="flex items-center shrink-0">
      <div className="flex items-center rounded-sm border border-(--border-color) overflow-hidden">
        <button
          type="button"
          onClick={cycleAccent}
          className={`${btn} py-1`}
          aria-label={`Accent colour: ${current.label}. Switch to ${next.label}`}
          title={`Accent ${current.label} (next: ${next.label})`}
        >
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-(--accent) ring-1 ring-(--border-color)" />
          <span className="text-(--text-accent) hidden min-[1800px]:inline">{current.label}</span>
        </button>
        <button
          type="button"
          onClick={toggleMode}
          className={`${btn} py-[5px] border-l border-(--border-color)`}
          aria-label={`Switch to ${nextMode} mode`}
          title={`Switch to ${nextMode} mode`}
        >
          {mode === 'dark' ? (
            // Moon: dark mode is on.
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            // Sun: light mode is on.
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
