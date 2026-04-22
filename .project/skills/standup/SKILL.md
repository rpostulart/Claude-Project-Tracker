---
name: standup
description: Summarize recent activity across issues and commits.
allowed-tools: Read, Glob, Grep, Bash(git log *)
---

Generate a standup summary of recent project activity.

## Steps

1. Read all issues from `.project/issues/*/issue.json`
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
