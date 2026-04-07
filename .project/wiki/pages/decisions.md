# Decision Records

## 2026-04-07 — Simplify wiki to 3 doc types, drop Solution Logs

**Context:** In practice, the same information (problem, solution, files changed, key decision) was duplicated 3-4x across issue comments, solution logs, technical docs, and decision records. Solution logs in particular were a 1:1 copy of what issue comments already captured.
**Decision:** Reduce from 4 doc types to 3: Functional (user perspective), Technical (architecture), Decisions (non-obvious choices). Issue comments serve as the solution log — no separate wiki page needed.
**Alternatives considered:**
- Keep all 4 types but auto-generate solution logs from comments (reduces manual work but still duplicates)
- Merge solution logs into technical docs (awkward fit — different audiences)
**Consequences:** Less documentation overhead per issue. Issue comments become the canonical work log. Trade-off: no standalone searchable "what changed" archive in the wiki, but `issues_index.json` + issue comments fill that role.

---
