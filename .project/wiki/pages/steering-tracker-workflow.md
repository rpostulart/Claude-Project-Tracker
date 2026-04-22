# Tracker Workflow (Detailed)

This is the full detail behind the terse workflow in `CLAUDE.md`. Read this when starting work that touches the tracker, or when a hook mentions a rule you don't remember.

## Decide: does the task need an issue?

- **YES** (create issue first): features, bugfixes, refactors, config changes, anything that modifies files non-trivially.
- **NO** (just do it): answering questions, typos, formatting, research, code review without changes.

Questions can still trigger a wiki update if the answer reveals a non-obvious decision, pattern, or gotcha worth documenting.

## Mandatory sequence

1. Create or find the issue (`/create-issue` or `/track-work`).
2. Set status `in-progress`.
3. Implement; add progress comments as you work.
4. Write a summary comment listing changes and files touched.
5. **Document in wiki** via `/document-completion` — at least one of: functional doc (user-facing), technical doc (architecture), decision record (non-obvious choice).
6. Add wiki page links as a comment on the issue.
7. Only now mark the issue `done` — and only after the user confirms.

Step 5 is blocking. If you're about to mark an issue done without having run `/document-completion`, stop.

## New ticket or same ticket?

Same ticket (add a comment, keep working):
- Feedback on current work: "make it bigger", "change the color", "fix that"
- Tweaks: "also center it", "add hover effect"
- Clarifications: "I meant a dropdown, not tabs"

New ticket:
- Functionally different request ("now add a contact form")
- Topic change ("let's work on the API next")
- New feature, even if related

Rule of thumb: if the new request failed, would you revert the previous work? If no → new ticket.

## When not to mark done

Keep `in-progress` while the user is iterating. When you think you're done, ask:
> "I've completed [summary]. Shall I mark [ISSUE-ID] as done and update the documentation?"

Only move to done after explicit user confirmation or when they move to a completely different topic.

## Before starting work — lookup order

1. Read `.project/config.json` for prefix and team info.
2. Resolve your slug (from `PROJECT_SLUG` env var, or your email in the team array).
3. Read `.project/issues_index.json` to find a matching existing ticket. If the index is missing or stale, run `/rebuild-index` — do not scan `issues/*/issue.json` by hand.
4. If an issue matches: read `issue.json`, `description.md`, and the **last 3** comments first. Only load older comments if the summary is insufficient.
5. If no match: read `.project/counters/{slug}.json`, create the issue with ID `{PREFIX}-{slug}-{N}`, increment the counter.

## Writing descriptions

Only include sections that have real content. Don't emit empty "Acceptance criteria: TBD" stubs. Typical sections:

- **What was requested** — the user's original ask (almost always present).
- **Acceptance criteria** — what "done" looks like (include if non-obvious).
- **Technical approach** — implementation plan (include if non-trivial).
- **Context** — why this is needed (include if motivation isn't obvious).

## File formats

### `.project/issues/{ID}/issue.json`
```json
{
  "id": "PROJ-rp-1",
  "title": "Short description",
  "type": "feature|bug|task|epic",
  "status": "backlog|todo|in-progress|review|done",
  "priority": "critical|high|medium|low",
  "assignee": "email@example.com",
  "labels": ["ui", "backend"],
  "parent": null,
  "related": ["PROJ-rp-3"],
  "created": "2026-03-25T10:00:00.000Z",
  "updated": "2026-03-25T10:00:00.000Z"
}
```

IDs follow `{PREFIX}-{slug}-{N}`. Legacy `{PREFIX}-{N}` issues still exist.

### `.project/issues/{ID}/comments/NNN.json`
```json
{
  "id": "001",
  "author": "Claude Code",
  "content": "Markdown describing what was done",
  "created": "2026-03-25T10:00:00.000Z"
}
```

### `.project/issues_index.json`
Central, sorted-by-updated index. Gitignored and rebuilt on server start — the authoritative lookup path. Never bypass it with a directory scan.

### `.project/counters/{slug}.json`
Per-user counter: `{"nextId": 5}`.

## Available skills

- `/create-issue <title>` — new issue
- `/update-status <ID> <status>` — change status
- `/add-comment <ID> <text>` — comment
- `/track-work <ID or title>` — tracked work with audit trail
- `/review-ticket <ID>` — ticket history
- `/standup` — recent activity
- `/wiki-update <title>` — create/update wiki page
- `/rebuild-index` — rebuild issue index
- `/document-completion` — **step 5**; document completed work

## Commit messages

Include the ticket ID: `feat(module): description [PROJ-rp-12]`.

## Sync template after changes

This repo ships the `.project` source. When you change `ui/`, `server.ts`, `CLAUDE.md`, or `demo/.project/skills/`, run:

```
rsync -av --delete ui/ template/.project/ui/
cp server.ts template/.project/server.ts
cp CLAUDE.md template/CLAUDE.md
rsync -av demo/.project/skills/ template/.project/skills/
```
