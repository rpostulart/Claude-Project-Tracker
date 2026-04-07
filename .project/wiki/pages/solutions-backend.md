# Solutions — Backend

## [PROJ-1] Add issues_index.json for fast issue lookups by AI — 2026-04-07

**Problem:** AI had to glob all issue directories and read each `issue.json` individually to find recent issues. Slow and wasteful with many issues.
**Solution:** Added a central `.project/issues_index.json` that contains all issue metadata in a single file, sorted by `updated` descending. The index is maintained automatically by `server.ts` on every create/update/delete, and skills include instructions to update it too. A `rebuild-index` skill and API endpoint exist for manual recovery.
**Files:** `server.ts`, `demo/.project/skills/create-issue/SKILL.md`, `demo/.project/skills/update-status/SKILL.md`, `demo/.project/skills/add-comment/SKILL.md`, `demo/.project/skills/track-work/SKILL.md`, `demo/.project/skills/standup/SKILL.md`, `demo/.project/skills/rebuild-index/SKILL.md` (new), `CLAUDE.md`
**Key decision:** Full rewrite of the index on each mutation (not partial updates) — simple, reliable, and the file stays small even at 1000+ issues.

---
