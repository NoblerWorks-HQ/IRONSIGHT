#!/usr/bin/env node
/**
 * The CI gate, run locally on `git push`.
 *
 * WHY THIS EXISTS. GitHub Actions was blocked account-wide from 2026-08-09
 * to 2026-08-31 - every run on every repo failed in ~3 seconds ("The job was
 * not started because recent account payments have failed"), before executing
 * a single step. Sixteen repos carried a ci.yml and not one of them ran. This
 * restores the gate on the workstation, at `git push` - the moment work leaves
 * the machine.
 *
 * IT NOW CHECKS INSTEAD OF ASSUMING (2026-09-03). The original printed
 * "GitHub Actions is off (billing)" unconditionally and ran the full gate
 * every time - so once billing was fixed, every push in sixteen repos paid
 * ~4 minutes to redo work Actions was already doing, while the banner said
 * something false. The gate now asks GitHub whether the last CI run went
 * green and steps aside when it did.
 *
 * THE SKIP IS FAIL-SAFE, and that direction is the whole design. It stands
 * down ONLY on a positive, recent green from `gh`. Every uncertainty - no gh,
 * not authenticated, no network, no ci.yml, no runs, a stale last run, a red
 * last run - RUNS the gate. Being wrong about "Actions has this" means
 * shipping unchecked code; being wrong the other way costs four minutes.
 *
 * GREEN IS NOT ENOUGH - CI MUST RUN ON THIS PUSH (2026-09-18). rocketscan's
 * ci.yml dropped its `push` trigger; its last green run was a manual
 * (workflow_dispatch) run on an older commit, and the gate stood down on it,
 * so pushes to main got no check at all until forced by hand. Twelve repos
 * dropped `push` in the CI-minutes pass. The stand-down now needs BOTH:
 *   - the PUSHED commit's ci.yml is triggered by a push to the pushed branch
 *     (`on: push`, a `branches`/`branches-ignore` filter that admits it, no
 *     `paths`/`paths-ignore` filter - the push may touch only ignored paths),
 *     and the branch is known (the hook's remote ref, else HEAD's branch);
 *   - the last `push`-event run of ci.yml ON THAT BRANCH is green (or queued /
 *     in progress) and under 30 days old. Manual, scheduled, PR and other-branch
 *     runs never count.
 * A repo with no push trigger therefore ALWAYS runs the gate - which, since
 * the CI-minutes pass, is most of the fleet, and is the point: there the gate
 * is the only check a push to main gets.
 *
 * IT REMEMBERS WHAT IT ALREADY PROVED (2026-09-13). On 2026-09-12 every CI run
 * in all eleven repos had died on the Actions budget, so the stand-down above
 * never fired, and a one-file Terraform merge into achilles re-ran all twelve
 * steps - 517 seconds - against package trees byte-identical to ones that had
 * passed hours earlier. Budget limits are expected to recur, so the gate can no
 * longer lean on Actions for speed. Three changes:
 *   - A PASS CACHE keyed by the git tree of each step's declared inputs (see
 *     "the pass cache" below). Same inputs, same lockfiles, same gate, same
 *     node: the step is skipped and says so.
 *   - Packages run SIDE BY SIDE when there is memory for it, one step at a time
 *     within a package.
 *   - A heartbeat while a step runs, and per-step timings in the pass marker.
 *
 * GENERATED FILE. Canonical source:
 *   ~/coding/engineering-standards/scripts/templates/check-ci-local.mjs
 * Re-stamp with `engineering-standards/scripts/install-local-ci.sh <repo>`.
 * Per-repo differences belong in `.ci-local.json`, NOT in edits here - eight
 * divergent copies of a gate is the failure the standards repo exists to stop.
 * `check-fleet-parity.mjs` now fails when a copy differs from this file.
 *
 * WHAT IT RUNS. Auto-detected from each package.json: typecheck, lint, test
 * (test:ci / test:coverage / test, first match), build. Blocking, because those
 * are facts about your diff. `audit` is warn-only: it fails on dependency NEWS,
 * and an advisory published overnight blocking a CSS-only push is how a gate
 * earns a reflexive --no-verify.
 *
 * THE HONESTY RULE. This gate is a SUBSTITUTE for ci.yml, so the dangerous
 * failure is passing while silently covering less than CI did. Guards:
 *   - Missing tooling is UNCHECKED and EXITS NONZERO, never a quiet pass.
 *   - A step killed by a signal (the OOM killer) is UNCHECKED, never a FAIL.
 *   - Every run diffs its own steps against ci.yml's `run:` lines and prints
 *     what it does NOT cover. A green run that skipped half of CI must say so.
 *   - A cached step prints "cached", with when and how long it took - never "pass".
 *
 * .ci-local.json keys:
 *   dirs              package directories (default ["."])
 *   skip              step keys to skip, bare ("test") or per dir ("backend:test")
 *   extraSteps        [{label, cmd, dir?, mode?, inputs?, early?}] - cached only with `inputs`.
 *                     `early: true` runs the step BEFORE every package lane and
 *                     stops the gate when it fails - only for a step that reads
 *                     tracked files alone (no build output). See "early" below.
 *   docsOnlyIgnore    regexes; a push touching only these skips the gate
 *   inputs            {"<dir>" | "<dir>:<key>": [paths]} - what a step READS.
 *                     Default is the whole repo. The step's own dir is always added.
 *   parallel          run package dirs side by side (default: only on a machine
 *                     with 16 GB or more - see "run" below for why)
 *   minFreeMBPerStep  free memory needed to start a step beside another (default 2048)
 *   niceness          nice value the gate and every step run at (default 10, 0 disables) -
 *                     keeps editors and dev servers responsive while a gate runs
 *   jestWorkers       workers for a `jest --runInBand` test script run BY THIS GATE
 *                     (default 2 on a machine with 7 GB or more, else 1). The
 *                     script itself is untouched - CI and deploys still run it
 *                     serially. 1 opts a repo out (a suite with a fixed port or a
 *                     shared container). See "two workers" below.
 *   stepTimeoutMin    minutes any one step may run before it is stopped and reported
 *                     UNCHECKED (default 45). Per step: `timeouts: {"<label>": min}`,
 *                     or `timeoutMin` on an extraStep. See "step timeout" below.
 *   tmpDir            TMPDIR for every step (default ~/.cache/local-ci/tmp, on disk).
 *                     See "temp on disk" below.
 *
 * Bypass: `git push --no-verify`, or SKIP_LOCAL_CI=1.
 * Force the gate even when Actions is green: LOCAL_CI_FORCE=1.
 * Ignore the pass cache for one run: LOCAL_CI_NO_CACHE=1.
 * Run every step even after an `early` step fails: LOCAL_CI_KEEP_GOING=1.
 *
 * STEP TIMEOUT (2026-10-31). On 2026-10-20 two achilles gates ran `backend:
 * test:ci` for 21,780 s and 21,542 s - a hang or a host suspend - holding both
 * machine-wide slots for six hours while semantix and gitgood queued behind
 * them (runs.jsonl). A step now has a ceiling (default 45 min; the slowest
 * healthy step in 1,049 runs was 28 min). Hitting it kills the step's whole
 * process group and reports UNCHECKED "timed out", never a pass and never a
 * FAIL: a hang is not a verdict about the code, and the push stays blocked.
 *
 * TEMP ON DISK (2026-10-31). /tmp here is a RAM-backed tmpfs. No repo set a
 * jest cacheDirectory, so jest's cache (os.tmpdir()/jest_*) reached 2.8 GB of
 * RAM, and on 2026-09-14 it and the node compile cache filled the then 3.9 GB
 * tmpfs to zero. Steps now get TMPDIR=~/.cache/local-ci/tmp (cfg.tmpDir,
 * LOCAL_CI_TMPDIR), so jest's cache and every test's mkdtemp land on disk.
 * Entries untouched for 14 days are pruned at gate start.
 *
 * THE MACHINE-WIDE GATE QUEUE (2026-10-15). At most LOCAL_CI_SLOTS (default 2)
 * gates, across every repo and session on this machine, run their steps at once:
 * each takes a `flock` on ~/.cache/local-ci/slot-<n>.lock before its first
 * uncached non-early step and waits (no timeout) when all are held. The lock dies
 * with the process, so a killed gate never wedges the queue. See "the gate queue"
 * below. Emergency bypass: LOCAL_CI_NO_QUEUE=1. Every gate that reaches its steps
 * appends one line to ~/.cache/local-ci/runs.jsonl (LOCAL_CI_QUEUE_DIR moves both;
 * the tests use it).
 */
import { readFileSync, existsSync, writeFileSync, renameSync, mkdirSync, appendFileSync, unlinkSync, rmSync, statSync, readdirSync } from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { freemem, totalmem, loadavg, cpus, homedir, getPriority, setPriority, constants as osConstants } from 'node:os';
import { join, resolve, relative, basename, dirname } from 'node:path';

const ROOT = process.env.CI_LOCAL_ROOT || process.cwd();
const C = process.stdout.isTTY
  ? { r:'\x1b[0;31m', g:'\x1b[0;32m', y:'\x1b[1;33m', c:'\x1b[0;36m', d:'\x1b[2m', n:'\x1b[0m' }
  : { r:'', g:'', y:'', c:'', d:'', n:'' };

if (process.env.SKIP_LOCAL_CI === '1') {
  console.log(`${C.y}[local-ci] SKIP_LOCAL_CI=1 - gate bypassed${C.n}`);
  process.exit(0);
}

