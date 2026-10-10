// Flat config (2026-10-10): Next 16 removed `next lint`, so `npm run lint` is
// plain ESLint over eslint-config-next's flat presets.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'graphify-out/**']),
]);
