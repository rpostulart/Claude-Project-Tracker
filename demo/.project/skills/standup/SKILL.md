---
name: standup
description: Summarize recent activity across issues and commits.
allowed-tools: Read, Glob, Grep, Bash(git log *)
---

Generate a standup summary of recent project activity.

## Steps

1. Read `.project/issues_index.json` for all issues. If missing or stale, run `/rebuild-index` — do not scan `issues/*/issue.json` by hand.
2. Find issues updated in the last 24 hours
3. Check `git log --oneline --since="24 hours ago"` for recent commits
4. Summarize in this format:

### Done
- Issues moved to done/review

### In Progress
- Issues currently in-progress

### Blockers
- Any issues marked as blocked or critical priority in-progress

### Recent Commits
- Recent commits with their messages
