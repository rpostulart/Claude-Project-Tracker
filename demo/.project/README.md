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
| `/document-completion <ID>` | Auto-document completed work in the wiki |
| `/rebuild-index` | Rebuild issues index from issue files |

### How It Works

Claude Code reads `CLAUDE.md` in your repo root and automatically:
1. Creates a ticket before starting any work
2. Adds comments as it works (what it changed, why, which files)
3. Updates the wiki with functional docs, technical docs, and decision records
4. Links ticket IDs in commit messages

### Folder Structure

```
.project/
├── config.json              # Project settings (prefix, statuses, team)
├── issues_index.json        # Fast lookup index for all issues (auto-maintained)
├── server.ts                # Web UI server (Deno)
├── ui/                      # Web UI (vanilla JS)
├── issues/
│   └── PROJ-1/
│       ├── issue.json       # Status, priority, assignee, labels
│       ├── description.md   # What was requested, wiki doc links
│       └── comments/
│           └── 001.json     # Progress updates
├── wiki/
│   ├── _index.json          # Page tree with parent/child nesting
│   └── pages/
│       ├── steering.md      # Project conventions for AI
│       ├── functional/      # What features do (user perspective)
│       ├── technical/       # How things work (developer perspective)
│       └── decisions.md     # Why choices were made
├── boards/
│   └── default.json         # Kanban columns
└── skills/                  # Claude Code skills (synced to .claude/skills/)
```

### Issues Index

The `issues_index.json` file contains a flat array of all issue metadata, sorted by most recently updated first. AI reads this single file instead of scanning every issue directory — much faster for finding recent issues, running standups, or searching for existing tickets. It's maintained automatically by the server and skills, and rebuilds itself if missing.

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
