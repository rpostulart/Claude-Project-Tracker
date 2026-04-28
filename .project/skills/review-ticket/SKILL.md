---
name: review-ticket
description: Summarize a ticket's history, description, comments, and status.
argument-hint: <ISSUE-ID>
allowed-tools: Read, Glob, Bash(jq *)
---

Review a ticket's complete history and summarize it.

## Steps (progressive load — stop when the user's question is answered)

1. Read `.project/issues/$1/issue.json` for metadata (status, priority, assignee, labels, type).
2. Read `.project/issues/$1/description.md` for the original problem.
3. List `.project/issues/$1/comments/` (Glob), then read only the **last 2** comments (highest-numbered filenames).
4. If those are sufficient, stop. Only if the user wants full history or the last 2 reference earlier context, read older comments.
5. Subtasks: query the index with `jq` (TOON output) — never dump the whole file:
   ```bash
   jq -r --arg p "$1" '
     [.[] | select(.parent == $p)] as $r
     | "subtasks[\($r | length)]{id,status,title}:",
       ($r[] | "  \(.id),\(.status),\(.title)")
   ' .project/issues_index.json
   ```

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
