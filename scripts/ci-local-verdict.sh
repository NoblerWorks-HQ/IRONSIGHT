#!/usr/bin/env bash
#
# "Did the local CI gate already pass for exactly this code?"
#
# Exit 0 - yes, provably. The caller may skip its own typecheck/test run.
# Exit 1 - no, or cannot prove it. The caller MUST run its own checks.
#
# Usage, from a deploy script - NAME THE STEPS YOU INTEND TO SKIP, exactly as
# the marker records them (`steps` in .local-ci-pass.json): the script name in
# a single-dir repo, "<dir>: <script>" in a multi-dir one, an extraStep's label
# verbatim. A bare name in a multi-dir repo is refused (2026-09-13: `test` was
# satisfied by one package's suite while another's was `test:ci`).
#
#     if ./scripts/ci-local-verdict.sh "backend: typecheck" "backend: test:ci"; then
#         info "Local CI gate already passed for this commit - skipping tests"
#     else
#         run_the_tests
#     fi
#
# 🔴 The arguments are not decoration. A marker says the gate PASSED, not that
# it ran everything: semantix skips `test` locally because its suites need
# DynamoDB Local, so its marker legitimately records only audit/lint/typecheck.
# Trusting that marker to skip a test run would skip tests that never ran. The
# verdict therefore answers "yes" only for steps the marker actually covers,
# and answers NO when called with no arguments at all.
#
# WHY THIS EXISTS. `check-ci-local.mjs` runs the full gate at `git push`, and
# then `deploy.sh` preflight runs the same typecheck and the same suite minutes
# later. Measured 2026-09-07 shipping one change: achilles paid 155s at push and
# ~360s again in preflight - 8.5 minutes of testing to ship once; gitgood paid
# 141s + ~185s. Both repos already have a TRUST_CI shortcut for exactly this,
# sourced from GitHub, and it cannot fire while Actions is billing-blocked -
# which it has been since 2026-09-04.
#
# ⚠️ THIS FILE IS A SHIM AND MUST STAY ONE. All of the logic - the marker, the
# hashes, the clean-tree check - lives in `check-ci-local.mjs --verdict`,
# beside the `hashOf()` that WRITES the marker. The first cut of this script
# re-implemented that hash in bash and the two would have disagreed on the very
# first repo: node's `join()` normalises `a/./b` to `a/b` and the shell does
# not, so every verdict would have been a silent "no". A feature that quietly
# does nothing is worse than one that was never shipped. If you need to change
# what makes a marker valid, change it there, once.
#
# GENERATED FILE. Canonical source:
#   ~/coding/engineering-standards/scripts/templates/ci-local-verdict.sh
# Re-stamp with `engineering-standards/scripts/install-local-ci.sh <repo>`.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# No node means we cannot read the marker, which is an uncertainty - and every
# uncertainty answers "no" so the caller does the work itself.
if ! command -v node >/dev/null 2>&1; then
    [ "${CI_VERDICT_QUIET:-0}" = "1" ] || echo "[ci-verdict] node not found -> running the checks." >&2
    exit 1
fi

exec node "$ROOT/scripts/check-ci-local.mjs" --verdict "$@"
