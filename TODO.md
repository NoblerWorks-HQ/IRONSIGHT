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
- [ ] 2026-10-11 check that Dependabot auto-closed its superseded PRs (#28, #30, #34-#40); close any that remain only if their bump is already in the lockfile.
- [ ] low - `npm audit` still shows 7 high, all build-time: braces <=3.0.3 (GHSA-vfj7-8cjw-p6xm, no patched release) via tailwindcss 3 + eslint-config-next. GitHub auto-dismissed it as dev-only. Only fix is tailwindcss 4 (major, styling pipeline change) - do it with the lint/flat-config work below.

## Refactor audit (2026-10-01) - found, not started

Read-only fleet audit (9 agents, nothing changed). Each line: effort S (<half day) / M (1-3 days) / L, and the risk of making the fix. 🔴 = a live bug or safety hole.

- [ ] 🟡 API response types defined twice (routes + panels) -> `src/lib/types/`; split `src/components/map/ConflictMap.tsx` (1,038, 18 `useEffect`) into one hook per feed layer. M, low-med.

## Open

_None tracked yet - add items as `- [ ] task`, grouped by priority or theme. Mark done inline: `- [x] ~~task~~ ✅ done YYYY-MM-DD`._

- [ ] Remove the leftover graphify tooling: `.claude/skills/graphify/` (10 files) + the two graphify PreToolUse hooks in `.claude/settings.json` (fleet rule: engineering-standards/repo-and-project-structure.md, "No knowledge-graph tooling"). The CLAUDE.md stub went 2026-09-30.
- [ ] `npm run lint` is `next lint`, which Next 16 removed - switch to `eslint .` with a flat config.
