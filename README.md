# .project — Git-Native Project Management

A lightweight alternative to Jira and Confluence. Issues, wikis, and boards are stored as plain Markdown and JSON files inside your repository. Work with them through a web UI, or let AI (Claude Code) manage them directly as files.

## Install in Your Repo

```bash
# From inside any git repo:
curl -sL https://raw.githubusercontent.com/YOURUSER/dot-project/main/init.sh | bash

# Or with options:
./init.sh --prefix MYAPP --email me@example.com --name "My Project"
```

This creates:
- `.project/` — issues, wiki, boards, skills (committed to git)
- `.claude/skills/` — symlinks so Claude Code picks up the skills
- `CLAUDE.md` — instructions that make Claude Code track all work as issues
- `.env` — your email and server config (gitignored)

## How Claude Code Uses It

Once installed, Claude Code **automatically tracks all work as issues**. Every feature, bug fix, and task gets a ticket with a full audit trail.

```
You: "Fix the login timeout bug"
Claude: Creates .project/issues/MYAPP-1/ with issue.json + description.md
        Sets status to in-progress
        Adds comments as it works: what it changed, why, which files
        Updates status to done when finished
        Commits with: fix(auth): resolve login timeout [MYAPP-1]

Later...
You: "The login is broken again, check MYAPP-1"
Claude: Reads the full ticket history — description, all comments, files changed
        Understands what was done before and picks up where it left off
```

### Available Skills

| Command | Description |
|---------|-------------|
| `/create-issue <title>` | Create a new issue |
| `/update-status <ID> <status>` | Change issue status |
| `/add-comment <ID> <text>` | Add a comment to an issue |
| `/track-work <ID or title>` | Start tracked work with full audit trail |
| `/review-ticket <ID>` | Review a ticket's complete history |
| `/standup` | Summarize recent activity |
| `/wiki-update <title>` | Create or update a wiki page |

## Web UI

The web UI gives you a visual interface for the same data:

```bash
# Requires Deno (https://deno.land)
deno run --allow-net --allow-read --allow-write --allow-env server.ts

# Open http://localhost:8000
```

Features:
- **Kanban board** — drag-and-drop issues between status columns
- **List view** — sortable, filterable table with date range and pagination
- **Issue detail** — markdown descriptions, comments, subtasks, labels, priority
- **Wiki** — nested pages with tree navigation, search, WYSIWYG editing
- **Skills** — view and edit Claude Code skills from the browser

## `.project/` Folder Structure

```
.project/
├── config.json                 # Project name, statuses, types, priorities, labels, team
├── issues/
│   └── PROJ-1/
│       ├── issue.json          # Metadata: status, priority, assignee, labels, parent
│       ├── description.md      # Rich description in markdown
│       └── comments/
│           └── 001.json        # Individual comments (append-only, no merge conflicts)
├── wiki/
│   ├── _index.json             # Page tree (title, slug, order, parent for nesting)
│   └── pages/
│       └── getting-started.md  # Wiki pages as markdown files
├── boards/
│   └── default.json            # Board column definitions and WIP limits
└── skills/
    ├── create-issue/SKILL.md   # Claude Code skills (synced to .claude/skills/)
    ├── track-work/SKILL.md
    └── ...
```

### Design Decisions

- **One folder per issue** — atomic, avoids merge conflicts
- **Subtasks are issues** with a `parent` field — flat and simple
- **Comments as individual files** — append-only, conflict-free
- **Wiki pages use a `parent` field** — unlimited nesting, flat file structure
- **Skills in `.project/`** — editable via UI, synced to `.claude/skills/` via symlinks

## How It Works

A single Deno server (`server.ts`) does two things:
1. **Serves the web UI** from the `ui/` folder (vanilla JS, no build step)
2. **Provides a REST API** that reads/writes the `.project/` files on disk

Everything is plain files. `git diff` shows you exactly what changed. `git log` is your audit trail.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Project configuration |
| GET/POST | `/api/issues` | List or create issues |
| GET/PUT/DELETE | `/api/issues/:id` | Issue CRUD |
| PUT | `/api/issues/:id/description` | Update description |
| POST | `/api/issues/:id/comments` | Add comment |
| GET | `/api/wiki` | Wiki page index |
| GET | `/api/wiki/search?q=` | Search wiki content |
| GET/PUT/DELETE | `/api/wiki/:slug` | Wiki page CRUD |
| GET | `/api/skills` | List skills with frontmatter |
| GET/PUT/DELETE | `/api/skills/:slug` | Skill CRUD |
| GET | `/api/boards` | Board configurations |

## Roadmap

- [ ] **S3 hosting** — deploy the UI as a static site for non-dev team members
- [ ] **Docs branch sync** — UI edits commit to a `docs` branch, merged into `main` by devs
- [ ] **Notifications** — GitHub Actions watching for assignee/status changes, posting to Slack
- [ ] **Multi-repo dashboard** — aggregate `.project/` data across repositories
- [ ] **Templates** — issue and wiki page templates for common patterns
- [ ] **npm/brew package** — `npx dot-project init` instead of curl