// argv: [range] [pushed sha] [remote ref]. The pre-push hook passes all three;
// older hooks pass only the first one or two, and the branch then comes from HEAD.
const range = process.argv[2] || '';
const pushedSha = /^[0-9a-f]{40}$/.test(process.argv[3] || '') ? process.argv[3] : '';
const remoteRef = /^refs\//.test(process.argv[4] || '') ? process.argv[4] : '';
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
const gitOut = (args) => (git(args).stdout || '').trim();

/** Per-repo config. Absent is fine - the defaults cover a single-package repo. */
const cfg = readJson(join(ROOT, '.ci-local.json')) || {};
const dirs        = cfg.dirs        ?? ['.'];
const skip        = new Set(cfg.skip ?? []);
const extraSteps  = cfg.extraSteps  ?? [];
const ignoreGlobs = cfg.docsOnlyIgnore ?? ['^[^/]+\\.md$', '^docs/'];
const inputsCfg   = cfg.inputs ?? {};
const parallel    = cfg.parallel ?? (totalmem() >= 16 * 1024 ** 3);
const minFreeMB   = cfg.minFreeMBPerStep ?? 2048;
const jestWorkers = cfg.jestWorkers ?? (totalmem() >= 7 * 1024 ** 3 ? 2 : 1);
const niceness    = Number.isInteger(cfg.niceness) ? cfg.niceness : 10;
const stepTimeoutMin = Number(process.env.LOCAL_CI_STEP_TIMEOUT_MIN) || cfg.stepTimeoutMin || 45;
const stepTimeouts   = cfg.timeouts ?? {};
const STEP_TMPDIR    = process.env.LOCAL_CI_TMPDIR || cfg.tmpDir || join(homedir(), '.cache', 'local-ci', 'tmp');
// Free memory a multi-worker jest run needs at the moment it starts; below this
// the step runs the script as written (serial) rather than wait. Measured peaks
// with two workers + workerIdleMemoryLimit=1GB: 1.5-2.6 GB (2026-09-13).
const JEST_WORKERS_MIN_FREE_MB = 3072;

/** The steps' TMPDIR exists, and what nothing touched for 14 days is gone. Never fails a gate. */
function prepareStepTmp() {
  try {
    mkdirSync(STEP_TMPDIR, { recursive: true });
    const cutoff = Date.now() - 14 * 86_400_000;
    for (const name of readdirSync(STEP_TMPDIR)) {
      const p = join(STEP_TMPDIR, name);
      try { if (statSync(p).mtimeMs < cutoff) rmSync(p, { recursive: true, force: true }); } catch {}
    }
    return true;
  } catch { return false; }
}
const stepTmpOk = prepareStepTmp();
const STEP_ENV = stepTmpOk ? { TMPDIR: STEP_TMPDIR, TMP: STEP_TMPDIR, TEMP: STEP_TMPDIR } : {};
// A push from a LINKED worktree runs this hook with an absolute GIT_DIR (and
// friends) exported. A test doing `git -C <tmp> init/commit` then writes to the
// real repo: on 2026-10-30 that set core.bare on nobler-starter-web-app and its
// fixture commits replaced GitHub main. Steps find the repo from their cwd instead.
const GIT_LEAK_VARS = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_PREFIX', 'GIT_QUARANTINE_PATH'];
function stepEnv(extra) {
  const env = { ...process.env, ...STEP_ENV, ...(extra || {}) };
  for (const k of GIT_LEAK_VARS) delete env[k];
  return env;
}
/** Kill a step and everything it started (jest workers, turbo children). */
function killTree(child, sig) {
  if (!child?.pid) return;
  try { process.kill(-child.pid, sig); } catch { try { child.kill(sig); } catch {} }
}

// The gate's own per-machine files. They are gitignored by install-local-ci.sh,
// but a repo stamped before that line existed would otherwise read as "dirty"
// forever and never write a marker or use the cache.
const OWN_FILES = new Set(['.local-ci-pass.json', '.local-ci-cache.json', '.local-ci-cache.json.tmp']);
/** Uncommitted changes (tracked or untracked-not-ignored) under `paths`, minus the gate's own files. */
function dirtyUnder(paths = []) {
  const out = git(['status', '--porcelain', '--untracked-files=normal', '--', ...paths]).stdout || '';
  return out.split('\n').filter(Boolean).filter((l) => !OWN_FILES.has(l.slice(3).trim()));
}

function hashOf(paths) {
  const h = createHash('sha256');
  let found = 0;
  for (const p of paths.sort()) {
    if (!existsSync(p)) continue;
    found++;
    // Repo-relative, never absolute (2026-10-13): an absolute path made every worktree's key differ.
    h.update(relative(ROOT, p)).update('\0');
    try { h.update(readFileSync(p)); } catch { h.update('UNREADABLE'); }
    h.update('\0');
  }
  // "no files found" must not hash the same as "files found and empty".
  return found ? h.digest('hex').slice(0, 16) : null;
}

const LOCK_NAMES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'];
// The two hashes the pass marker pins. Defined once and used by BOTH the
// writer (end of this file) and the --verdict reader below, so the check can
// never drift from the thing it checks.
const lockHash = () =>
  hashOf(dirs.flatMap((d) => LOCK_NAMES.map((n) => join(ROOT, d, n))));
const gateHash = () =>
  hashOf([join(ROOT, 'scripts/check-ci-local.mjs'), join(ROOT, '.ci-local.json')]);

// ─────────────────────────────────────────────────────────────────────────────
// --verdict: "did this gate already pass for exactly this code?" (2026-09-07)
// ─────────────────────────────────────────────────────────────────────────────
//
// Exit 0 = yes, provably; the caller may skip its own typecheck/test run.
// Exit 1 = no, or cannot prove it; the caller MUST run its own checks.
//
// Deploy scripts call `scripts/ci-local-verdict.sh`, which is a thin shim over
// this mode. It lives HERE, in the same file as `hashOf()`, on purpose: the
// first cut re-implemented the hash in bash, and the two would have disagreed
// on the first `dirs: ["."]` repo alone - node's join() normalises `a/./b` to
// `a/b` and the shell does not. A verdict that always says "no" because of a
// path-separator difference is a feature that silently does nothing, which is
// worse than not shipping it.
//
// 🔴 FAIL-SAFE, exactly like the Actions skip above. Only a positive,
// hash-matched marker answers yes. No marker, no git, an unreadable file, an
// unknown version, any hash mismatch -> NO. Being wrong about "already tested"
// ships unchecked code to production; being wrong the other way costs minutes.
if (process.argv.includes('--verdict')) {
  const quiet = process.env.CI_VERDICT_QUIET === '1';
  const say = (m) => { if (!quiet) console.error(`[ci-verdict] ${m}`); };
  const no = (m) => { say(m); say('-> running the checks.'); process.exit(1); };

  if (process.env.TRUST_LOCAL_CI === '0') no('TRUST_LOCAL_CI=0 - refusing to reuse any marker.');

  // The tree must be clean NOW, not merely at gate time: the marker describes a
  // COMMIT, and an edit since then is untested code it cannot speak for.
  if (dirtyUnder().length) no('working tree is dirty - the marker describes a commit, not these edits.');
  const head = gitOut(['rev-parse', 'HEAD']);
  if (!head) no('cannot resolve HEAD.');

  const m = readJson(join(ROOT, '.local-ci-pass.json'));
  if (!m) no('no pass marker (this gate has not passed here for a clean tree).');
  if (m.v !== 1) no(`marker version ${JSON.stringify(m.v)} is not one this script understands.`);
  // DOCS-ONLY COMMITS CARRY THE MARKER FORWARD (2026-09-24). A `TODO.md` line
  // committed between push and deploy used to throw the marker away - the push
  // of that commit took the docs-only skip below, which writes no marker - so
  // achilles' 2026-09-23 deploy re-ran ~8,400 tests over a one-line docs diff.
  // The marker still speaks for HEAD when HEAD descends from the marked commit
  // and every file changed since matches `docsOnlyIgnore`: exactly the claim the
  // docs-only push skip already makes, no wider. A rebase (not a descendant),
  // any non-docs file, or a diff git cannot produce -> no.
  let carried = '';
  if (m.sha !== head) {
    const markSha = /^[0-9a-f]{40}$/.test(String(m.sha)) ? m.sha : '';
    const stale = `marker is for ${String(m.sha).slice(0, 8)}, HEAD is ${head.slice(0, 8)}`;
    if (!markSha || git(['merge-base', '--is-ancestor', markSha, head]).status !== 0) {
      no(`${stale}, and HEAD does not descend from it.`);
    }
    const d = git(['diff', '--name-only', markSha, head]);
    if (d.status !== 0) no(`${stale}, and git cannot diff the two.`);
    const changed = d.stdout.split('\n').filter(Boolean);
    const res = ignoreGlobs.map((g) => new RegExp(g));
    const code = changed.filter((f) => !res.some((re) => re.test(f)));
    if (code.length) {
      no(`${stale}, and ${code.length} non-docs file(s) changed since: ${code.slice(0, 3).join(', ')}${code.length > 3 ? ', ...' : ''}.`);
    }
    carried = ` (carried from ${markSha.slice(0, 8)} across ${changed.length} docs-only file(s))`;
  }
  if (m.lock !== lockHash()) no('dependencies changed since the gate ran.');
  if (m.gate !== gateHash()) no('the gate itself changed since the marker was written.');

  // 🔴 THE COVERAGE CHECK, and it is the whole reason this is safe to use.
  //
  // A marker says the gate passed - NOT that the gate ran everything. semantix
  // carries `"skip": ["test"]` because its suites need DynamoDB Local, which a
  // workstation does not have, so its marker legitimately reads
  // ["audit","lint","typecheck"]. A deploy that skipped its TEST run on the
  // strength of that marker would be skipping tests THAT NEVER RAN - a green
  // checkmark over a step that did not execute, which is the exact failure this
  // fleet keeps being bitten by.
  //
  // So the caller must NAME what it intends to skip, and gets "yes" only if the
  // marker actually covers it. No arguments means no claim, and therefore no.
  const required = process.argv.slice(process.argv.indexOf('--verdict') + 1).filter((a) => !a.startsWith('-'));
  if (!required.length) {
    no('nothing named - call with the steps you intend to skip, e.g. `--verdict typecheck test`.');
  }
  const covered = new Set((m.steps || []).map((s) => String(s)));
  // A multi-dir repo labels steps "<dir>: <name>" (achilles: "backend: test:ci"),
  // a single-dir one just "<name>", and extraSteps carry their label verbatim.
  //
  // 🔴 EXACT NAMES, and the package prefix when the repo has more than one dir.
  // The first version compared "the text after the last colon" on both sides,
  // which had two failures found on 2026-09-13: gitgood asked for `test` and the
  // marker said `.: test:coverage` (reduced to `coverage`), so its test skip never
  // fired and every deploy re-ran jest; and achilles' bare `test` was satisfied by
  // `frontend-next: test` alone while the backend suite was `backend: test:ci`, so
  // a backend deploy could skip its tests on the strength of the frontend's. A
  // request must now name the step as the marker records it: `typecheck` in a
  // single-dir repo, `backend: test:ci` in a multi-dir one. A bare name in a
  // multi-dir repo is refused with the exact names to use.
  const dirPrefixOf = (s) => {
    const i = s.indexOf(': ');
    return i !== -1 && dirs.includes(s.slice(0, i)) ? s.slice(0, i) : null;
  };
  const stripDir = (s) => { const p = dirPrefixOf(s); return p === null ? s : s.slice(p.length + 2); };
  const problems = [];
  for (const want of required) {
    if (covered.has(want)) continue;
    const candidates = [...covered].filter((s) => dirPrefixOf(s) !== null && stripDir(s) === want);
    if (dirs.length > 1 && dirPrefixOf(want) === null && candidates.length) {
      problems.push(`\`${want}\` is ambiguous in a repo with dirs [${dirs.join(', ')}] - ask for ${candidates.map((c) => `\`${c}\``).join(' and/or ')} instead`);
    } else {
      problems.push(`\`${want}\` is not a recorded step`);
    }
  }
  if (problems.length) {
    no(`marker does not cover the request: ${problems.join('; ')} (it recorded: ${[...covered].join(', ') || 'nothing'}).`);
  }

  say(`gate passed for ${head.slice(0, 8)} covering ${required.join(', ')} (clean tree, deps and gate unchanged)${carried}.`);
  process.exit(0);
}

