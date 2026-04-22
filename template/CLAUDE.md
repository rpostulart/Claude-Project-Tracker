<!-- .project -->
# .project — Git-Native Project Tracker

## Golden rules

1. **Non-trivial change → create an issue first.** Trivial edits (typos, formatting) don't need one. Questions don't need one, but may still trigger a wiki update.
2. **Wiki before done.** Run `/document-completion` before marking an issue `done` (unless labeled `skip-docs`).
3. **Ticket ID in commits:** `feat(module): description [PROJ-rp-12]`.
4. **Ask before marking done.** The user is likely still iterating.

Hooks enforce rules 1 and 2. If blocked, follow the hook's instructions.

## Workflow in one line

Create/find issue → `in-progress` → implement (add comments as you go) → summary comment → `/document-completion` → link wiki in issue comment → ask user, then `done`.

## Lookup order

1. `.project/config.json` for prefix and team.
2. Resolve your slug (`PROJECT_SLUG` env, or your email in the team array).
3. `.project/issues_index.json` to find matching ticket. If the index is missing or stale, run `/rebuild-index` — **do not scan `issues/*/issue.json` by hand**.
4. Existing issue: read `issue.json` + `description.md` + the **last 3 comments**. Fetch older comments only if that's insufficient.
5. New issue: read `.project/counters/{slug}.json`, create `{PREFIX}-{slug}-{N}`, increment counter.

## Detail lives in the steering wiki

For file formats, "same ticket vs new ticket" rules, when-not-to-mark-done, description templates, and the full skill list, read `.project/wiki/pages/steering-tracker-workflow.md`. Check that page first when a workflow question comes up — don't guess from memory.

## Descriptions: only non-empty sections

Don't emit stub sections like "Acceptance criteria: TBD". Include a section only when it has real content. The "What was requested" line is the one consistent requirement.

## Sync template after changes

When you change `ui/`, `server.ts`, `CLAUDE.md`, or `demo/.project/skills/`, sync to `template/` — see the steering page for exact commands.

> **Reminder:** issue → implement → document → ask → done. Never skip documentation.
<!-- /.project -->
