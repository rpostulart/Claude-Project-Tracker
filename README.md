# Claude Project Tracker

**Git-native project management with AI audit trails.** A lightweight alternative to Jira and Confluence where every issue, wiki page, and board lives as plain files in your repo.

## The Problem

If you use AI coding assistants (like Claude Code), you've probably hit these pain points:

- **"What did AI do yesterday?"** — You asked Claude to fix something last week. It worked. But now you have no idea what it changed or why.
- **"It broke again, but I don't remember the fix"** — A bug you fixed with AI three weeks ago is back. You can't remember what the solution was, and `git log` just says "fix bug".
- **"Pick up where AI left off"** — You started a feature with Claude, got interrupted, came back days later. Claude has no memory of what it was doing or what decisions were made.
- **"I can't verify what AI did"** — Your AI assistant made changes across 12 files. You approved them. Now something's wrong and you need to understand the reasoning behind each change.
- **"Jira costs $1,000+/month and doesn't talk to my AI"** — You're paying for project management tools that your AI assistant can't even read or write to.

## The Solution

Drop a `.project/` folder into any git repo. Claude Code automatically:

1. **Creates a ticket** before starting any work
2. **Documents every step** — what it changed, why, which files, what decisions it made
3. **Updates the wiki** with solutions, user guides, and technical docs
4. **Links tickets to commits** so you can trace any change back to its reasoning

Everything is plain Markdown and JSON. No database. No SaaS. No vendor lock-in. Just files in your repo.

## Quick Start

```bash
# From inside any git repo:
curl -sL https://raw.githubusercontent.com/rpostulart/Claude-Project-Tracker/main/init.sh | bash

# Or with options:
./init.sh --prefix MYAPP --email me@example.com --name "My Project"
```

This creates:
- `.project/` — issues, wiki, boards, skills (committed to git)
- `.claude/skills/` — slash commands for Claude Code
- `CLAUDE.md` — instructions that make Claude Code track all work automatically
- `.env` — your email and server config (gitignored)

## How It Works

### AI Workflow (automatic)

Once installed, Claude Code tracks everything without you asking:

```
You: "Fix the login timeout bug"

Claude: 1. Creates MYAPP-1: "Fix login timeout bug"
        2. Sets status to in-progress
        3. Adds comments as it works:
           - "Investigating: timeout happens in auth.ts line 42"
           - "Root cause: token refresh waits for expired session"
           - "Fixed by adding early return on expired tokens"
           - "Modified: src/auth.ts, src/middleware.ts"
        4. Updates wiki: Solutions - Auth
        5. Commits with: fix(auth): resolve login timeout [MYAPP-1]
        6. Marks ticket as done

Three weeks later...
You: "The login is broken again, check MYAPP-1"

Claude: Reads the full ticket history
        Sees exactly what was done, which files, what the root cause was
        Picks up where it left off with full context
```

### Human Workflow (web UI)

A visual interface for the same data — no separate tool needed:

```bash
# Requires Deno (https://deno.land)
deno run --allow-net --allow-read --allow-write --allow-env .project/server.ts

# Open http://localhost:8000
```

- **Kanban board** — drag-and-drop issues between columns, time filter on Done
- **List view** — sortable, filterable table with date range and pagination
- **Issue detail** — markdown descriptions, comments, subtasks, labels, priority
- **Wiki** — nested pages with tree navigation, search, WYSIWYG editing
- **Skills** — create and edit Claude Code skills from the browser

### Steering Files

Add wiki pages under "Steering Files" to control how Claude works in your project:

- **Coding Standards** — "Use TypeScript strict mode, Tailwind for CSS"
- **Architecture** — "All API endpoints return { data, error } envelope"
- **Conventions** — "Use snake_case for DB columns, camelCase for JS"

Claude reads these before every task and follows them.

## Available Skills

| Command | What it does |
|---------|-------------|
| `/create-issue <title>` | Create a new tracked issue |
| `/update-status <ID> <status>` | Move an issue (backlog/todo/in-progress/review/done) |
| `/add-comment <ID> <text>` | Add a comment to an issue |
| `/track-work <ID or title>` | Start working with full audit trail |
| `/review-ticket <ID>` | Read a ticket's complete history |
| `/standup` | Summarize recent activity across issues and commits |
| `/wiki-update <title>` | Create or update a wiki page |
| `/document-completion` | Auto-document completed work in the wiki |

## Enforcement Hooks

The tracker installs two Claude Code hooks that enforce the workflow automatically. These run at the harness level, so they can't be forgotten or ignored, even in long conversations.

| Hook | Trigger | What it does |
|------|---------|-------------|
| `require-issue.sh` | Every Edit/Write | Reminds Claude to decide if an issue is needed. Blocks once, then allows if Claude decides it's trivial. |
| `require-docs.sh` | Marking issue as done | Blocks setting status to "done" unless wiki docs exist or issue has "skip-docs" label. |

**How it feels in practice:**

```
You: "add a contact form"
Claude: → tries to edit → hook asks "do you need an issue?"
Claude: → creates issue, sets in-progress → continues working
         ...implements...
Claude: "I've completed the form. Shall I mark PROJ-3 as done?"
You: "yes"
Claude: → writes wiki docs → marks done ✅

You: "fix the typo on line 12"
Claude: → hook asks "do you need an issue?"
Claude: → decides: trivial fix, no issue needed → fixes directly ✅
```

Hooks are installed in `.claude/hooks/` and configured in `.claude/settings.json`. They skip `.project/` files, `.claude/` files, and config files automatically.

## Folder Structure

```
.project/
├── config.json              # Project settings (prefix, statuses, team)
├── server.ts                # Deno server (API + web UI)
├── ui/                      # Web UI (vanilla JS, no build step)
├── issues/
│   └── PROJ-1/
│       ├── issue.json       # Status, priority, assignee, labels
│       ├── description.md   # What was requested, acceptance criteria
│       └── comments/
│           ├── 001.json     # "Starting work on this issue"
│           ├── 002.json     # "Changed auth.ts: added early return"
│           └── 003.json     # "Done. Modified 2 files, updated wiki"
├── wiki/
│   ├── _index.json          # Page tree with parent/child nesting
│   └── pages/
│       ├── steering.md      # Project conventions for AI
│       ├── guide-auth.md    # Auto-generated user guide
│       └── solutions-backend.md  # Auto-generated solution log
├── boards/
│   └── default.json         # Kanban column definitions
└── skills/
    ├── create-issue/SKILL.md
    ├── track-work/SKILL.md
    └── ...                  # 8 skills, synced to .claude/skills/
```

### Why Plain Files?

- **One folder per issue** — atomic changes, no merge conflicts
- **Comments as individual files** — append-only, conflict-free in teams
- **Wiki nesting via `parent` field** — unlimited depth, flat on disk
- **Everything in git** — `git diff` shows exactly what changed, `git log` is your audit trail
- **No database** — works offline, no setup, no migrations
- **AI-native** — Claude Code reads/writes files directly, no API wrapper needed

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
| GET/POST | `/api/skills` | List skills / sync to .claude |
| GET/PUT/DELETE | `/api/skills/:slug` | Skill CRUD |
| GET | `/api/boards` | Board configurations |

## License

MIT
