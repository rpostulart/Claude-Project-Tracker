---
name: create-issue
description: Create a new issue (ticket, bug, feature request).
argument-hint: <title>
allowed-tools: Read, Write, Glob, Grep, Edit, Bash
---

Create a new issue in the project tracker.

## Steps

1. Read `.project/config.json` to get the project prefix and team info
2. Determine your user slug:
   - Check `PROJECT_SLUG` env var (run `echo $PROJECT_SLUG` if needed)
   - Or find your email in the config team array and use the `slug` field
   - If no slug found, tell the user to run `init.sh --update` to register
3. Read `.project/counters/{slug}.json` for your next issue number (create the file with `{"nextId": 1}` if it doesn't exist)
4. Create a new folder `.project/issues/{PREFIX}-{slug}-{NUMBER}/`
5. Create `issue.json` with:
   - id (format: `PREFIX-slug-NUMBER`, e.g. `PROJ-rp-1`), title, type (feature/bug/task), status (backlog), priority (medium)
   - assignee from USER_EMAIL env var (or "unassigned")
   - author: USER_EMAIL env var, or "Claude Code" if created by AI
   - created/updated timestamps
6. Create `description.md` with the issue title as heading. Include only sections with real content — "What was requested" is the one consistent requirement. Skip empty "Acceptance criteria / Technical approach / Context" stubs.
7. Increment the issue counter in `.project/counters/{slug}.json` (NOT in config.json)
8. **Update issues index**: Read `.project/issues_index.json` (create as `[]` if missing). Add an entry with: `id`, `title`, `type`, `status`, `priority`, `assignee`, `labels`, `parent`, `created`, `updated`. Sort by `updated` descending. Write back.
9. Report the created issue ID

## Example

`/create-issue Fix login redirect loop` creates a new bug in backlog with ID like `PROJ-rp-1`.
