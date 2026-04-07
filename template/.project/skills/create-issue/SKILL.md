---
name: create-issue
description: Create a new issue in .project/issues/. Use when the user asks to create a ticket, issue, bug report, or feature request.
argument-hint: <title>
allowed-tools: Read, Write, Glob, Grep, Edit
---

Create a new issue in the project tracker.

## Steps

1. Read `.project/config.json` to get the project prefix and next issue number
2. Create a new folder `.project/issues/{PREFIX}-{NUMBER}/`
3. Create `issue.json` with:
   - id, title, type (feature/bug/task), status (backlog), priority (medium)
   - assignee from USER_EMAIL env var (or "unassigned")
   - author: USER_EMAIL env var, or "Claude Code" if created by AI
   - created/updated timestamps
4. Create `description.md` with the issue title as heading
5. Increment the issue counter in config.json
6. **Update issues index**: Read `.project/issues_index.json` (create as `[]` if missing). Add an entry with: `id`, `title`, `type`, `status`, `priority`, `assignee`, `labels`, `parent`, `created`, `updated`. Sort by `updated` descending. Write back.
7. Report the created issue ID

## Example

`/create-issue Fix login redirect loop` creates a new bug in backlog.
