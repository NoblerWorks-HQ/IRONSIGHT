// Conflict registry — single source of truth for which conflicts exist.
// Plain TS (server + client safe). The React context lives in ./context.

import type { ConflictConfig, ConflictKey } from './types';
import { iranIsrael } from './iran-israel';
import { russiaUkraine } from './russia-ukraine';

export * from './types';

export const CONFLICTS: Record<ConflictKey, ConflictConfig> = {
  'iran-israel': iranIsrael,
  'russia-ukraine': russiaUkraine,
};

export const DEFAULT_CONFLICT: ConflictKey = 'iran-israel';

export const CONFLICT_KEYS = Object.keys(CONFLICTS) as ConflictKey[];

export function isConflictKey(v: unknown): v is ConflictKey {
  return typeof v === 'string' && v in CONFLICTS;
}

// Resolve a (possibly untrusted) key to a config, falling back to the default.
export function getConflict(key: string | null | undefined): ConflictConfig {
  return isConflictKey(key) ? CONFLICTS[key] : CONFLICTS[DEFAULT_CONFLICT];
}

// Server helper: pull the conflict config from a request's ?conflict= param.
export function getConflictFromRequest(req: { url: string }): ConflictConfig {
  try {
    const key = new URL(req.url).searchParams.get('conflict');
    return getConflict(key);
  } catch {
    return CONFLICTS[DEFAULT_CONFLICT];
  }
}
