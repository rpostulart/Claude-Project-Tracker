# .project — Project Tracker

This folder is your git-native project management system. Issues, wiki, and boards are all plain files — managed by Claude Code automatically or through the web UI.

## Quick Reference

### Start the Web UI

```bash
deno run --allow-net --allow-read --allow-write --allow-env .project/server.ts
# Open http://localhost:8000
```

### Claude Code Skills

| Command | What it does |
|---------|-------------|
| `/create-issue <title>` | Create a new tracked issue |
| `/update-status <ID> <status>` | Move an issue (backlog/todo/in-progress/review/done) |
| `/add-comment <ID> <text>` | Add a comment to an issue |
| `/track-work <ID or title>` | Start working with full audit trail |
| `/review-ticket <ID>` | Read a ticket's complete history |
| `/standup` | Summarize recent activity |
| `/wiki-update <title>` | Create or update a wiki page |
| `/document-completion` | Auto-document completed work in the wiki |

### How It Works

Claude Code reads `CLAUDE.md` in your repo root and automatically:
1. Creates a ticket before starting any work
2. Adds comments as it works (what it changed, why, which files)
3. Updates the wiki with documentation when done
4. Links ticket IDs in commit messages

### Folder Structure

```
.project/
├── config.json         # Project settings (prefix, statuses, team)
├── server.ts           # Web UI server (Deno)
├── ui/                 # Web UI (vanilla JS)
├── issues/
│   └── PROJ-1/
│       ├── issue.json       # Status, priority, assignee, labels
│       ├── description.md   # What was requested
│       └── comments/
│           └── 001.json     # Progress updates
├── wiki/
│   ├── _index.json     # Page tree
│   └── pages/          # Markdown wiki pages
├── boards/
│   └── default.json    # Kanban columns
└── skills/             # Claude Code skills (synced to .claude/skills/)
```

### Steering Files

Add wiki pages under "Steering Files" to control how Claude works:
- Coding standards, architecture decisions, conventions
- Claude reads these before every task

### Enforcement Hooks

Two hooks in `.claude/hooks/` ensure the workflow is followed:

- **`require-issue.sh`** — Asks Claude to decide if an issue is needed before editing files. Features/bugs need one, typos don't.
- **`require-docs.sh`** — Blocks marking an issue as "done" without wiki documentation. Add "skip-docs" label to bypass for trivial fixes.

### Customize

- **Add team members**: edit `config.json` → `team` array
- **Add labels**: edit `config.json` → `labels` array
- **Add skills**: create a folder in `skills/` with a `SKILL.md` file
- **Add steering files**: create wiki pages under the "Steering Files" parent

### More Info

Full documentation: https://github.com/rpostulart/Claude-Project-Tracker
