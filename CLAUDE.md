<!-- .project -->
# .project — Git-Native Project Tracker

## GOLDEN RULES (never skip, even after long conversations)

1. **EVERY task that changes files → create .project issue FIRST**
2. **EVERY completed issue → update wiki BEFORE marking done** (solution log + docs)
3. **EVERY commit → include ticket ID**: `fix(module): description [PROJ-5]`
4. **EVERY todo list → must include "document in wiki" step before "mark done"**

Violating these rules breaks the audit trail. No exceptions for "quick fixes".

### Before ANY Implementation

Stop. Answer these before writing code:
- [ ] Is there a `.project` issue for this? If not → `/create-issue` NOW
- [ ] Is the issue status set to `in-progress`?
- [ ] Does my todo list include "document in wiki" as a step BEFORE marking done?

If any answer is "no", fix it before proceeding.

## MANDATORY Workflow (exact sequence, never skip or reorder)

```
1. Create/find issue          → /create-issue or /track-work
2. Set status in-progress     → update issue.json
3. Implement                  → code changes, add comments as you work
4. Summary comment            → list all changes and files modified
5. ⛔ DOCUMENT IN WIKI ⛔     → BLOCKING: must happen before step 7
   - Always: Solution Log     → /document-completion
   - If architecture changed: Technical Docs
   - If user-facing:          User Guide
   - If non-obvious decision: Decision Record
6. Link wiki in issue         → add comment with wiki page links
7. Mark done                  → only after ALL above are complete
```

**Step 5 is non-negotiable.** This is the most commonly skipped step. If you find yourself about to mark an issue as done, STOP and check: did you run `/document-completion`?

### Definition of Done Checklist

An issue may ONLY be marked as `done` when ALL of these are complete:
- [ ] Code changes implemented and working
- [ ] Summary comment added to issue
- [ ] Wiki Solution Log entry created
- [ ] Technical docs updated (if architecture changed)
- [ ] User Guide updated (if user-facing change)
- [ ] Wiki page links added to issue comment

If ANY checkbox is incomplete, the issue status MUST remain `review`.

---

## Steering Files — Project Context

Before starting any work, check `.project/wiki/pages/` for steering files (pages with `"parent": "steering"` in `_index.json`). These contain project-specific coding standards, architecture decisions, and conventions. They take priority over your defaults.

To check: read `.project/wiki/_index.json`, find pages with `"parent": "steering"`, then read each `.project/wiki/pages/{slug}.md`.

## Issue Tracking Details

### New Ticket or Same Ticket?

**Same ticket** (add a comment, keep working):
- Feedback on current work: "make it bigger", "change the color", "fix that"
- Tweaks to what you just built: "also center it", "add hover effect"
- Clarifications: "I meant a dropdown, not tabs"

**New ticket** (create a new issue):
- Functionally different request: "now add a contact form"
- Topic change: "let's work on the API next"
- New feature, even if related: "add a header with navigation"

**Rule of thumb:** If the new request failed, would you revert the previous work too? If no → separate ticket.

### Before Starting Work

1. Read `.project/config.json` for project prefix and issue counter
2. Search `.project/issues/*/issue.json` for existing matching ticket
3. If exists: read `issue.json`, `description.md`, and `comments/*.json` for full context
4. If not: create one with detailed `description.md`

### Writing Good Descriptions

Include in `description.md`:
- **What was requested**: User's original ask
- **Acceptance criteria**: What "done" looks like
- **Technical approach**: How you plan to implement
- **Context**: Why this is needed

### While Working

1. Set status to `in-progress`
2. Add comments in `.project/issues/{ID}/comments/{NNN}.json` as you work
3. Track: approach chosen, files changed, problems encountered, decisions made

> **REMINDER**: Is "document in wiki" in your todo list? If not, add it NOW.

### When Asked About Past Work

1. Read `.project/issues/{ID}/issue.json` for metadata
2. Read `.project/issues/{ID}/description.md` for the original problem
3. Read all `comments/*.json` for the full history
4. Summarize: what was done, by whom, which files, and the outcome

## File Formats

### .project/issues/{ID}/issue.json
```json
{
  "id": "PROJ-1",
  "title": "Short description",
  "type": "feature|bug|task|epic",
  "status": "backlog|todo|in-progress|review|done",
  "priority": "critical|high|medium|low",
  "assignee": "email@example.com",
  "labels": ["ui", "backend"],
  "parent": null,
  "created": "2026-03-25T10:00:00.000Z",
  "updated": "2026-03-25T10:00:00.000Z"
}
```

### .project/issues/{ID}/comments/NNN.json
```json
{
  "id": "001",
  "author": "Claude Code",
  "content": "Markdown text describing what was done",
  "created": "2026-03-25T10:00:00.000Z"
}
```

## Available Skills

- `/create-issue <title>` — Create a new issue
- `/update-status <ID> <status>` — Change issue status
- `/add-comment <ID> <text>` — Add a comment to an issue
- `/track-work <ID or title>` — Start tracked work with full audit trail
- `/review-ticket <ID>` — Review a ticket's complete history
- `/standup` — Summarize recent activity
- `/wiki-update <title>` — Create or update a wiki page
- `/document-completion` — Document completed work in wiki **(use this for step 5)**

## Commit Messages

Include ticket ID: `feat(module): description [PROJ-12]` | `fix(module): description [PROJ-5]`

## MANDATORY: Sync Template After Changes

This repo contains the source code for the `.project` system. When you modify any of these files:
- `ui/` (frontend code)
- `server.ts` (backend)
- `CLAUDE.md` (instructions)
- `demo/.project/skills/` (skill definitions)

You MUST sync the changes to the template folder so `init.sh` installs the latest version:

1. **UI and server**: `rsync -av --delete ui/ template/.project/ui/` and `cp server.ts template/.project/server.ts`
2. **CLAUDE.md**: `cp CLAUDE.md template/CLAUDE.md`
3. **Skills**: `rsync -av demo/.project/skills/ template/.project/skills/`

Do this as the last step after verifying changes work. Include it in your todo list when working on this repo.

> **FINAL REMINDER**: Issue → implement → document in wiki → THEN mark done. Never skip documentation.
<!-- /.project -->
