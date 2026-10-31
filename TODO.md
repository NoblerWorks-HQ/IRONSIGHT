# TODO

Working task list for **IRONSIGHT**. Read this at the start of a work session and keep it current as work completes - check items off with a date, add follow-ups as they surface. Stale TODOs are worse than none. Security debt (if any) is tracked separately in `SECURITY-DEBT.md`.

---

## Community backlog (2026-10-27)

- [x] 2026-10-31 Patrick ordered every open PR cleared: #32 #41 #43 landed on main, #1 #2 #20 #42 closed with reasons.

- [ ] 2026-11-02 needs Patrick: post the issue close note for #7 and triage replies (#5 #6 #9 #23 #24) from `/home/plw/.cache/ironsight-community-replies-2026-10-28.md`; close #25 + #26 as fixed by #43 (a6764b0) - #8 auto-closed.
- [x] 2026-10-31 Dependabot #44-#51 #54 cleared: in-range + xmldom 0.9, ESLint 10, TS 7 (tsc via @typescript/native), Tailwind 4 landed; @types/node held at 22 to match the Node 22 runtime (moved to 24 with the runtime the same day).
- [ ] 2026-11-30: re-check typescript-eslint TS 7 support (typescript-eslint#10940); when released, drop the `typescript` -> @typescript/typescript6 alias.
- [x] 2026-10-31 Node 24: `.nvmrc`, Dockerfile (`node:24-alpine`), CI and `@types/node` ^24 moved together. Node 26 is planned for ~spring 2027, once native modules support it.
- [ ] low - Map basemap: CARTO dark tiles now need an API key and render a KEY REQUIRED watermark (seen 2026-10-31); drop or replace them as WarGames did.
- [ ] Link check #53: README alerts.com.ua is 404; `site/404.html` root-relative links are a lychee false positive (needs a root dir). Close #52 as superseded.


## Domain (2026-10-21)

- [x] 2026-10-21 Site moved to `ironsight.noblerworks.com` (Route 53 CNAME, NW); `/IRONSIGHT/` base paths removed from `site/`.
- [ ] 2026-11-01 (moved from 10-28 by Pat) Patrick: Search Console `sc-domain:noblerworks.com` -> submit `https://ironsight.noblerworks.com/sitemap.xml`.

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
- [x] 2026-10-28 triage the 2 Dependabot alerts from the 10-15 push ✅ 2026-10-28 0 open: #64 source-map-js fixed 10-22, #63 postcss-selector-parser withdrawn by GitHub.
- [x] 2026-10-11 check that Dependabot auto-closed its superseded PRs (#28, #30, #34-#40); close any that remain only if their bump is already in the lockfile. ✅ 2026-10-15: none had auto-closed; all 9 closed by hand after checking main's `package-lock.json` holds each target or newer (next 16.3.8, postcss 8.5.23, sharp 0.35.5, nanoid 3.3.19, browserslist 4.29.3, baseline-browser-mapping 2.11.27, js-yaml 4.3.2, xmldom 0.8.15, humanfs 0.16.8, postcss-selector-parser 6.1.4). Non-Dependabot PRs #1, #2, #20, #32, #41, #42 untouched.
- [x] 2026-10-31 Tailwind 4 landed; braces gone. Left: minimatch <11.0.1 moderate via eslint-config-next's plugins (upstream). Was: `npm audit` still shows 7 high, all build-time: braces <=3.0.3 (GHSA-vfj7-8cjw-p6xm, no patched release) via tailwindcss 3 + eslint-config-next. GitHub auto-dismissed it as dev-only. Only fix is tailwindcss 4 (major, styling pipeline change) - do it with the lint/flat-config work below.

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

- [x] ~~2026-10-20 relock: source-map-js 1.2.1 -> 1.2.2 (Dependabot #64)~~ ✅ 2026-10-22 relocked; test + lint (0 errors) + build pass <!-- relock:#64 -->
- [x] 2026-10-20 relock (loop): postcss-selector-parser 6.1.4 -> 7.1.6 (#63) ✅ 2026-10-28 held, no override: tailwind 3 + postcss-nested need ^6; advisory withdrawn (410). <!-- relock:#63 -->

## Code mismatches found by the docs pass (2026-10-30) - [FEATURES.md](docs/FEATURES.md)
- [ ] `src/app/page.tsx` footer names GDELT/OPENSKY/OCHA feeds no route uses, and shows polling "5s / 2m / 5m" (real: 15 s / 90 s / 10 min)
- [ ] Iran/Israel clock labelled "MSK" uses `Asia/Shanghai` with a China flag
- [ ] Header THREAT LEVEL is hard-coded "ELEVATED"
