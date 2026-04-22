# Context & Token Budget

How the `.project` tracker manages what gets loaded into Claude's context and why it matters.

## Overview

Every Claude Code turn includes the project's `CLAUDE.md` plus all skill `description` frontmatter. These are *always-loaded* — they cost tokens on every user message, even trivial ones. The tracker's workflow rules are detailed and long, so we split them:

- **`CLAUDE.md` (always loaded):** terse golden rules, one-line workflow, lookup order, pointer to steering page. ~40 lines.
- **`.project/wiki/pages/steering-tracker-workflow.md` (loaded on demand):** full detail — file formats, skill list, new-vs-same-ticket rules, description templates, sync commands. Read this when a workflow question comes up or a hook references a rule you don't remember.

## Progressive comment loading

Issues accumulate comments over time. Reading `comments/*.json` unconditionally bloats context on long-lived tickets.

- `review-ticket` and `track-work` read `issue.json` + `description.md` + the **last 3 comments** (highest-numbered filenames) first.
- They fetch older comments only if those three reference earlier context, or the user explicitly asks for the full history.

## Always use the index

`issues_index.json` is the authoritative lookup path. Skills and CLAUDE.md forbid the directory-scan fallback (`issues/*/issue.json`) because scanning inflates context proportional to issue count. If the index is missing or stale, run `/rebuild-index` — do not scan.

## Skill descriptions

Skill frontmatter `description` fields are injected into the system prompt on every turn. Keep them ≤15 words. Verbose "Use when asked to..." phrasing duplicates what the skill name already conveys.

## Description templates

`description.md` includes only sections with real content. No empty "Acceptance criteria: TBD" stubs. The only consistent requirement is "What was requested"; the rest are optional.

## Budget estimate

| Source | Cost (per turn) | Load |
|---|---|---|
| CLAUDE.md (slim) | ~400 tokens | Always |
| Skill descriptions (8 skills × ~15 words) | ~150 tokens | Always |
| Steering page | ~900 tokens | On demand only |
| Last 3 comments of active issue | variable | Per review-ticket/track-work |

Previous baseline before slimming: ~2.6k tokens always-loaded. New baseline: ~550 tokens always-loaded.

## Update check via SessionStart hook

Version drift between the installed tracker and the upstream template was previously invisible — users kept running old code until someone manually re-ran `init.sh --update`. Putting an update-check instruction in `CLAUDE.md` would have cost ~30 tokens per turn forever, so instead we use a `SessionStart` hook (`.claude/hooks/check-version.sh`) that:

- reads local `.project/VERSION`, curls the remote `VERSION`, compares;
- throttles itself via `.project/.version-check-ts` to at most once per 24h (configurable with `CLAUDE_PROJECT_VERSION_THROTTLE`);
- exits silently (no output = no context added) when up-to-date or throttled;
- prints a single-line notice only on version mismatch, asking Claude to confirm with the user before running the update command.

Token cost on the silent path: **0**. The upstream URL is `CLAUDE_PROJECT_VERSION_URL` (default `raw.githubusercontent.com/rpostulart/Claude-Project-Tracker/main/VERSION`) so forks can redirect it.

### Bumping VERSION

The update-check hook only works if `VERSION` in the source repo actually changes when we ship things. Use `/bump-version`:

- `/bump-version` — patch bump (bug fixes)
- `/bump-version minor` — minor bump (new skill, new field, additive change)
- `/bump-version major` — major bump (breaking change: file format shift, API removal)
- `/bump-version 2.0.0` — explicit version

The skill refuses to run in consumer repos (no `template/` folder) — in those, `VERSION` is installed state, not source.
