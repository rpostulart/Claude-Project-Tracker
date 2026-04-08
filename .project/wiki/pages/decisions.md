# Decision Records

## 2026-04-08 — Store todos as comment-type extension, not a separate data structure

**Context:** Needed a way to add actionable todo items to issues. Could either create a dedicated `todos/` directory per issue (like `comments/`), add a `todos` array to `issue.json`, or extend the existing comment system.
**Decision:** Extend comments with a `type: "todo"` field and a `done` boolean. Todos are stored as regular comment JSON files in the existing `comments/` directory.
**Alternatives considered:**
- Separate `todos/` directory per issue (clean separation but duplicates the comment infrastructure — numbering, timestamps, author tracking)
- `todos` array in `issue.json` (simple but makes issue.json grow unboundedly, loses per-item timestamps/authors)
- Markdown checklists in `description.md` (already supported for rendering, but no structured data for aggregation or API-level toggling)
**Consequences:** Zero-cost migration — existing comments work unchanged. The `GET /api/todos` endpoint must scan all issue directories (acceptable for git-native project scale). Comment rendering logic needs a conditional branch for todo-type display. Todos and comments share a single chronological timeline per issue.

---

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
