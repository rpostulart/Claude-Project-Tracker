---
name: document-completion
description: When an issue is completed, analyze what was done and create/update appropriate documentation in the wiki. Runs automatically after marking an issue as done.
allowed-tools: Read, Write, Edit, Glob, Grep
disable-model-invocation: false
---

When an issue is completed, create or update the right documentation based on what was done.

## When to Trigger

Run this automatically after setting an issue status to "done" or "review".

## Step 1: Analyze the Work

Read the issue and its comments to determine:
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

Add a comment to the issue listing what was documented:
```json
{
  "id": "NNN",
  "author": "Claude Code",
  "content": "Documented in wiki:\n- Functional: functional-{area}\n- Technical: technical-{area}\n- Decision: decisions",
  "created": "ISO-8601"
}
```

Also **update the issues index** (`.project/issues_index.json`):
- Read the index file (create as `[]` if missing)
- Find the entry with matching `id` and update its `updated` field
- Sort by `updated` descending, write back

## Decision Matrix: Quick Reference

1. **Can a user see or interact with this change?** → Functional Doc
2. **Does this change how the system works internally?** → Technical Doc
3. **Was a non-obvious choice made?** → Decision Record
