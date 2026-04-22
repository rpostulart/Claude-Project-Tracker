---
name: track-work
description: Start tracked work: find/create ticket, set in-progress, track progress in comments.
argument-hint: <ISSUE-ID or title>
allowed-tools: Read, Write, Edit, Glob, Grep
---

Begin tracked work on an issue with full audit trail.

## Steps

1. If `$ARGUMENTS` looks like an issue ID:
   - Read `.project/issues/$1/issue.json` and `description.md`
   - Read only the **last 3** comments from `.project/issues/$1/comments/` (highest-numbered filenames). Fetch older comments only if they're referenced or the user asks.
   - Summarize to the user

2. If `$ARGUMENTS` is a title:
   - Search `.project/issues_index.json` for matching titles (do not scan `issues/*/issue.json` by hand)
   - If a match is found, use that issue
   - If no match, create a new issue:
     - Read `.project/config.json` for prefix and nextId
     - Create `.project/issues/{PREFIX}-{N}/issue.json` with status "in-progress"
     - Create `.project/issues/{PREFIX}-{N}/description.md`
     - Increment nextId in config.json

3. Set the issue status to `in-progress` and update the timestamp

4. Add an opening comment:
   ```json
   {"id": "001", "author": "Claude Code", "content": "Starting work on this issue.", "created": "<ISO-8601>"}
   ```

5. Summarize the issue context to the user

6. Tell the user: "Tracking work under {ID}. I will add comments as I work and update the status when done."

## During Work

As you implement changes, periodically add comments to the issue documenting:
- What approach you chose and why
- Which files you created or modified
- Any problems encountered and how you solved them
- Key decisions and their rationale

## When Done

1. Add a final summary comment listing all changes made
2. Update issue status to `review` or `done`
3. Include the ticket ID in any commit message: `feat(module): description [PREFIX-N]`
