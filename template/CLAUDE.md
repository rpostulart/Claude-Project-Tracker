<!-- .project -->
# .project — Git-Native Project Tracker

This repository uses `.project/` for issue tracking, wiki documentation, and project management.
All data lives as plain Markdown and JSON files — no external database or service needed.

## Steering Files — Project Context

Before starting any work, check if `.project/wiki/pages/` contains steering files (pages under the "Steering Files" parent in `_index.json`). These contain project-specific instructions like:
- Coding standards and conventions
- Architecture decisions and constraints
- Team roles and responsibilities
- Technology choices and restrictions

Read all steering file pages and follow their guidance. They take priority over your defaults. For example, if a steering file says "use Tailwind CSS", don't use inline styles. If it says "all APIs must return JSON envelopes", follow that pattern.

To check: read `.project/wiki/_index.json`, find pages with `"parent": "steering"`, then read each `.project/wiki/pages/{slug}.md`.

## MANDATORY: Track ALL Work as Issues

EVERY task that involves creating, modifying, or deleting files MUST be tracked in `.project/issues/`. No exceptions — even small tasks. This creates an audit trail that lets the team review past decisions and resume work on any ticket. If the user asks you to build, fix, add, change, or implement anything, create an issue FIRST before writing any code.

### New Ticket or Same Ticket?

Before starting work, analyze whether the user's request is part of the current issue or a new one.

**Same ticket** — add a comment and keep working:
- User gives feedback on what you just did: "make it bigger", "change the color", "that's broken, fix it"
- User asks for a tweak to the thing you just built: "also center it", "add a hover effect"
- User clarifies requirements: "I meant a dropdown menu, not tabs"

**New ticket** — create a new issue:
- User asks for something functionally different: "now add a contact form"
- User changes topic: "let's work on the API next"
- User requests a new feature, even if related: "add a header with navigation" (this is a separate deliverable from the page itself)

**How to decide:** Ask yourself — if this new request failed or needed to be reverted, would you revert the previous work too? If no, it's a separate ticket.

**Linking related tickets:** If the new ticket relates to a previous one, set `"parent": "PREV-ID"` in issue.json to create a subtask relationship.

**Examples:**
- "add a hello world page" → TEST-1
- "make the text red" → comment on TEST-1 (feedback on current work)
- "add a header with menu" → TEST-2 with parent TEST-1 (new deliverable)
- "the header menu is broken on mobile" → TEST-3 (bug report, separate ticket)

Comments on a ticket should only contain:
- Progress updates while working on THAT specific task
- What approach was chosen and why
- Which files were changed
- Problems encountered and solutions

### Before Starting Work

1. Read `.project/config.json` to get the project prefix and current issue counter
2. Search `.project/issues/*/issue.json` for any existing ticket matching the current task
3. If a matching ticket exists: read its `issue.json`, `description.md`, and all `comments/*.json` for full context
4. If no ticket exists: create one following the structure below

### Writing Good Descriptions

The `description.md` should be detailed enough that someone reading it months later understands what was asked and what was delivered. Include:

- **What was requested**: The user's original ask in their words
- **Acceptance criteria**: What "done" looks like — specific deliverables
- **Technical approach**: How you plan to implement it (before starting)
- **Context**: Why this was needed, what it relates to

Example:
```markdown
## What was requested
User asked for an HTML file that displays "Hello World" with a fancy layout.

## Acceptance criteria
- Single `index.html` file with inline CSS
- Visually appealing design (gradients, animations, modern typography)
- Responsive layout that works on mobile and desktop

## Technical approach
Create a standalone HTML file with CSS animations and modern design patterns.
No external dependencies — everything inline.
```

### While Working

1. Update the ticket status to `in-progress` in `issue.json`
2. Add comments as you work in `.project/issues/{ID}/comments/{NNN}.json`:
   - What approach you chose and why
   - Which files you created or modified
   - Problems encountered and how you solved them
   - Decisions made and their rationale
3. Each comment file follows this format:
   ```json
   {
     "id": "NNN",
     "author": "Claude Code",
     "content": "Description of what was done...",
     "created": "2026-03-25T10:00:00.000Z"
   }
   ```
4. Find the next comment number by checking existing files in the `comments/` directory

### Definition of Done (required for every issue)

An issue may ONLY be marked as `done` when ALL of these are complete:
- [ ] Code changes implemented and working
- [ ] Summary comment added to issue
- [ ] Wiki Solution Log entry created
- [ ] Technical docs updated (if architecture changed)
- [ ] User Guide updated (if user-facing change)
- [ ] Wiki page links added to issue comment
- [ ] Issue status set to `done`

If ANY checkbox is incomplete, the issue status MUST remain `review`.

### MANDATORY Todo Steps (in order)

Every task MUST follow this exact sequence. Do NOT skip or reorder steps.

1. Create/find issue
2. Set status to `in-progress`
3. Implementation steps
4. Add summary comment to issue listing all changes and files modified
5. **BLOCKING: Document in wiki** (this step MUST happen before step 7)
   - Always: Solution Log entry via `/document-completion`
   - If architecture/API changed: Technical Docs
   - If user-facing: User Guide
   - If non-obvious decision made: Decision Record
6. Add wiki page links to issue comment
7. Mark issue as `done`

**Step 5 is non-negotiable.** Do NOT mark an issue as done without completing documentation. This is the most commonly skipped step. Include it explicitly in your todo list every time.

### Commit Messages

Include the ticket ID in your commit message:
- `feat(module): add feature description [PROJ-12]`
- `fix(module): fix bug description [PROJ-5]`
- `docs: update deployment wiki [PROJ-8]`

### When Asked About Past Work

When a user references a ticket (e.g., "look at PROJ-5", "what happened with the login bug"):
1. Read `.project/issues/{ID}/issue.json` for metadata
2. Read `.project/issues/{ID}/description.md` for the original problem
3. Read all files in `.project/issues/{ID}/comments/` for the full history
4. Summarize the timeline: what was done, by whom, which files were changed, and the outcome

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

### .project/issues/{ID}/description.md
Plain markdown describing the issue in detail.

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
- `/document-completion` — Auto-documents completed issues in the wiki (runs automatically when issues are done)

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
<!-- /.project -->
