# Decision Records

## 2026-04-22 — Split tracker workflow: terse CLAUDE.md + steering wiki page

**Context:** The always-loaded `CLAUDE.md` had grown to 226 lines covering golden rules, full workflow, DoD checklist, file formats, same-vs-new-ticket rules, description templates, and sync commands. Every turn — even trivial ones — paid ~2k tokens for content only needed when actively doing tracker work. Combined with skill `description` frontmatter (also always loaded), the tracker's "idle cost" was ~2.6k tokens per message.
**Decision:** Slim `CLAUDE.md` to ~40 lines covering only golden rules, one-line workflow, lookup order, and a pointer. Move the full detail to `.project/wiki/pages/steering-tracker-workflow.md` under the existing `steering` parent. Steering pages are read on demand, not on every turn.
**Alternatives considered:**
- Leave CLAUDE.md intact (status quo — costly on every turn)
- Split into multiple CLAUDE.md-like files (still all always-loaded)
- External RAG/vector search over docs (overkill for a small tracker)
**Consequences:** ~80% reduction in always-loaded tracker overhead. Risk: Claude skips reading the steering page when it should. Mitigation: CLAUDE.md explicitly points to it for workflow questions, and hook failures still reference the detailed rules.

---

## 2026-04-22 — Progressive comment loading in review-ticket and track-work

**Context:** `review-ticket` and `track-work` read *all* comments for an issue. For long-lived tickets (e.g. PROJ-rp-10 has many comments) this blows up context proportional to issue age. Most of the time the user asks about recent activity, not full history.
**Decision:** Both skills now read `issue.json` + `description.md` + the **last 3 comments** by default. Older comments are fetched only when referenced or explicitly requested. Subtask lookup uses `issues_index.json`, never a directory scan.
**Alternatives considered:**
- Server-maintained `summary` field in `issue.json` (requires server changes, staleness risk)
- Keep "read all" behavior (simpler, but scales badly)
- Pagination (adds UX complexity for rare use case)
**Consequences:** Saves 500–3k tokens per invocation on mature issues. Risk: Claude sometimes misses older context when the last 3 comments are not self-sufficient. Mitigation: the skill explicitly instructs to fetch older comments when references are ambiguous or the user asks for "full history".

---

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
