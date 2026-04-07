<!-- .project -->
# .project — Git-Native Project Tracker

## GOLDEN RULES (never skip, even after long conversations)

1. **Features, bugs, and refactors → create .project issue FIRST** (trivial edits like typos don't need one)
2. **Completed issues → update wiki BEFORE marking done** (unless labeled "skip-docs")
3. **Include ticket ID in commits**: `fix(module): description [PROJ-5]`
4. **Ask the user before marking done** — don't assume the task is finished

Hooks enforce rules 1 and 2 automatically. If you get blocked, follow the hook's instructions.

### Before ANY Implementation

Decide: does this task need an issue?
- **YES** (create issue first): features, bugfixes, refactors, config changes, anything non-trivial
- **NO** (just do it): answering questions, typos, formatting, trivial edits, research

If yes: read `.project/config.json`, create the issue, set to `in-progress`, then start coding.

## MANDATORY Workflow (exact sequence, never skip or reorder)

```
1. Create/find issue          → /create-issue or /track-work
2. Set status in-progress     → update issue.json
3. Implement                  → code changes, add comments as you work
4. Summary comment            → list all changes and files modified
5. ⛔ DOCUMENT IN WIKI ⛔     → BLOCKING: must happen before step 7
   - If user-facing:          Functional Doc   → /document-completion
   - If architecture changed: Technical Doc    → /document-completion
   - If non-obvious decision: Decision Record  → /document-completion
6. Link wiki in issue         → add comment with wiki page links
7. Mark done                  → only after ALL above are complete
```

**Step 5 is non-negotiable.** At least one doc type should be created per issue. If you find yourself about to mark an issue as done, STOP and check: did you run `/document-completion`?

### Definition of Done Checklist

An issue may ONLY be marked as `done` when ALL of these are complete:
- [ ] Code changes implemented and working
- [ ] Summary comment added to issue
- [ ] Wiki documented via `/document-completion` (functional, technical, and/or decisions)
- [ ] Wiki page links added to issue comment

If ANY checkbox is incomplete, the issue status MUST remain `review`.

---

## Steering Files — Project Context

Before starting any work, check `.project/wiki/pages/` for steering files (pages with `"parent": "steering"` in `_index.json`). These contain project-specific coding standards, architecture decisions, and conventions. They take priority over your defaults.

To check: read `.project/wiki/_index.json`, find pages with `"parent": "steering"`, then read each `.project/wiki/pages/{slug}.md`.

## When Issues Are Needed (and When Not)

**Needs an issue** (changes files):
- Building a feature, fixing a bug, refactoring code
- Changing configuration, adding dependencies
- Any task where files are created, modified, or deleted

**Does NOT need an issue** (read-only):
- Answering questions: "how does the payment flow work?"
- Explaining code: "what does this function do?"
- Research: "which files handle authentication?"
- Code review without changes

**But questions CAN trigger wiki updates:** If you answer a question and realize the answer should be documented (architecture decisions, non-obvious patterns, gotchas), update the wiki even without an issue.

### When NOT to Mark Done

Keep the issue `in-progress` while the user is still iterating.

**When you think you're done with a task, ASK the user:**
> "I've completed [summary]. Shall I mark [ISSUE-ID] as done and update the documentation?"

Only mark `done` when:
- The user explicitly confirms they're satisfied
- The user moves to a completely different topic

Do NOT mark done after implementing — always ask first. The user will often say "make it red", "also add X", "that's broken" — these are all part of the same in-progress issue.

**After user confirms done:**
1. Run `/document-completion` to update wiki
2. Add wiki links as comment on the issue
3. THEN mark the issue as done

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
2. Read `.project/issues_index.json` to search for existing matching ticket (fall back to scanning `.project/issues/*/issue.json` if missing)
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

### .project/issues_index.json
Central index of all issues, sorted by `updated` descending. Read this file instead of scanning all issue directories. Maintained automatically by the server and skills.
```json
[
  {
    "id": "PROJ-1",
    "title": "Short description",
    "type": "feature",
    "status": "in-progress",
    "priority": "medium",
    "assignee": "email@example.com",
    "labels": ["backend"],
    "parent": null,
    "created": "2026-03-25T10:00:00.000Z",
    "updated": "2026-03-25T10:00:00.000Z"
  }
]
```

## Available Skills

- `/create-issue <title>` — Create a new issue
- `/update-status <ID> <status>` — Change issue status
- `/add-comment <ID> <text>` — Add a comment to an issue
- `/track-work <ID or title>` — Start tracked work with full audit trail
- `/review-ticket <ID>` — Review a ticket's complete history
- `/standup` — Summarize recent activity
- `/wiki-update <title>` — Create or update a wiki page
- `/rebuild-index` — Rebuild issues index from issue files
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
