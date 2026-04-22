# Periodic update check via SessionStart hook

## What was requested

Surface tracker updates to users without forcing them to manually re-run `init.sh --update` on every repo. Zero token cost when up-to-date.

## Approach

- Publish a `VERSION` file (semver) in the repo root.
- `init.sh` writes that VERSION to `.project/VERSION` on install and `--update`.
- A new `SessionStart` hook (`.claude/hooks/check-version.sh`) runs once per 24h (throttled via `.project/.version-check-ts`), fetches the remote `VERSION` from raw.githubusercontent, and prints a short notice to Claude **only when out of date**.
- When up-to-date or throttled: exit silently (0 tokens).
- When out of date: Claude sees a one-line prompt asking the user whether to run `./init.sh --update`.

## Why not CLAUDE.md

CLAUDE.md is always-loaded. Any instruction there pays per turn forever. A hook is zero-cost on the silent path.
