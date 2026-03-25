<!-- .project -->
# .project — Git-Native Project Tracker

This repository uses `.project/` for issue tracking, wiki documentation, and project management.
All data lives as plain Markdown and JSON files — no external database or service needed.

## MANDATORY: Track ALL Work as Issues

EVERY task that involves creating, modifying, or deleting files MUST be tracked in `.project/issues/`. No exceptions — even small tasks. This creates an audit trail that lets the team review past decisions and resume work on any ticket. If the user asks you to build, fix, add, change, or implement anything, create an issue FIRST before writing any code.

### Before Starting Work

1. Read `.project/config.json` to get the project prefix and current issue counter
2. Search `.project/issues/*/issue.json` for any existing ticket matching the current task
3. If a matching ticket exists: read its `issue.json`, `description.md`, and all `comments/*.json` for full context
4. If no ticket exists: create one following the structure below

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

### When Finishing

1. Add a final summary comment listing all changes made and files modified
2. Update the ticket status to `review` (if human review needed) or `done`
3. Include the ticket ID in your commit message: `fix(auth): resolve login timeout [PROJ-5]`
4. **Document the solution**: Create or update a wiki page under `solutions-{label}` with the problem, solution, and files changed. Add a link to the wiki page in the issue description and a comment referencing it. This builds a searchable knowledge base of past solutions.

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

## Commit Message Format

Always include the ticket ID when working on a tracked issue:
- `feat(module): add feature description [PROJ-12]`
- `fix(module): fix bug description [PROJ-5]`
- `docs: update deployment wiki [PROJ-8]`

## Available Skills

- `/create-issue <title>` — Create a new issue
- `/update-status <ID> <status>` — Change issue status
- `/add-comment <ID> <text>` — Add a comment to an issue
- `/track-work <ID or title>` — Start tracked work with full audit trail
- `/review-ticket <ID>` — Review a ticket's complete history
- `/standup` — Summarize recent activity
- `/wiki-update <title>` — Create or update a wiki page
- `/document-completion` — Auto-documents completed issues in the wiki (runs automatically when issues are done)
<!-- /.project -->
