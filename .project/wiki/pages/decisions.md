# Decision Records

## 2026-04-08 — Per-user slugs for issue ID collision prevention

**Context:** When multiple team members use `.project` independently, they share a single `nextId` counter in `config.json`. Two people creating issues offline both get the same ID, causing git merge conflicts on push. A second collision point was `issues_index.json` (single JSON array).
**Decision:** Add per-user 2-4 letter slugs to issue IDs (`PROJ-rp-5`) with per-user counter files in `.project/counters/`. Gitignore `issues_index.json` (rebuilt on startup).
**Alternatives considered:**
- UUID suffixes (collision-proof but not human-readable, can't reference verbally)
- Timestamp-based IDs like `PROJ-20260408-001` (long, daily counter still needs tracking)
- Central counter server (defeats the offline/git-native design)
**Consequences:** Issue IDs are slightly longer but still verbal-friendly. Each user writes their own files, so no coordination needed. Legacy `PROJ-N` issues remain accessible. New team members must register via `init.sh` (interactive prompt for slug).

---

## 2026-04-07 — Simplify wiki to 3 doc types, drop Solution Logs

**Context:** In practice, the same information (problem, solution, files changed, key decision) was duplicated 3-4x across issue comments, solution logs, technical docs, and decision records. Solution logs in particular were a 1:1 copy of what issue comments already captured.
**Decision:** Reduce from 4 doc types to 3: Functional (user perspective), Technical (architecture), Decisions (non-obvious choices). Issue comments serve as the solution log — no separate wiki page needed.
**Alternatives considered:**
- Keep all 4 types but auto-generate solution logs from comments (reduces manual work but still duplicates)
- Merge solution logs into technical docs (awkward fit — different audiences)
**Consequences:** Less documentation overhead per issue. Issue comments become the canonical work log. Trade-off: no standalone searchable "what changed" archive in the wiki, but `issues_index.json` + issue comments fill that role.

---
