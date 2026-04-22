---
name: review-ticket
description: Summarize a ticket's history, description, comments, and status.
argument-hint: <ISSUE-ID>
allowed-tools: Read, Glob
---

Review a ticket's complete history and summarize it.

## Steps (progressive load — stop when the user's question is answered)

1. Read `.project/issues/$1/issue.json` for metadata (status, priority, assignee, labels, type).
2. Read `.project/issues/$1/description.md` for the original problem.
3. List `.project/issues/$1/comments/` (Glob), then read only the **last 3** comments (highest-numbered filenames).
4. If those are sufficient to answer what the user asked, stop here. Only if the user wants the full history or the last 3 comments reference earlier context, read the older comments.
5. Subtasks: check `.project/issues_index.json` for entries with `"parent": "$1"`. Do not scan `issues/*/issue.json` by hand.

## Output Format

Present the information as a timeline:

### {ID}: {Title}
**Status**: {status} | **Priority**: {priority} | **Assignee**: {assignee}
**Type**: {type} | **Labels**: {labels}
**Created**: {created} | **Updated**: {updated}

### Description
{description.md content}

### Timeline
- **{timestamp}** ({author}): {comment content}
- **{timestamp}** ({author}): {comment content}
- ...

### Files Changed
Extract any file references mentioned in comments (look for paths like `src/...`, `lib/...`, etc.)

### Subtasks
List any child issues found

### Current State
Summarize: is this resolved? What was the outcome? Any open questions?
