'use client';

import { useConflict } from '@/lib/conflicts/context';
import { CONFLICT_KEYS, CONFLICTS } from '@/lib/conflicts';

// Segmented control that flips the whole dashboard between conflicts.
export default function ConflictToggle() {
  const { key, setConflict } = useConflict();

  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] text-[var(--text-secondary)] tracking-[2px] hidden md:inline">
        THEATER
      </span>
      <div className="flex items-center rounded border border-[var(--border-color)] overflow-hidden">
        {CONFLICT_KEYS.map(k => {
          const active = k === key;
          return (
            <button
              key={k}
              onClick={() => setConflict(k)}
              className="text-[9px] font-bold tracking-[1px] px-2 py-1 transition-colors"
              style={{
                color: active ? '#0a0e17' : 'var(--text-secondary)',
                background: active ? 'var(--cyan)' : 'transparent',
              }}
              title={`Switch dashboard to ${CONFLICTS[k].label}`}
            >
              {CONFLICTS[k].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
