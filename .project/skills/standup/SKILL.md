---
name: standup
description: Summarize recent activity across issues and commits.
allowed-tools: Read, Glob, Grep, Bash(git log *), Bash(jq *)
---

Generate a standup summary of recent project activity.

## Steps

1. Query the index with `jq` instead of reading the full file. Token-efficient TOON output:
   ```bash
   jq -r --arg since "$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" '
     [.[] | select(.updated >= $since)] as $r
     | "issues[\($r | length)]{id,status,priority,title}:",
       ($r[] | "  \(.id),\(.status),\(.priority),\(.title)")
   ' .project/issues_index.json
   ```
   This emits TOON (Token-Oriented Object Notation) — ~40% fewer tokens than JSON. Only use the bare filename if `jq` is unavailable; never dump the full file.
2. If the index is missing or stale, run `/rebuild-index`.
3. Check `git log --oneline --since="24 hours ago"` for recent commits.
4. Summarize in this format:

### Done
- Issues moved to done/review

### In Progress
- Issues currently in-progress

### Blockers
- Any issues marked as blocked or critical priority in-progress

### Recent Commits
- Recent commits with their messages

Keep the whole standup output ≤ ~25 lines. No analysis paragraphs — bullets only.
