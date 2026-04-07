---
name: standup
description: Summarize recent project activity across issues and commits. Use when asked for a standup, status update, or what happened recently.
allowed-tools: Read, Glob, Grep, Bash(git log *)
---

Generate a standup summary of recent project activity.

## Steps

1. Read `.project/issues_index.json` for all issues (fall back to scanning `.project/issues/*/issue.json` if missing)
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
