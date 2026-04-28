---
name: add-comment
description: Add a comment to an issue.
argument-hint: <ISSUE-ID> <comment>
allowed-tools: Read, Write, Glob
---

Add a comment to an existing issue.

## Style rules (apply to `content`)

Keep comments short. Future sessions re-read these — every word costs tokens.

- ≤ 8 bullets, ≤ 600 chars total per comment.
- Lead with what changed; skip narration of attempts that didn't ship.
- No typecheck/test transcripts, no full file lists, no celebratory recap.
- File refs: `path:line` format only when load-bearing.
- If you exceed 600 chars, split into a wiki page and link to it instead.

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
