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
4. Create `{number}.json` with:
   - author: "Claude Code"
   - text: $ARGUMENTS (everything after the issue ID)
   - created timestamp
5. Update `issue.json` updated timestamp
