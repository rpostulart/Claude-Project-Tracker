# PROJ-rp-15 — Skills emit TOON + filtered index reads to cut token cost

## What was requested

Reduce token consumption of `.project` tracker skills without breaking tracking validity. Plan approved in `~/.claude/plans/i-ask-this-can-mellow-squid.md`.

## Scope

- `track-work`, `standup`, `review-ticket`, `document-completion`: stop dumping full `issues_index.json`; use `jq` to emit TOON-shaped, filtered output.
- `document-completion`, `add-comment`: enforce concise comments and short businesslike outros (≤ 8 bullets, ≤ 600 chars per comment; outro 2–4 lines).
- Sync `demo/.project/skills/` → `template/.project/skills/` and this repo's `.project/skills/`.
- `/bump-version` so existing installs are notified.

## Out of scope

- Hook changes, CLAUDE.md edits, SQLite migration, custom binaries.
