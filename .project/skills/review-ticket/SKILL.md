---
name: review-ticket
description: Read and summarize a ticket's full history including description, all comments, and current status. Use when asked to look at, review, check, or understand a past ticket.
argument-hint: <ISSUE-ID>
allowed-tools: Read, Glob
---

Review a ticket's complete history and summarize it.

## Steps

1. Read `.project/issues/$1/issue.json` for metadata (status, priority, assignee, labels, type)
2. Read `.project/issues/$1/description.md` for the original problem statement
3. Read all `.project/issues/$1/comments/*.json` files, sorted by filename (001.json, 002.json, ...)
4. Check for subtasks: scan `.project/issues/*/issue.json` for any issues with `"parent": "$1"`

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
