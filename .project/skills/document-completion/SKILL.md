---
name: document-completion
description: Document a completed issue in the wiki (functional, technical, decision, solution).
argument-hint: <ISSUE-ID>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(jq *)
disable-model-invocation: false
---

When an issue is completed, create or update the right documentation based on what was done.

## Style rules (apply throughout)

Keep wiki content lean. Every word is re-read on later sessions.

- Wiki pages: decisions, invariants, and "what + why" only. Do **not** paste diffs, full code blocks, or typecheck output.
- Outro comment on the issue: 2–4 lines. Format: `Documented in wiki: <link>. <Branch/PR>.` Nothing else.
- Issue description's `## Documentation` section: links only — no prose.
- Prefer one wiki page per **feature area** (long-lived) over one page per ticket.

## When to Trigger

Run this automatically after setting an issue status to "done" or "review".

## Step 0: Find the Issue

- If `$ARGUMENTS` is provided and looks like an issue ID (e.g., `PROJ-5`): use that issue.
- Otherwise: query the index with `jq` (TOON output, no full-file dump) for the most recently updated `done` or `review` issue:
  ```bash
  jq -r '
    [.[] | select(.status == "done" or .status == "review")]
    | sort_by(.updated) | reverse | .[0:1]
    | "candidate[\(length)]{id,status,title}:",
      (.[] | "  \(.id),\(.status),\(.title)")
  ' .project/issues_index.json
  ```

## Step 1: Analyze the Work

Read `.project/issues/{ID}/issue.json`, `description.md`, and all `comments/*.json` to determine:
- What type of work was done (feature, bug fix, refactor, config change, API change)
- What files were changed
- Whether it affects end users, developers, or both

## Step 2: Decide What Documentation is Needed

Use this decision matrix:

1. **Does this change what users see or do?** → **Functional Doc**
2. **Does this change how the system works internally?** → **Technical Doc**
3. **Was a non-obvious choice made?** → **Decision Record**

Multiple types can apply to a single issue. At minimum, one type should always be created.

### Functional Docs (user-facing changes)
**When:** A new feature was added, existing behavior changed, or a bug fix changes what users experience.
**What:** What it does and how to use it — written for end users and stakeholders, not developers.
**Wiki slug:** `functional-{feature-area}` (e.g., `functional-authentication`, `functional-chapter-generation`)
**Parent:** `functional`
**Skip when:** Pure internal refactors, dev tooling, or infrastructure changes with no user-visible impact.

### Technical Docs (architecture and API changes)
**When:** New APIs, new services, significant architectural changes, complex internal logic.
**What:** How it works internally — data flow, key functions, configuration, dependencies.
**Wiki slug:** `technical-{area}` (e.g., `technical-api`, `technical-style-analysis`)
**Parent:** `technical`
**Skip when:** Simple bug fixes, UI-only changes, minor tweaks.

### Decision Records (significant choices)
**When:** A non-obvious technical decision was made (chose library X over Y, designed schema a certain way, rejected an approach).
**What:** Context, decision, consequences, alternatives considered.
**Wiki slug:** `decisions` (single page, append new entries at top)
**Parent:** `decisions`
**Skip when:** Straightforward implementations with no significant trade-offs.

## Step 3: Create/Update Wiki Pages

For each documentation type needed:

1. Read `.project/wiki/_index.json`
2. **Check if the parent page exists** (e.g., `functional`, `technical`, `decisions`). If not, create it:
   - Create `.project/wiki/pages/{parent}.md` with a simple heading
   - Add an entry to `_index.json` with `"parent": null`
3. Check if the content page already exists
   - If exists: read and append/update the relevant section
   - If new: create the page and add it to `_index.json`
4. **CRITICAL: Always set `"parent"` in `_index.json`** to the correct parent slug. Pages must nest under their category.

### Functional Doc Format
```markdown
## {Feature Name}

{What it does in 1-2 sentences}

### How to Use
{How the user interacts with this — steps, expected behavior}

### Example
{Concrete example of usage or output}

### Notes
{Edge cases, limitations, tips — omit if none}
```

### Technical Doc Format
```markdown
## {Component/Feature Name}

### Overview
{What this component does and why it exists}

### How It Works
{Data flow, key functions, architecture}

### Configuration
{Environment variables, config files, options}

### Dependencies
{What this depends on, what depends on this}
```

### Decision Record Format (append to single `decisions` page)
```markdown
## {Date} — {Decision Title}

**Context:** {Why this decision was needed}
**Decision:** {What was decided}
**Alternatives considered:** {What else was evaluated}
**Consequences:** {Trade-offs, what this means going forward}

---
```

## Step 4: Link and Comment

1. **Append wiki links to the issue description** (`.project/issues/{ID}/description.md`):
   Add a `## Documentation` section at the end with links to the created pages:
   ```markdown

   ## Documentation
   - [Functional: {title}](/wiki/functional-{area})
   - [Technical: {title}](/wiki/technical-{area})
   - [Decision Record](/wiki/decisions)
   ```
   Only include links for doc types that were actually created.

2. **Add a short outro comment** to the issue (2–4 lines max):
   ```json
   {
     "id": "NNN",
     "author": "Claude Code",
     "content": "Documented in wiki: /wiki/functional-{area}. Branch: feat/{ID}-{slug}.",
     "created": "ISO-8601"
   }
   ```
   No celebratory recap. No "Next steps" section. Links live in the description.

3. **Update the issues index** (`.project/issues_index.json`):
   - Read the index file (create as `[]` if missing)
   - Find the entry with matching `id` and update its `updated` field
   - Sort by `updated` descending, write back

## Decision Matrix: Quick Reference

1. **Can a user see or interact with this change?** → Functional Doc
2. **Does this change how the system works internally?** → Technical Doc
3. **Was a non-obvious choice made?** → Decision Record