// ── docs-only skip ───────────────────────────────────────────────────────────
if (range) {
  const files = gitOut(['diff', '--name-only', range]).split('\n').filter(Boolean);
  if (files.length) {
    const res = ignoreGlobs.map((g) => new RegExp(g));
    if (files.every((f) => res.some((re) => re.test(f)))) {
      console.log(`${C.c}[local-ci] docs-only push - skipping${C.n}`);
      process.exit(0);
    }
  }
}

// ── will ci.yml run on THIS push? (2026-09-18) ──────────────────────────────
// A green run proves Actions is alive; it does not prove Actions will check
// this push. rocketscan's ci.yml dropped its `push` trigger on 2026-09-18, its
// last run was a green workflow_dispatch on an older commit, and the gate stood
// down on that - so pushes reached main with no check at all. Twelve fleet
// repos dropped `push` in the CI-minutes pass (2026-09-10..18). So before the
// run history is even asked, the pushed commit's ci.yml must say that a push to
// this branch triggers it.
//
// A deliberately small reader for the `on:` block, not a YAML parser. Returns
// null when a push to `branch` triggers the workflow, else a reason. Anything
// it does not fully understand is a reason: flow maps, path filters (the push
// may touch only ignored paths), glob characters beyond `*` / `**` / `!`.
function pushTriggerReason(yml, branch) {
  const lines = yml.split('\n')
    .map((l) => l.replace(/(^|\s)#.*$/, '').replace(/\s+$/, ''))
    .filter((l) => l.trim() !== '');
  const ind = (l) => l.length - l.trimStart().length;
  const unq = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
  const list = (s) => { // "[a, b]" | "a" -> [a, b]
    const t = s.trim();
    return (t.startsWith('[') && t.endsWith(']') ? t.slice(1, -1).split(',') : [t]).map(unq).filter(Boolean);
  };
  // The children of lines[i]: its inline value, or the more-indented lines under it.
  const block = (i) => {
    const out = [];
    for (let j = i + 1; j < lines.length && ind(lines[j]) > ind(lines[i]); j++) out.push(lines[j]);
    return out;
  };
  const keyOf = (l) => { const m = l.trim().match(/^(['"]?)([\w-]+)\1\s*:(?:\s+(.*))?$/); return m ? { k: m[2], v: m[3] ?? '' } : null; };

  const onIdx = lines.findIndex((l) => ind(l) === 0 && /^(['"]?)(on|true)\1\s*:/.test(l));
  if (onIdx === -1) return 'ci.yml has no `on:` block';
  const onVal = keyOf(lines[onIdx])?.v ?? '';
  if (onVal) {
    if (onVal.startsWith('{')) return 'ci.yml `on:` is a flow map this gate does not read';
    return list(onVal).includes('push') ? null : 'ci.yml is not triggered on push';
  }
  const kids = block(onIdx);
  if (!kids.length) return 'ci.yml has an empty `on:` block';
  const kidInd = ind(kids[0]);
  if (kids[0].trim().startsWith('- ')) { // on:\n  - push
    return kids.some((l) => unq(l.trim().slice(2)) === 'push') ? null : 'ci.yml is not triggered on push';
  }
  const at = kids.findIndex((l) => ind(l) === kidInd && keyOf(l)?.k === 'push');
  if (at === -1) return 'ci.yml is not triggered on push';
  const pushLine = onIdx + 1 + at;
  const pushVal = keyOf(lines[pushLine]).v;
  if (pushVal === '{}' || pushVal === '~' || pushVal === 'null') return null;
  if (pushVal) return 'ci.yml `push:` has an inline value this gate does not read';

  // push: with filters. key -> list of values.
  const filters = {};
  const body = block(pushLine);
  for (let j = 0; j < body.length; j++) {
    if (ind(body[j]) !== ind(body[0])) continue;
    const kv = keyOf(body[j]);
    if (!kv) return 'ci.yml `push:` block is not readable';
    const vals = kv.v ? list(kv.v) : [];
    for (let n = j + 1; n < body.length && ind(body[n]) > ind(body[j]); n++) {
      const t = body[n].trim();
      if (!t.startsWith('- ')) return `ci.yml \`push.${kv.k}\` is not readable`;
      vals.push(unq(t.slice(2)));
    }
    filters[kv.k] = vals;
  }
  if (filters.paths || filters['paths-ignore']) return 'ci.yml push trigger is path-filtered, so this push may not run it';
  const branches = filters.branches, ignored = filters['branches-ignore'];
  if (!branches && !ignored) {
    // Only tag filters => branch pushes do not trigger it.
    return filters.tags || filters['tags-ignore'] ? 'ci.yml push trigger is tags-only' : null;
  }
  if (!branch) return 'cannot tell which branch is being pushed';
  const toRe = (p) => {
    if (/[?+[\]]/.test(p)) return null;
    const src = p.split('**').map((s) => s.split('*').map((x) => x.replace(/[.\\^$|(){}]/g, '\\$&')).join('[^/]*')).join('.*');
    return new RegExp(`^${src}$`);
  };
  let hit = false;
  for (const raw of branches ?? ignored) {
    const neg = raw.startsWith('!');
    const re = toRe(neg ? raw.slice(1) : raw);
    if (!re) return `ci.yml branch filter \`${raw}\` uses glob syntax this gate does not read`;
    if (re.test(branch)) hit = !neg; // last matching pattern wins, as on GitHub
  }
  const triggered = branches ? hit : !hit;
  return triggered ? null : `ci.yml is not triggered on push to ${branch}`;
}

// ── is GitHub Actions actually covering this push? ───────────────────────────
// Returns a reason to RUN the gate, or null when Actions is confirmed healthy
// AND will run ci.yml on this push, so we can stand down. Every failure path
// returns a reason: we skip only on evidence, never on the absence of it.
function reasonToRunGate() {
  if (process.env.LOCAL_CI_FORCE === '1') return 'LOCAL_CI_FORCE=1';
  if (!existsSync(join(ROOT, '.github/workflows/ci.yml'))) return 'no .github/workflows/ci.yml';

  // The branch GitHub will see: the remote ref from the hook, else HEAD's branch.
  const branch = remoteRef.startsWith('refs/heads/') ? remoteRef.slice('refs/heads/'.length)
    : remoteRef ? '' : gitOut(['symbolic-ref', '--short', '-q', 'HEAD']);
  if (!branch) return remoteRef ? `pushing ${remoteRef}, not a branch` : 'cannot tell which branch is being pushed';

  // Read the workflow AS PUSHED: GitHub triggers on the pushed commit's ci.yml,
  // and a commit that removes `push` must not be waved through by the old file.
  const pushedYml = pushedSha ? git(['show', `${pushedSha}:.github/workflows/ci.yml`]) : null;
  const yml = pushedYml && pushedYml.status === 0 ? pushedYml.stdout
    : readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
  const trig = pushTriggerReason(yml, branch);
  if (trig) return trig;

  // Only a PUSH run on THIS branch speaks for this push. A green manual
  // (workflow_dispatch) or scheduled run, or one on another branch, does not.
  const gh = spawnSync(
    'gh',
    ['run', 'list', '--workflow', 'ci.yml', '--event', 'push', '--branch', branch, '--limit', '1',
     '--json', 'conclusion,status,createdAt,updatedAt,url,event,headBranch'],
    { cwd: ROOT, encoding: 'utf8', timeout: 15000 }
  );
  if (gh.error || gh.status !== 0) {
    const why = gh.error?.code === 'ENOENT' ? 'gh not installed'
      : gh.error?.code === 'ETIMEDOUT' ? 'gh timed out'
      : 'gh could not read run history';
    return why;
  }

  let runs;
  try { runs = JSON.parse(gh.stdout || '[]'); } catch { return 'gh returned unparseable JSON'; }
  if (!Array.isArray(runs) || runs.length === 0) return `no push-triggered CI runs on ${branch}`;

  const [last] = runs;
  // Belt and braces: never let a run of another event or branch speak for this push.
  if (last.event && last.event !== 'push') return `last CI run is a ${last.event} run, not a push`;
  if (last.headBranch && last.headBranch !== branch) return `last CI run is on ${last.headBranch}, not ${branch}`;
  // A queued or running job is itself proof that Actions is ALIVE: the outage
  // this gate substitutes for kills runs in ~3s before a runner is ever
  // assigned, so nothing ever reaches these states under it. Treating them as
  // "unknown" made every rapid second push redo the full gate.
  if (last.status === 'queued' || last.status === 'in_progress') return null;
  if (last.status !== 'completed') return `last CI run is ${last.status}`;
  // A red run is deliberately NOT a stand-down. Billing failures land here too,
  // and if main is already broken a fast local signal beats waiting on CI.
  if (last.conclusion !== 'success') {
    // ...but SAY SO when the shape says billing rather than code. A run blocked
    // on spend dies in seconds without assigning a runner, and GitHub reports it
    // as "recent account payments have failed OR your spending limit needs to be
    // increased" - naming the wrong cause first. That sentence sent us hunting a
    // card for three weeks in Aug 2026 while the real cause was a $0 product
    // budget with stop-usage on. A card is not a budget; check both.
    const secs = (new Date(last.updatedAt) - new Date(last.createdAt)) / 1000;
    if (Number.isFinite(secs) && secs >= 0 && secs < 20) {
      console.log('');
      console.log(`${C.y}[local-ci] ⚠  The last CI run failed in ${secs.toFixed(0)}s. That is too fast to be${C.n}`);
      console.log(`${C.y}           your code - a run that dies before a runner is assigned is almost${C.n}`);
      console.log(`${C.y}           always SPEND, not a failed payment, whatever the message says.${C.n}`);
      console.log(`${C.d}           Check BOTH: Settings > Billing > Payment information, and${C.n}`);
      console.log(`${C.d}           Settings > Billing > Budgets and alerts (a $0 budget with${C.n}`);
      console.log(`${C.d}           "Stop usage: Yes" hard-stops every job and reads as $0 spent).${C.n}`);
      if (last.url) console.log(`${C.d}           ${last.url}${C.n}`);
    }
    return `last CI run ${last.conclusion}`;
  }

  // A repo that has not pushed in a month proves nothing about today's billing.
  const ageDays = (Date.now() - new Date(last.createdAt).getTime()) / 86400000;
  if (!Number.isFinite(ageDays)) return 'last CI run has no usable timestamp';
  if (ageDays > 30) return `last CI run is ${Math.round(ageDays)} days old`;

  return null;
}

const runReason = reasonToRunGate();
if (runReason === null) {
  console.log(`${C.g}[local-ci] GitHub Actions is green - it covers this push. Standing down.${C.n}`);
  console.log(`${C.d}           Force the local gate with LOCAL_CI_FORCE=1.${C.n}`);
  process.exit(0);
}

console.log(`${C.c}[local-ci] Actions not confirmed green (${runReason}). Running the gate here.${C.n}`);
if (range) console.log(`${C.d}           range: ${range}${C.n}`);

// ── plan ─────────────────────────────────────────────────────────────────────
// Which scripts does ci.yml actually invoke? PREFER THOSE over our default
// order - the gate's job is to mirror CI, not to pick the most thorough-sounding
// script name. nobler-os's ci.yml runs `pnpm test`; preferring `test:coverage`
// ran the Python analyst suites, which need venvs CI never had, and crashed with
// a bus error. A gate that runs something CI never ran is not the gate.
const ciPath = join(ROOT, '.github/workflows/ci.yml');
const ciScripts = new Set();
if (existsSync(ciPath)) {
  for (const line of readFileSync(ciPath, 'utf8').split('\n')) {
    const m = line.match(/(?:npm|pnpm|yarn)\s+(?:run\s+)?([\w:.-]+)/);
    if (m && !['ci', 'install', 'audit'].includes(m[1])) ciScripts.add(m[1]);
  }
}

const pmFor = (dir) =>
  existsSync(join(dir, 'pnpm-lock.yaml')) ? 'pnpm'
  : existsSync(join(dir, 'yarn.lock')) ? 'yarn'
  : 'npm';

/** First script that exists wins - repos disagree on test:ci vs test:coverage vs test. */
const PICK = [
  { key: 'typecheck', names: ['typecheck', 'type-check', 'tsc'],            mode: 'block' },
  { key: 'lint',      names: ['lint'],                                       mode: 'block' },
  { key: 'test',      names: ['test:ci', 'test:coverage', 'test'],           mode: 'block' },
  { key: 'build',     names: ['build'],                                      mode: 'block' },
];

const steps = [];
const missingPkg = [];
for (const d of dirs) {
  const abs = resolve(ROOT, d);
  const allSkipped = PICK.every(({ key }) => skip.has(key) || skip.has(`${d}:${key}`))
    && (skip.has('audit') || skip.has(`${d}:audit`));
  const pkg = readJson(join(abs, 'package.json'));
  // A repo whose gate is entirely extraSteps (Unity, pure-Python) legitimately
  // has no package.json. Only a dir we still need to read from is a failure.
  if (!pkg) { if (!allSkipped) missingPkg.push(d); continue; }
  if (!allSkipped && !existsSync(join(abs, 'node_modules'))) {
    console.log(`${C.y}[local-ci] ${d}: no node_modules - install first, or this reports UNCHECKED${C.n}`);
  }
  const scripts = pkg.scripts || {};
  const pm = pmFor(abs);
  const label = (n) => (dirs.length > 1 ? `${d}: ${n}` : n);
  for (const { key, names, mode } of PICK) {
    if (skip.has(key) || skip.has(`${d}:${key}`)) continue;
    // Run a step only if ci.yml actually invokes it. A package.json `build` that
    // CI never runs is not part of the gate - lead-gen-strategist has one, and
    // running it OOM'd the workstation and reported a red build CI would never
    // have produced. Being stricter than CI is not a virtue here: it manufactures
    // failures, and a gate you have to explain away is a gate you turn off.
    // No ci.yml at all => nothing to mirror, so fall back to everything found.
    const hit = names.find((n) => scripts[n] && ciScripts.has(n))
      ?? (ciScripts.size ? null : names.find((n) => scripts[n]));
    if (hit) {
      const inputs = inputsCfg[`${d}:${key}`] ?? inputsCfg[d] ?? ['.'];
      const step = { label: label(hit), cmd: pm, args: ['run', hit], cwd: abs, mode, lane: d, inputs: [d, ...inputs] };
      // ── two workers (2026-09-13) ─────────────────────────────────────────
      // Rule 1 keeps `--runInBand` in every test SCRIPT: CI and deploys run it
      // serially and nothing there changes. This gate runs at every push, on a
      // machine that is otherwise waiting, so it may spend memory to save time:
      // measured A/B on the three largest suites (C2C backend, achilles backend,
      // gitgood root), two workers with workerIdleMemoryLimit=1GB were 37-53 %
      // faster, identical tests and coverage, peak RSS 1.5-2.6 GB. Only a script
      // that is literally `[ENV=x ...] jest <flags>` is rewritten; anything else
      // (turbo, vitest, a chain) runs as written. `--runInBand` must be REMOVED
      // rather than overridden: jest lets it win over --maxWorkers.
      const m = key === 'test' && jestWorkers > 1 && typeof scripts[hit] === 'string'
        ? scripts[hit].match(/^((?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*)jest(\s.*)?$/) : null;
      const bin = join(abs, 'node_modules', '.bin', 'jest');
      if (m && /(^|\s)--runInBand(\s|$)/.test(m[2] || '') && existsSync(bin)) {
        const env = {};
        for (const kv of (m[1] || '').trim().split(/\s+/).filter(Boolean)) {
          const i = kv.indexOf('='); env[kv.slice(0, i)] = kv.slice(i + 1);
        }
        const flags = (m[2] || '').trim().split(/\s+/).filter((f) => f && f !== '--runInBand');
        step.serial = { cmd: step.cmd, args: step.args };
        step.workers = jestWorkers;
        step.env = env;
        // Relative to the step's cwd, so the pass-cache key (which includes the
        // command) is the same in every clone of the repo.
        step.cmd = join('node_modules', '.bin', 'jest');
        step.args = [...flags, `--maxWorkers=${jestWorkers}`, '--workerIdleMemoryLimit=1GB'];
      }
      steps.push(step);
    }
  }
  if (!skip.has('audit')) {
    const args = pm === 'pnpm'
      ? ['audit', '--audit-level=high', '--prod']
      : ['audit', '--omit=dev', '--audit-level=high'];
    // Never cached: audit answers a question about the advisory database, not the tree.
    steps.push({ label: label('audit'), cmd: pm, args, cwd: abs, mode: 'warn', lane: d, inputs: null });
  }
}
for (const s of extraSteps) {
  steps.push({
    label: s.label, cmd: 'bash', args: ['-c', s.cmd],
    cwd: resolve(ROOT, s.dir || '.'), mode: s.mode || 'block',
    // One lane for all extra steps, run after the package lanes finish: they
    // are hand-written, may assume order, and often read what a build wrote.
    // An `early` step opts out of that: it promises to read tracked files only.
    lane: s.early ? '(early)' : '(extra)',
    // Cached only when the manifest says what the command reads. `fleet parity`
    // reads sibling repos, so a tree hash of this one can never vouch for it.
    inputs: Array.isArray(s.inputs) ? [s.dir || '.', ...s.inputs] : null,
    timeoutMin: s.timeoutMin,
  });
}

// ── refuse to report a pass we did not earn ──────────────────────────────────
if (missingPkg.length) {
  console.log(`${C.r}[local-ci] UNCHECKED: no package.json in ${missingPkg.join(', ')}${C.n}`);
  console.log(`${C.y}           Fix .ci-local.json "dirs". Refusing to report a pass.${C.n}`);
  process.exit(1);
}
if (!steps.length) {
  console.log(`${C.r}[local-ci] UNCHECKED: detected no runnable steps.${C.n}`);
  console.log(`${C.y}           A gate that checks nothing must not exit green.${C.n}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// The pass cache (added 2026-09-13)
// ─────────────────────────────────────────────────────────────────────────────
//
// A step's result is a function of what it reads. So each passing step is
// recorded under a key built from:
//   - the git TREE ID of every path in its inputs, at HEAD
//   - the lockfiles, this gate + .ci-local.json, the node version
//   - the step's label, command and directory
// and a later run whose key matches is skipped. A commit that changes nothing
// a step reads - a merge of an unrelated package, a rebase, a message amend, a
// re-push after the OOM killer took the last attempt - costs nothing.
//
// 🔴 INPUTS DEFAULT TO THE WHOLE REPO, and narrowing them is a claim. Tests in
// this fleet read across package lines as a matter of course: achilles'
// frontend drift tests parse backend/ and terraform/, its backend tests read
// terraform/ and lambda-cognito-auth/, and Content2Clients' backend API setup
// reads frontend/. A per-package default would have served a stale pass for
// every one of them. So the default only reuses a pass when the WHOLE tree is
// identical, and `.ci-local.json` "inputs" narrows it per dir or per step. A
// wrong narrowing is a false pass, so write the evidence beside it.
//
// 🔴 FAIL-SAFE. No key - an input with uncommitted changes, an input path that
// does not exist at HEAD, no HEAD, a push of a commit that is not the checkout,
// LOCAL_CI_NO_CACHE=1 - means the step runs. Only a matching key skips.
//
// ⚠️ NO TTL, on purpose, for the reason the marker below has none: identical
// inputs give identical results. The exception is a test that reads the clock
// or the network; that is a flaky test, and LOCAL_CI_NO_CACHE=1 is the escape.
//
// ⚠️ Ignored files are not inputs. A test that reads a gitignored `.env` is
// keyed as if the file did not exist - the same blind spot the marker has.

// 🔴 ONE CACHE PER CLONE, not per checkout (2026-10-13). It lives in git's common dir, which every worktree of
// a clone shares: sessions deploy from fresh worktrees under ~/.cache to stay clear of each other, and with a
// per-checkout file each of those started empty and re-ran all 29 nobler-os steps (15-30 min a push). Keys are
// tree hashes, so a pass recorded in one worktree is exactly as true in another. The old per-checkout file is
// still read (merged in) so nothing already cached is lost.
const COMMON_DIR = gitOut(['rev-parse', '--path-format=absolute', '--git-common-dir']);
const LEGACY_CACHE_FILE = join(ROOT, '.local-ci-cache.json');
const CACHE_FILE = COMMON_DIR ? join(COMMON_DIR, 'local-ci-cache.json') : LEGACY_CACHE_FILE;
// Turbo's own per-package cache, shared the same way: a fresh worktree reuses every unchanged package's
// test/coverage result instead of re-running all of them. Content-hashed, so sharing is safe. An explicit
// TURBO_CACHE_DIR wins.
if (COMMON_DIR && !process.env.TURBO_CACHE_DIR && existsSync(join(ROOT, 'turbo.json'))) {
  process.env.TURBO_CACHE_DIR = join(COMMON_DIR, 'turbo-cache');
}
const CACHE_V = 1;
const CACHE_KEEP = 400;
const head = gitOut(['rev-parse', 'HEAD']);
const cacheOff =
  process.env.LOCAL_CI_NO_CACHE === '1' ? 'LOCAL_CI_NO_CACHE=1'
  : !head ? 'no HEAD'
  : pushedSha && pushedSha !== head ? `the pushed commit ${pushedSha.slice(0, 8)} is not the checkout (${head.slice(0, 8)})`
  : null;
if (pushedSha && head && pushedSha !== head) {
  console.log(`${C.y}[local-ci] ⚠  pushing ${pushedSha.slice(0, 8)}, but the checkout is ${head.slice(0, 8)} - the gate tests the checkout.${C.n}`);
}
const cacheEntries = (file) => {
  const doc = readJson(file);
  return doc?.v === CACHE_V && doc.entries && typeof doc.entries === 'object' ? doc.entries : {};
};
const cache = cacheOff ? {} : {
  ...(CACHE_FILE !== LEGACY_CACHE_FILE ? cacheEntries(LEGACY_CACHE_FILE) : {}),
  ...cacheEntries(CACHE_FILE),
};
if (cacheOff) console.log(`${C.d}           pass cache off: ${cacheOff}${C.n}`);

// Input paths are validated before anything runs: a typo'd path in .ci-local.json
// would hash as "absent" forever and quietly narrow what the key covers.
const badInputs = new Set();
for (const s of steps) {
  if (!s.inputs) continue;
  s.inputs = [...new Set(s.inputs.map((p) => String(p).replace(/^\.\/+/, '').replace(/\/+$/, '') || '.'))].sort();
  for (const p of s.inputs) {
    if (p !== '.' && head && git(['cat-file', '-e', `HEAD:${p}`]).status !== 0) badInputs.add(p);
  }
}
if (badInputs.size) {
  console.log(`${C.r}[local-ci] UNCHECKED: .ci-local.json "inputs" names paths that do not exist at HEAD: ${[...badInputs].join(', ')}${C.n}`);
  console.log(`${C.y}           Fix the manifest - a wrong input silently narrows what a cached pass vouches for.${C.n}`);
  process.exit(1);
}

const lockNow = lockHash();
const gateNow = gateHash();
/** The cache key for a step, or {key:null, why} when it must run. */
function stepKey(s) {
  if (cacheOff) return { key: null, why: cacheOff };
  if (!s.inputs) return { key: null, why: 'not cacheable' };
  if (dirtyUnder(s.inputs).length) return { key: null, why: 'uncommitted changes in its inputs' };
  const h = createHash('sha256').update([
    `v${CACHE_V}`, s.label, `${s.cmd} ${s.args.join(' ')}`, relative(ROOT, s.cwd) || '.',
    process.version, lockNow ?? 'nolock', gateNow ?? 'nogate',
  ].join('\0'));
  for (const p of s.inputs) h.update(`\0${p}=${gitOut(['rev-parse', `HEAD:${p === '.' ? '' : p}`])}`);
  return { key: h.digest('hex').slice(0, 32) };
}

// ── run ──────────────────────────────────────────────────────────────────────
// Steps within a lane (one package dir) run in order, since a build may lean on
// its typecheck. Package lanes may run side by side - but a step starts beside
// another only when there is `minFreeMBPerStep` of free memory, and not within
// STAGGER_MS of the last start, so the first step's memory has had time to show
// up before the second one reads the number.
//
// 🔴 extraSteps run AFTER every package lane, never beside them. The first cut of
// this gate gave them a lane of their own, and on the first real rollout
// (2026-09-13) that broke two repos: gohangout's `open-next build` read `.next/`
// while the package's `next build` was still rewriting it (ENOENT on
// prerender-manifest.json - a race reported as a FAIL), and lead-gen-strategist's
// `tsc --noEmit` ran beside its `lint` for 53 minutes on a 7.8 GB machine. Extra
// steps are hand-written and routinely consume what the package steps produce.
//
// 🔴 PARALLEL IS OFF BY DEFAULT BELOW 16 GB, for the second reason above: a
// free-memory check at start cannot see what a TypeScript or ESLint process will
// grow to a minute later, and two of them thrashing swap is far slower than
// running them one after the other. A repo on a big machine gets it for free;
// `"parallel": true` in .ci-local.json opts in anywhere.
//
// 🔴 `early` STEPS RUN FIRST AND A FAILURE STOPS THE GATE (2026-10-15). nobler-os
// pushed a TODO.md that was over its byte budget; the 0.1 s check that says so
// sat behind the test suites and the coverage run, and the push failed after
// 916 s. A step marked `early` (it reads tracked files only - never a build
// output, which is why this is opt-in and extra steps otherwise run last) runs
// alone, before any package lane, whatever `parallel` says; if one fails
// (block mode), nothing else starts and every step not run is listed, so the
// red run cannot be read as a full check. LOCAL_CI_KEEP_GOING=1 runs the rest
// anyway. Steps that did pass are still written to the pass cache.
const TAIL_BYTES = 256 * 1024;
const HEARTBEAT_MS = 30_000;
const STAGGER_MS = 20_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const secs = (ms) => (ms / 1000).toFixed(0);

const results = new Map(); // label -> { state: pass|warn|fail|unchecked|cached, seconds, at? }
const failed = [], warned = [];
const running = new Set();
let lastStart = 0;
const t0 = Date.now();

// ─────────────────────────────────────────────────────────────────────────────
// The gate queue, CPU-aware admission and lower priority (added 2026-10-15)
// ─────────────────────────────────────────────────────────────────────────────
//
// WHY. Gates from different repos and sessions share one 10-core workstation and
// never knew about each other: the only admission rule was free memory. The
// 2026-10-15 audit of every gate's timings found that when gates overlapped,
// steps ran a median 1.3-1.7x slower and 29-38 % of steps took more than twice
// their own median (p90/median 2.4-4.6x), with load average ~40 on 10 cores.
// Contention made every gate slower and flaked timing-sensitive tests. Three rules:
//
// 1. THE QUEUE. At most SLOTS gates run their steps at once, machine-wide. A gate
//    takes `flock -n` on ~/.cache/local-ci/slot-<n>.lock, held by a tiny `flock ...
//    cat` child whose stdin is a pipe from this process: when the gate exits - or
//    is SIGKILLed, or OOM-killed - the pipe closes, `cat` sees EOF and the kernel
//    drops the lock. No stale-lock cleanup exists because none is needed. The
//    pipe is close-on-exec, so a step's grandchild (a daemon a test left behind)
//    can never inherit and hold the slot. The holder writes slot-<n>.json (repo,
//    pid, since) for the "waiting for gate slot" line. Without util-linux `flock`
//    the gate falls back to slot-<n>.d directories whose owner pid is checked for
//    liveness. Any other tool may join the queue with a bare
//    `flock ~/.cache/local-ci/slot-<n>.lock <cmd>` (Hexcode's tools/test.sh).
//    The slot is taken lazily - at the first step that is neither cached nor
//    `early` - so a fully cached or docs-only push never waits, and released as
//    soon as the steps finish. A nested gate (a step that runs another gate) sees
//    LOCAL_CI_SLOT_HELD=1 and does not queue behind its own parent.
// 2. CPU-AWARE ADMISSION. A step starts BESIDE another only when the 1-minute
//    load average is under the core count, as well as the free-memory rule;
//    otherwise it runs after the current one.
// 3. LOWER PRIORITY. The gate raises its own nice value to `niceness` (default
//    10) before any step starts; every step inherits it.
//
// And it measures: one JSON line per gate run in runs.jsonl (repo, sha, start,
// wall seconds, outcome, per-step seconds, load and free memory at start, slot
// wait), so the next audit reads numbers instead of reconstructing them.
const QUEUE_DIR = process.env.LOCAL_CI_QUEUE_DIR || join(homedir(), '.cache', 'local-ci');
const SLOTS = Math.max(1, parseInt(process.env.LOCAL_CI_SLOTS || '', 10) || 2);
// BURST SLOT (2026-10-31). Two slots is right for a busy machine - the 31 Oct
// audit measured coverage at 197 s under load 10 and 334 s above it - but on a
// quiet one it leaves cores idle while gates queue (34 h of slot waits in 15
// days). One more slot opens only while load1 is under 70% of the cores and 8 GB
// is free, checked each time a gate looks for a slot; a gate that got it keeps it.
const BURST_SLOTS = Math.max(0, parseInt(process.env.LOCAL_CI_BURST_SLOTS ?? '1', 10) || 0);
const BURST_MAX_LOAD = Number(process.env.LOCAL_CI_BURST_MAX_LOAD) || cpus().length * 0.7;
const BURST_MIN_FREE_MB = Number(process.env.LOCAL_CI_BURST_MIN_FREE_MB) || 8192;
const burstOpen = () => BURST_SLOTS > 0 && loadavg()[0] < BURST_MAX_LOAD && freemem() / 1048576 >= BURST_MIN_FREE_MB;
const NO_QUEUE = process.env.LOCAL_CI_NO_QUEUE === '1' ? 'LOCAL_CI_NO_QUEUE=1'
  : process.env.LOCAL_CI_SLOT_HELD === '1' ? 'a gate running inside a gate that already holds a slot'
  : null;
const CPUS = cpus().length || 1;
const REPO = COMMON_DIR && basename(COMMON_DIR) === '.git' ? basename(dirname(COMMON_DIR)) : basename(ROOT);
const pidAlive = (pid) => {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
};

/** Non-blocking flock on `file`: the holder child once locked, null when held elsewhere, 'noflock' without flock. */
function tryFlock(file) {
  return new Promise((res) => {
    let settled = false;
    const settle = (v) => { if (!settled) { settled = true; res(v); } };
    let ch;
    try {
      ch = spawn('flock', ['-n', '-E', '75', file, 'sh', '-c', 'echo locked; exec cat >/dev/null'],
        { stdio: ['pipe', 'pipe', 'ignore'] });
    } catch { settle('noflock'); return; }
    let out = '';
    ch.stdout.on('data', (d) => { out += d; if (out.includes('locked')) settle(ch); });
    ch.on('error', (e) => settle(e.code === 'ENOENT' ? 'noflock' : null));
    ch.on('close', () => settle(null));
  });
}

/** Fallback without flock: an atomic mkdir, reclaimed only from a dead (or never-written) owner. */
function tryDirLock(n) {
  const d = join(QUEUE_DIR, `slot-${n}.d`);
  const take = () => { mkdirSync(d); writeFileSync(join(d, 'owner.json'), JSON.stringify({ pid: process.pid })); };
  try { take(); } catch {
    const owner = readJson(join(d, 'owner.json'));
    if (owner && pidAlive(owner.pid)) return null;
    // No owner file yet: a holder may be between mkdir and write. Give it 10 s.
    if (!owner) { try { if (Date.now() - statSync(d).mtimeMs < 10_000) return null; } catch { return null; } }
    try { rmSync(d, { recursive: true, force: true }); take(); } catch { return null; }
  }
  const release = () => { try { if (readJson(join(d, 'owner.json'))?.pid === process.pid) rmSync(d, { recursive: true, force: true }); } catch {} };
  process.on('exit', release);
  return { n, release };
}

function holders() {
  const out = [];
  for (let n = 1; n <= SLOTS + BURST_SLOTS; n++) {
    const j = readJson(join(QUEUE_DIR, `slot-${n}.json`));
    if (j && pidAlive(j.pid)) {
      const t = new Date(j.since);
      out.push(`${j.repo} pid ${j.pid}, since ${Number.isNaN(+t) ? '?' : t.toTimeString().slice(0, 8)}`);
    } else {
      out.push(`slot ${n}: a holder that left no note (e.g. a flock wrapper)`);
    }
  }
  return out.join('; ');
}

let slot = null;      // { n, release }
let slotWaitS = 0;
let slotPromise = null;
const ensureSlot = () => (slotPromise ??= acquireSlot());
async function acquireSlot() {
  if (NO_QUEUE) { console.log(`${C.y}  not queueing for a gate slot: ${NO_QUEUE}${C.n}`); return; }
  try { mkdirSync(QUEUE_DIR, { recursive: true }); } catch (e) {
    console.log(`${C.y}  cannot create ${QUEUE_DIR} (${e.code}) - running without the gate queue${C.n}`);
    return;
  }
  const w0 = Date.now();
  let said = false, useFlock = true;
  for (;;) {
    const limit = SLOTS + (burstOpen() ? BURST_SLOTS : 0);
    for (let n = 1; n <= limit && !slot; n++) {
      if (useFlock) {
        const r = await tryFlock(join(QUEUE_DIR, `slot-${n}.lock`));
        if (r === 'noflock') {
          useFlock = false;
          console.log(`${C.y}  flock not found (util-linux) - queueing on pid-checked lock directories instead${C.n}`);
        } else if (r) {
          r.unref(); r.stdin.unref?.(); r.stdout.unref?.();
          slot = { n, release: () => { try { r.stdin.end(); } catch {} try { r.kill(); } catch {} } };
        }
      }
      if (!useFlock && !slot) slot = tryDirLock(n);
    }
    if (slot) break;
    if (!said) {
      said = true;
      console.log(`${C.y}  waiting for gate slot (held by ${holders()})${C.n}`);
      console.log(`${C.d}  … ${SLOTS} gate(s) may run at once machine-wide (LOCAL_CI_SLOTS), ${SLOTS + BURST_SLOTS} while the machine is quiet; LOCAL_CI_NO_QUEUE=1 bypasses in an emergency${C.n}`);
    }
    await sleep(2000);
  }
  slotWaitS = +((Date.now() - w0) / 1000).toFixed(1);
  process.env.LOCAL_CI_SLOT_HELD = '1'; // steps inherit it; a nested gate must not queue behind us
  try {
    writeFileSync(join(QUEUE_DIR, `slot-${slot.n}.json`),
      JSON.stringify({ repo: REPO, pid: process.pid, sha: head, since: new Date().toISOString() }) + '\n');
  } catch {}
  if (said) console.log(`${C.c}  got gate slot ${slot.n} after ${secs(slotWaitS * 1000)}s${C.n}`);
}
function releaseSlot() {
  if (!slot) return;
  const note = join(QUEUE_DIR, `slot-${slot.n}.json`);
  try { if (readJson(note)?.pid === process.pid) unlinkSync(note); } catch {}
  slot.release();
  slot = null;
}

let appliedNice = 0;
if (niceness > 0) {
  try {
    const cur = getPriority(0);
    if (cur < niceness) setPriority(0, niceness);
    appliedNice = getPriority(0);
  } catch { /* never fail a gate over its priority */ }
}
const startLoad = +loadavg()[0].toFixed(2);
const startFreeMB = Math.round(freemem() / 1048576);

let recorded = false;
function recordRun(outcome) {
  if (recorded) return;
  recorded = true;
  try {
    mkdirSync(QUEUE_DIR, { recursive: true });
    appendFileSync(join(QUEUE_DIR, 'runs.jsonl'), JSON.stringify({
      v: 1, repo: REPO, root: ROOT, sha: head || null,
      start: new Date(t0).toISOString(), wallS: +((Date.now() - t0) / 1000).toFixed(1), outcome,
      steps: Object.fromEntries([...results].map(([l, r]) => [l, { s: r.ms != null ? +(r.ms / 1000).toFixed(1) : r.seconds, state: r.state }])),
      running: [...running].map((r) => r.label),
      load1: startLoad, cpus: CPUS, freeMB: startFreeMB,
      slotWaitS, slot: slot?.n ?? null, slots: NO_QUEUE ? 0 : SLOTS, niceness: appliedNice,
    }) + '\n');
  } catch { /* bookkeeping never fails a gate */ }
}
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    for (const r of running) killTree(r.child, sig);
    recordRun('killed');
    releaseSlot();
    process.exit(128 + (osConstants.signals[sig] || 1));
  });
}


function printResult(label, text) {
  console.log(`  ${label.padEnd(30)}${text}`);
}

// A step starts beside another only with free memory AND spare CPU (load under the core count, 2026-10-15).
async function memoryTurn() {
  for (let waitedMs = 0; ; waitedMs += 2000) {
    if (running.size === 0) return;
    const freeMB = freemem() / 1048576;
    const load = loadavg()[0];
    if (freeMB >= minFreeMB && load < CPUS && Date.now() - lastStart >= STAGGER_MS) return;
    if (waitedMs === 10_000) {
      const why = [freeMB < minFreeMB && `${freeMB.toFixed(0)} MB free, need ${minFreeMB}`,
        load >= CPUS && `load ${load.toFixed(1)} on ${CPUS} cores`].filter(Boolean).join('; ') || 'staggering starts';
      console.log(`${C.d}  … waiting to start the next step beside the current one (${why})${C.n}`);
    }
    await sleep(2000);
  }
}

function runStep(s, key) {
  return new Promise((done) => {
    const st = Date.now();
    const entry = { label: s.label, st, child: null };
    running.add(entry);
    lastStart = st;
    let tail = '';
    const keep = (buf) => { tail = (tail + buf.toString('utf8')).slice(-TAIL_BYTES); };
    let finished = false;
    // A multi-worker jest step falls back to the script as written when memory
    // is short right now - serial is slower, thrashing swap is slower still.
    let { cmd, args } = s;
    let how = '';
    if (s.workers) {
      const freeMB = freemem() / 1048576;
      if (freeMB >= JEST_WORKERS_MIN_FREE_MB) how = `${s.workers} workers`;
      else { ({ cmd, args } = s.serial); how = `serial: ${freeMB.toFixed(0)} MB free, ${s.workers} workers need ${JEST_WORKERS_MIN_FREE_MB}`; }
    }
    // Output is kept as a rolling tail rather than a buffer that kills the child
    // at a limit. nobler-os's `pnpm test` emits over 1 MiB and passes; the old
    // spawnSync maxBuffer had to be raised to 256 MiB to stop a false red.
    const child = spawn(cmd, args, {
      cwd: s.cwd, shell: process.platform === 'win32',
      env: stepEnv(s.env),
      // Its own process group, so a timeout or a signal stops the step's children too.
      detached: process.platform !== 'win32',
      // No TTY and no stdin: a step that wants to prompt must fail, not wait.
      // `next lint` on an unconfigured repo asks "How would you like to configure
      // ESLint?" and rendered an arrow-key menu into the captured output.
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    entry.child = child;
    const limitMin = Number(stepTimeouts[s.label] ?? s.timeoutMin ?? stepTimeoutMin);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child, 'SIGTERM');
      setTimeout(() => killTree(child, 'SIGKILL'), 10_000).unref();
    }, limitMin * 60_000);
    timer.unref();
    child.stdout.on('data', keep);
    child.stderr.on('data', keep);
    const finish = (code, err, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      running.delete(entry);
      const ms = Date.now() - st;
      const dt = secs(ms);
      if (err && err.code === 'ENOENT') {
        printResult(s.label, `${C.r}UNCHECKED${C.n} ${C.d}(${s.cmd} not found)${C.n}`);
        failed.push(`${s.label} (tooling missing)`);
        results.set(s.label, { state: 'unchecked', seconds: +dt });
      } else if (timedOut) {
        printResult(s.label, `${C.r}UNCHECKED${C.n} ${C.d}(timed out after ${limitMin} min - hung? not a code failure; raise it with "timeouts" in .ci-local.json if the step is just slow)${C.n}`);
        failed.push(`${s.label} (timed out after ${limitMin} min, not a code failure)`);
        results.set(s.label, { state: 'timeout', seconds: +dt });
        console.log(tail.trimEnd().split('\n').slice(-15).map((l) => `      ${l}`).join('\n'));
      } else if (signal) {
        // A signal is not a verdict about the code. SIGKILL here is almost always
        // the OOM killer - reporting it as FAIL sends someone hunting a bug.
        printResult(s.label, `${C.r}UNCHECKED${C.n} ${C.d}(killed by ${signal} after ${dt}s - out of memory? not a code failure)${C.n}`);
        failed.push(`${s.label} (killed by ${signal}, not a code failure)`);
        results.set(s.label, { state: 'unchecked', seconds: +dt });
      } else if (code !== 0 && /\b(?:sh|bash|env|zsh): .*(?:command )?not found/.test(tail)) {
        printResult(s.label, `${C.r}UNCHECKED${C.n} ${C.d}(tool missing - stale install? run the repo's install)${C.n}`);
        failed.push(`${s.label} (tool missing, not a code failure)`);
        results.set(s.label, { state: 'unchecked', seconds: +dt });
      } else if (code === 0) {
        printResult(s.label, `${C.g}pass${C.n} ${C.d}(${dt}s${how ? `, ${how}` : ''})${C.n}`);
        results.set(s.label, { state: 'pass', seconds: +dt });
        if (key) cache[key] = { label: s.label, at: new Date().toISOString(), seconds: +dt, sha: head };
      } else if (s.mode === 'warn') {
        printResult(s.label, `${C.y}warn${C.n} ${C.d}(${dt}s)${C.n}`);
        warned.push(s.label);
        results.set(s.label, { state: 'warn', seconds: +dt });
      } else {
        printResult(s.label, `${C.r}FAIL${C.n} ${C.d}(${dt}s)${C.n}`);
        failed.push(s.label);
        results.set(s.label, { state: 'fail', seconds: +dt });
        console.log(tail.trimEnd().split('\n').slice(-25).map((l) => `      ${l}`).join('\n'));
      }
      const r = results.get(s.label);
      if (r) r.ms = ms;
      done();
    };
    child.on('error', (err) => finish(null, err, null));
    child.on('close', (code, signal) => finish(code, null, signal));
  });
}

async function runLane(queue) {
  for (const s of queue) {
    const { key } = stepKey(s);
    const hit = key && cache[key];
    if (hit) {
      const when = String(hit.at || '').slice(0, 16).replace('T', ' ');
      printResult(s.label, `${C.c}cached${C.n} ${C.d}(passed ${when} UTC on identical inputs, took ${hit.seconds}s)${C.n}`);
      results.set(s.label, { state: 'cached', seconds: 0, saved: hit.seconds });
      continue;
    }
    if (s.lane !== '(early)') await ensureSlot();
    await memoryTurn();
    await runStep(s, key);
  }
}

const lanes = new Map();
for (const s of steps) {
  const lane = s.lane === '(early)' ? '(early)' : parallel ? s.lane : 'serial';
  if (!lanes.has(lane)) lanes.set(lane, []);
  lanes.get(lane).push(s);
}
const packageLanes = [...lanes].filter(([k]) => k !== '(extra)' && k !== '(early)').map(([, q]) => q);
const extraLane = lanes.get('(extra)');
const earlyLane = lanes.get('(early)');
console.log(`${C.d}           ${steps.length} steps, ${earlyLane ? `${earlyLane.length} early check(s) first, then ` : ''}${parallel ? `${packageLanes.length} package lane(s) side by side, extra steps after` : 'one at a time'}${C.n}`);
console.log('');

// A long silent step is indistinguishable from a hung one. Say what is running.
const heartbeat = setInterval(() => {
  const long = [...running].filter((r) => Date.now() - r.st >= 20_000);
  if (long.length) console.log(`${C.d}  … running: ${long.map((r) => `${r.label} ${secs(Date.now() - r.st)}s`).join(', ')}${C.n}`);
}, HEARTBEAT_MS);
let notRun = [];
if (earlyLane) await runLane(earlyLane);
if (earlyLane && failed.length && process.env.LOCAL_CI_KEEP_GOING !== '1') {
  notRun = steps.filter((s) => !results.has(s.label)).map((s) => s.label);
  console.log(`${C.y}  an early check failed - not starting the other ${notRun.length} step(s)${C.n}`);
} else {
  await Promise.all(packageLanes.map(runLane));
  if (extraLane) await runLane(extraLane);
}
clearInterval(heartbeat);
recordRun(failed.length === 0 ? 'pass'
  : [...results.values()].some((r) => r.state === 'fail') ? 'fail' : 'unchecked');
releaseSlot();

// Persist what passed, even when something else failed: a passing step's
// result is still true for its inputs, and the fix-and-re-push loop is exactly
// when re-running it hurts most.
if (!cacheOff) {
  try {
    // Re-read before writing: another worktree's gate may have added entries since this one started.
    const entries = Object.entries({ ...cacheEntries(CACHE_FILE), ...cache })
      .sort(([, a], [, b]) => String(b.at).localeCompare(String(a.at)))
      .slice(0, CACHE_KEEP);
    const tmp = `${CACHE_FILE}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify({ v: CACHE_V, entries: Object.fromEntries(entries) }, null, 1) + '\n');
    renameSync(tmp, CACHE_FILE);
  } catch {
    // Never fail a gate over bookkeeping; a missing cache only costs time.
  }
}

// ── coverage vs ci.yml ───────────────────────────────────────────────────────
// The point of the whole file: say out loud what CI checked and we do not.
const uncovered = [];
if (existsSync(ciPath)) {
  const ran = steps.map((s) => `${s.args.join(' ')} ${s.label}`).join(' ');
  // extraSteps must be in the haystack too - a step declared in the manifest
  // being reported as uncovered is a warning that cries wolf, and a warning
  // that cries wolf gets ignored, which defeats the coverage report entirely.
  const declaredCmds = extraSteps.map((s) => s.cmd);
  const declared = declaredCmds.join(' ');
  for (const line of readFileSync(ciPath, 'utf8').split('\n')) {
    const m = line.match(/^\s+run:\s+(.+)$/);
    if (!m) continue;
    const cmd = m[1].trim();
    if (/^\|/.test(cmd) || /^(npm|pnpm|yarn) (ci|install)/.test(cmd)) continue; // installs aren't checks
    // `npm test` and `pnpm lint` invoke a script with no `run` verb - matching
    // only /run\s+/ reported covered steps as uncovered, which trains you to
    // ignore the one warning that matters.
    const script = cmd.match(/^(?:npm|pnpm|yarn)\s+(?:run\s+)?([\w:.-]+)/)?.[1] ?? null;
    // Containment BOTH ways: ci.yml wraps steps in compound commands
    // (`node --version && npm run smoke:bundle`), so an exact match misses a
    // step we genuinely run.
    const covered = declaredCmds.some((d) => d && (cmd.includes(d) || d.includes(cmd)))
      || (script ? (ran.includes(script) || declared.includes(script)) : /audit/.test(cmd));
    if (!covered && !uncovered.includes(cmd)) uncovered.push(cmd);
  }
}

const total = secs(Date.now() - t0);
const cachedSteps = [...results.values()].filter((r) => r.state === 'cached');
const saved = cachedSteps.reduce((n, r) => n + (r.saved || 0), 0);
console.log('');
if (uncovered.length) {
  console.log(`${C.y}[local-ci] NOT covered locally (ci.yml runs these, this gate does not):${C.n}`);
  for (const u of uncovered) console.log(`${C.y}           - ${u}${C.n}`);
  console.log(`${C.d}           Add them to .ci-local.json "extraSteps" if they matter here.${C.n}`);
}
if (cachedSteps.length) console.log(`${C.d}[local-ci] ${cachedSteps.length} step(s) from the pass cache, ~${saved}s saved (LOCAL_CI_NO_CACHE=1 to re-run)${C.n}`);

// The time budget (added 2026-09-13). Two shapes of slow step were found the
// hard way: nobler-os's `coverage floors` took 589 s of a 631 s gate and could
// never be cached because it declared no `inputs`; PGP's frontend coverage went
// from ~80 s to 856 s after a dependency relock and nothing said a word. Both
// are cheap to notice here and expensive to notice anywhere else.
const UNCACHEABLE_SLOW_S = 30;
const STEP_BUDGET_S = 300;
const inputsOf = new Map(steps.map((s) => [s.label, s.inputs]));
for (const [label, r] of results) {
  if (r.state !== 'pass' && r.state !== 'warn') continue;
  if (label === 'audit' || label.endsWith(': audit')) continue; // asks the advisory DB, never cacheable by design
  if (!inputsOf.get(label) && r.seconds >= UNCACHEABLE_SLOW_S) {
    console.log(`${C.y}[local-ci] ⚠  ${label} took ${r.seconds}s and can never be cached - give it "inputs" in .ci-local.json${C.n}`);
  } else if (r.seconds >= STEP_BUDGET_S) {
    console.log(`${C.y}[local-ci] ⚠  ${label} took ${r.seconds}s - over the ${STEP_BUDGET_S}s step budget; a step this slow usually just got slower (profile it)${C.n}`);
  }
}
if (warned.length) console.log(`${C.y}[local-ci] warnings (not blocking): ${warned.join(', ')}${C.n}`);
if (failed.length) {
  console.log(`${C.r}[local-ci] FAILED in ${total}s: ${failed.join(', ')}${C.n}`);
  if (notRun.length) console.log(`${C.y}           NOT RUN (an early check failed first): ${notRun.join(', ')} - LOCAL_CI_KEEP_GOING=1 runs them anyway${C.n}`);
  console.log(`${C.y}           Push blocked. Fix, or bypass with: git push --no-verify${C.n}`);
  process.exit(1);
}
console.log(`${C.g}[local-ci] gate passed in ${total}s${C.n}`);

// ─────────────────────────────────────────────────────────────────────────────
// The pass marker: stop paying for this twice (added 2026-09-07)
// ─────────────────────────────────────────────────────────────────────────────
//
// WHY. This gate runs at `git push`, and then `deploy.sh` preflight runs the
// SAME typecheck and the SAME suite minutes later. Measured on 2026-09-07
// shipping one change: achilles paid 155s here and ~360s again in preflight -
// 8.5 minutes of testing to ship once. gitgood paid 141s + ~185s. Both repos
// already have a TRUST_CI shortcut that would skip preflight, and it can never
// fire while GitHub Actions is billing-blocked, which it has been since
// 2026-09-04.
//
// So record what passed, and let the deploy read it. `ci-local-verdict.sh` is
// the ONE reader - deploy scripts call that rather than re-implementing this
// check four times, which is the second-copy failure the standards repo exists
// to stop.
//
// 🔴 THE MARKER IS PINNED TO THREE HASHES, NOT A TIMESTAMP. A TTL would be
// theatre: an hour-old marker on identical inputs is exactly as good as a
// fresh one, and a fresh marker on changed inputs is worthless. What actually
// invalidates a result is the inputs changing, so that is what is recorded:
//   - sha   the commit the gate ran against
//   - lock  the lockfiles, so a dependency change re-runs
//   - gate  this script + .ci-local.json, so CHANGING THE GATE re-runs
// The third is the one that is easy to forget and the most dangerous to omit:
// without it, widening the gate would be silently skipped by a marker written
// under the old, narrower definition.
//
// A step served from the pass cache counts as covered: it passed on the same
// inputs, which is the same claim a marker makes about a commit.
//
// 🔴 NO MARKER IS WRITTEN FROM A DIRTY TREE. A result cannot be attributed to
// a commit that does not describe what was tested. `--no-verify` writes nothing
// either, because this code never runs then - which is correct: a bypassed gate
// must not license a skipped preflight.

try {
  if (dirtyUnder().length) {
    console.log(`${C.d}[local-ci] working tree dirty - no pass marker written (deploy will re-run its own gate)${C.n}`);
  } else if (!head) {
    console.log(`${C.d}[local-ci] no HEAD - no pass marker written${C.n}`);
  } else {
    const marker = {
      v: 1,
      sha: head,
      // The SAME two functions --verdict reads with. One implementation, so the
      // writer and the reader cannot drift apart.
      lock: lockHash(),
      gate: gateHash(),
      steps: steps.map((s) => String(s.label ?? '')).filter(Boolean).sort(),
      // Recorded for a human reading the file, never compared - see the note
      // above on why a TTL would be theatre. `timings` is seconds actually
      // spent this run; a cached step reads 0 and is listed in `cached`.
      at: new Date().toISOString(),
      seconds: +total,
      timings: Object.fromEntries([...results].map(([l, r]) => [l, r.seconds])),
      cached: [...results].filter(([, r]) => r.state === 'cached').map(([l]) => l).sort(),
    };
    writeFileSync(join(ROOT, '.local-ci-pass.json'), JSON.stringify(marker, null, 2) + '\n');
    console.log(`${C.d}[local-ci] pass marker written for ${head.slice(0, 8)} - deploy preflight may reuse it${C.n}`);
  }
} catch {
  // Never fail a passing gate over bookkeeping. No marker just means the
  // deploy re-runs its own checks, which is the pre-2026-09-07 behaviour.
}
