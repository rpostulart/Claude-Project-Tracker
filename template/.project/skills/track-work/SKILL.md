---
name: track-work
description: Start tracked work: find/create ticket, set in-progress, track progress in comments.
argument-hint: <ISSUE-ID or title>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Begin tracked work on an issue with full audit trail.

## Steps

1. If `$ARGUMENTS` looks like an issue ID (matches `{PREFIX}-{slug}-{N}` or legacy `{PREFIX}-{N}` pattern):
   - Read `.project/issues/$1/issue.json` and `description.md`
   - Read only the **last 1 comment** by default (highest-numbered filename). Fetch older comments only if the user asks or the latest references prior context.
   - Summarize to the user in ≤ 5 lines

2. If `$ARGUMENTS` is a title (does not match an issue ID pattern):
   - Search the index with `jq` (TOON output, no full-file dump):
     ```bash
     jq -r --arg q "$ARGUMENTS" '
       [.[] | select((.title|ascii_downcase) | contains($q|ascii_downcase))] as $r
       | "matches[\($r | length)]{id,status,title}:",
         ($r[] | "  \(.id),\(.status),\(.title)")
     ' .project/issues_index.json
     ```
   - Do not scan `issues/*/issue.json` by hand.
   - If a match is found, use that issue
   - If no match, create a new issue:
     - Read `.project/config.json` for prefix and team info
     - Determine your user slug (from `PROJECT_SLUG` env var or config team array)
     - Read `.project/counters/{slug}.json` for next issue number (create with `{"nextId": 1}` if missing)
     - Create `.project/issues/{PREFIX}-{slug}-{N}/issue.json` with status "in-progress"
     - Create `.project/issues/{PREFIX}-{slug}-{N}/description.md`
     - Increment counter in `.project/counters/{slug}.json`

3. Set the issue status to `in-progress` and update the timestamp

4. **Update issues index**: Read `.project/issues_index.json` (create as `[]` if missing). Replace the entry with matching `id` (or add if missing) using fields: `id`, `title`, `type`, `status`, `priority`, `assignee`, `labels`, `parent`, `created`, `updated`. Sort by `updated` descending. Write back.

5. Add an opening comment:
   ```json
   {"id": "001", "author": "Claude Code", "content": "Starting work on this issue.", "created": "<ISO-8601>"}
   ```

6. Summarize the issue context to the user

7. Tell the user: "Tracking work under {ID}. I will add comments as I work and update the status when done."

## During Work

As you implement changes, periodically add comments to the issue documenting:
- What approach you chose and why
- Which files you created or modified
- Any problems encountered and how you solved them
- Key decisions and their rationale

## When Done

1. Add a **short** final summary comment (≤ 8 bullets, ≤ 600 chars). What shipped + wiki/PR link. No transcripts, no recap.
2. Update issue status to `review` or `done`.
3. Include the ticket ID in any commit message: `feat(module): description [PREFIX-slug-N]`.
