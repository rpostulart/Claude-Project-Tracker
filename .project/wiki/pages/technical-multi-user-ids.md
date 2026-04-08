# Multi-User Issue IDs

## Overview

Issue IDs include a per-user slug to prevent collisions when multiple team members create issues independently. Format: `{PREFIX}-{slug}-{N}` (e.g., `PROJ-rp-5`).

## How It Works

1. Each team member has a unique 2-4 letter slug stored in `.env` (`PROJECT_SLUG=rp`) and in the config team array
2. Per-user counter files in `.project/counters/{slug}.json` track each user's next issue number
3. `createIssue()` in `server.ts` reads the user's slug and counter, generates `PREFIX-slug-N`, and increments only that user's counter
4. Since different users write to different counter files, git merge conflicts are eliminated

## Registration Flow

`init.sh` handles user registration interactively:
- Prompts for email (default: `git config user.email`) and slug (default: initials)
- Validates slug is 2-4 lowercase letters and unique in the team
- Writes `PROJECT_SLUG` to `.env` (gitignored) and adds user to config team array
- Creates `.project/counters/{slug}.json` seeded at current `nextId` for migration

On `--update`, checks if `.env` has `PROJECT_SLUG` and prompts if missing.

## Configuration

- `.env`: `PROJECT_SLUG=rp` — user's local slug (gitignored)
- `.project/config.json` team array: `{"name": "...", "email": "...", "slug": "rp"}` — committed to git
- `.project/counters/{slug}.json`: `{"nextId": N}` — per-user counter file

## Slug Resolution in Server

`getCurrentUserSlug()` resolves the slug:
1. `PROJECT_SLUG` env var (preferred)
2. Look up `CURRENT_USER` email in config team array
3. Throw error with registration instructions if not found

## Backward Compatibility

- Regex patterns match both `PROJ-4` (legacy) and `PROJ-rp-4` (new): `[A-Z][A-Za-z0-9-]+-\d+`
- Existing issues remain untouched
- `issues_index.json` is gitignored and rebuilt on server startup to eliminate merge conflicts
