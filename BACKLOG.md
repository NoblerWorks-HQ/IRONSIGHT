# Backlog

> Open items with no date and no owner action. **Still open, not archived.** Give an item a leading `YYYY-MM-DD`
> and the todo-budget hook moves it back to `TODO.md`. Fleet design: engineering-standards `todo-system.md`.

---

## Antigravity refactor audit (2026-11-23) - unverified

> Gemini fleet audit, not checked item by item: a 2026-11-24 spot check of 7 claims found 1 false. Read the code before acting; figures were not re-measured. Detail: engineering-standards `docs/REFACTOR-AUDIT-2026-11-23.md`, section "IRONSIGHT".

- [ ] [P1, L] 937L ConflictMap.tsx god component (18 useEffect, 23 useRef) with no map test harness
- [ ] [P1, M] Uncached Telegram scraping fan-out, duplicated API proxy boilerplate, and 16 silent catch blocks
- [ ] [P2, S] 1,529L drifted check-ci-local.mjs copy, dual TypeScript 6/7 alias, and missing CI
