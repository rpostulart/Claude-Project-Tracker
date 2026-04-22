---
name: create-issue
description: Create a new issue (ticket, bug, feature request).
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
4. Create `description.md` with the issue title as heading. Include only sections with real content — "What was requested" is the one consistent requirement. Skip empty "Acceptance criteria / Technical approach / Context" stubs.
5. Increment the issue counter in config.json
6. Report the created issue ID

## Example

`/create-issue Fix login redirect loop` creates a new bug in backlog.
