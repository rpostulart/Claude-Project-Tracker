---
name: add-comment
description: Add a comment to an issue. Use when asked to comment on a ticket or add notes to an issue.
argument-hint: <ISSUE-ID> <comment>
allowed-tools: Read, Write, Glob
---

Add a comment to an existing issue.

## Steps

1. Read `.project/issues/$1/issue.json` to verify it exists
2. Create `.project/issues/$1/comments/` if it doesn't exist
3. Find the next comment number
4. Create `{number}.json` with ALL of these fields (all required):
   - `id`: zero-padded comment number (e.g. "001")
   - `author`: "Claude Code"
   - `content`: $ARGUMENTS (everything after the issue ID)
   - `created`: current ISO-8601 timestamp — REQUIRED, omitting this breaks the issue API
5. Update `issue.json` updated timestamp
6. **Update issues index**: Read `.project/issues_index.json` (create as `[]` if missing). Replace the entry with matching `id` (or add if missing) using all fields from `issue.json`. Sort by `updated` descending. Write back.
