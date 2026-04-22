---
name: bump-version
description: Bump the tracker VERSION (semver) so update-check hook notifies existing installs.
argument-hint: [major|minor|patch|<explicit-version>]
allowed-tools: Read, Write, Bash
---

Bump the tracker version so existing installs see the update-check notice on their next session.

## When to run

**Only in the tracker source repo** (the one that contains `template/.project/`). In a consumer repo, `VERSION` is installed state — don't edit it; run `init.sh --update` instead.

Run after any change to files that ship to consumers:
- `CLAUDE.md` (root)
- `server.ts`, `ui/`
- `.project/skills/*` or `demo/.project/skills/*`
- `.project/hooks/*` or `template/.project/hooks/*`
- `init.sh`
- `template/**`

README-only / doc-only / internal-issue changes don't strictly need a bump, but bumping is cheap and makes the update surface properly.

## Steps

1. Read the current `VERSION` file at the repo root. If missing, refuse and ask the user to create it.
2. Parse as semver `MAJOR.MINOR.PATCH`.
3. Determine new version from `$ARGUMENTS`:
   - `patch` (default if no arg): `1.1.0 → 1.1.1`
   - `minor`: `1.1.0 → 1.2.0`
   - `major`: `1.1.0 → 2.0.0`
   - Explicit `X.Y.Z`: use as-is (validate semver shape).
4. Write the new version to `VERSION` (root).
5. If `.project/VERSION` exists and we're in the tracker source repo (i.e. `template/.project/` exists), mirror the new version there too, since this repo is both source and self-install.
6. Report the old → new version and remind the user to include the bump in the commit that changes shipped files.

## Example

- `/bump-version` → patch bump (`1.1.0 → 1.1.1`)
- `/bump-version minor` → `1.1.0 → 1.2.0`
- `/bump-version 2.0.0` → set explicitly

## Safety

- Never bump in a consumer repo (no `template/` folder). Fail with a message pointing the user at `init.sh --update`.
- Never skip this step when shipping changes — the update-check hook is how users find out.
