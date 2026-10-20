# TODO

Working task list for **IRONSIGHT**. Read this at the start of a work session and keep it current as work completes - check items off with a date, add follow-ups as they surface. Stale TODOs are worse than none. Security debt (if any) is tracked separately in `SECURITY-DEBT.md`.

---

## Audit findings (2026-10-02)

Fleet audit follow-up. Fixed items landed on main 2026-10-02 (local only - this repo has no hosted deploy; push to publish).

- [x] 2026-10-02 high - Stored XSS from Telegram/RSS text in map popups (`src/components/map/ConflictMap.tsx`) - `esc()` at every bindPopup/bindTooltip/divIcon sink; regression tests in `tests/escape.test.mjs` (`npm test`).
- [x] 2026-10-02 high - README Docker quickstart failed on COPY of nonexistent `public/` (`Dockerfile:34`) - added `public/.gitkeep`; `docker build` verified.
- [x] 2026-10-02 low - `isConflictKey` accepted prototype keys (`src/lib/conflicts/index.ts:20`) - now `Object.hasOwn`.
- [x] 2026-10-02 low - Unbounded in-memory caches (`src/app/api/telegram/route.ts:28`, `src/app/api/drones/route.ts:45`) - capped at 5000 / 2000 entries, oldest evicted.
- [ ] medium - Telegram scraper sends ~20 t.me requests per channel per poll and caches no misses (`src/app/api/telegram/route.ts:80-94`) - memoize the whole response ~45s, cache negative probes briefly, lookahead ~5 with catch-up (effort M).
- [ ] low - Add CI: typecheck, `npm test`, `next build` and `docker build` on every push, so the README quickstart stays proven.

## Dependencies (2026-10-04)

- [x] 2026-10-04 Dependabot alerts 3 critical / 29 high / 14 medium / 2 low -> 0 open (`npm audit fix`, non-force, lockfile only: next 16.2.9 -> 16.3.8, sharp 0.35.5, postcss 8.5.23, xmldom, js-yaml, nanoid, ...). Build, tsc, `npm test`, `docker build` all pass. Pushed c22cbd4.
- [ ] 2026-10-28 Claude: triage the 2 new Dependabot alerts on main (1 high, 1 moderate; reported by the 2026-10-15 push): group by package; if the patch is already in range it is a relock (`npm update <pkg>`), else note the hold here with a recheck date.
- [x] 2026-10-11 check that Dependabot auto-closed its superseded PRs (#28, #30, #34-#40); close any that remain only if their bump is already in the lockfile. ✅ 2026-10-15: none had auto-closed; all 9 closed by hand after checking main's `package-lock.json` holds each target or newer (next 16.3.8, postcss 8.5.23, sharp 0.35.5, nanoid 3.3.19, browserslist 4.29.3, baseline-browser-mapping 2.11.27, js-yaml 4.3.2, xmldom 0.8.15, humanfs 0.16.8, postcss-selector-parser 6.1.4). Non-Dependabot PRs #1, #2, #20, #32, #41, #42 untouched.
- [ ] low - `npm audit` still shows 7 high, all build-time: braces <=3.0.3 (GHSA-vfj7-8cjw-p6xm, no patched release) via tailwindcss 3 + eslint-config-next. GitHub auto-dismissed it as dev-only. Only fix is tailwindcss 4 (major, styling pipeline change) - do it with the lint/flat-config work below.

## Refactor audit (2026-10-01) - found, not started

Read-only fleet audit (9 agents, nothing changed). Each line: effort S (<half day) / M (1-3 days) / L, and the risk of making the fix. 🔴 = a live bug or safety hole.

- [x] 2026-10-16 API response types defined once in `src/lib/types/api.ts` (type-only; routes, panels and the map import it; `tsc`, lint (18 warnings, unchanged) and `npm test` clean).
- [ ] Split `src/components/map/ConflictMap.tsx` (~900 lines, 18 `useEffect`) into one hook per feed layer. Deliberately NOT done 2026-10-16: no browser/map test exists, so identical behaviour cannot be proven. Needs a Leaflet smoke test (Playwright: markers per layer render from mocked `/api/*`) first. M, low-med.

## Open

_None tracked yet - add items as `- [ ] task`, grouped by priority or theme. Mark done inline: `- [x] ~~task~~ ✅ done YYYY-MM-DD`._

- [x] ✅ 2026-10-16 removed the leftover graphify tooling (`.claude/skills/graphify/`, the two PreToolUse hooks; `.claude/settings.json` held nothing else). `graphify-out/` stays in .gitignore as harmless.
- [x] ✅ 2026-10-14 removed unused devDependencies `@tailwindcss/postcss` (v4 plugin; `postcss.config.mjs` uses the v3 `tailwindcss` one) and `@tailwindcss/forms` (`tailwind.config.ts` has `plugins: []`); `next build` green.
- [x] ✅ 2026-10-10 `eslint .` + `eslint.config.mjs` (flat, eslint-config-next presets); lint now runs: 0 errors, 18 warnings (react-hooks, unused vars) left. Was: `npm run lint` is `next lint`, which Next 16 removed - switch to `eslint .` with a flat config.

## Relock loop (Dependabot alerts the loop cannot relock)

- [ ] 2026-10-20 relock (loop): source-map-js 1.2.1 -> 1.2.2 is IN RANGE but not relocked - no scripts/check-ci-local.mjs to verify it; by hand: cd . && npm update source-map-js --package-lock-only (Dependabot #64, high, runtime). <!-- relock:#64 -->
- [ ] 2026-10-20 relock (loop): postcss-selector-parser 6.1.4 -> 7.1.6 needs a RANGE CHANGE in ./package.json - postcss-nested wants ^6.1.1; tailwindcss wants ^6.1.2 (Dependabot #63, medium, development). <!-- relock:#63 -->
