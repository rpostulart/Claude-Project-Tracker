# Hooks silently skip enforcement when no git repo exists

## What was reported
Both `require-issue.sh` and `require-docs.sh` hooks use `git rev-parse --show-toplevel` to find the repo root. If the project directory is not inside a git repo, the hooks exit 0 (allow) silently — meaning all enforcement is bypassed.

This was confirmed: the Claude Code CLI respects hooks, but they weren't firing because the hooks themselves bailed out.

## Acceptance criteria
1. `init.sh` should `git init` when not already in a git repo, so hooks always have a git root to find
2. Both hooks should also have a fallback to walk up directories looking for `.project/` in case git is still unavailable
3. Template hooks should be synced after changes

## Technical approach
- Add `git init` to `init.sh` early in the flow (before any git-dependent operations)
- Update both hook scripts to fall back to directory walking when `git rev-parse` fails
- Sync template after changes
