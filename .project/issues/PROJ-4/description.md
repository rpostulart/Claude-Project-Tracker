# Fix multi-user issue ID collisions by adding per-user slugs and counters

## Problem
When multiple team members use the `.project` tracker independently, they each have a local `nextId` counter in `config.json`. Two people creating issues offline both get the same ID (e.g., `PROJ-4`), causing git merge conflicts on push.

## Acceptance Criteria
- Issue IDs include a per-user slug (e.g., `PROJ-rp-1`) to prevent collisions
- Each user has their own counter file so `config.json` is no longer a conflict point
- `issues_index.json` is gitignored and rebuilt on startup to eliminate index conflicts
- Existing `PROJ-N` style issues remain accessible (backward compatible)
- New team members can register with a unique slug

## Technical Approach
- Add `slug` field to team entries in `config.json`
- Create `.project/counters/{slug}.json` per-user counter files
- Update `createIssue()` in `server.ts` to use per-user counters
- Update ID regex patterns to match both old and new formats
- Gitignore `issues_index.json`
- Update skills (`create-issue`, `track-work`) for new counter logic
