---
name: document-completion
description: Document a completed issue in the wiki (functional, technical, decision, solution).
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
- How complex the solution was

## Step 2: Decide What Documentation is Needed

Based on the analysis, create one or more of these doc types:

### User Guide (for features and UI changes)
**When:** A new user-facing feature was added or existing behavior changed.
**What:** How to use it from the user's perspective — what it does, how to access it, expected behavior.
**Wiki location:** `guide-{feature-area}` (e.g., `guide-authentication`, `guide-dashboard`)
**Skip when:** Internal refactors, pure backend changes, or bug fixes that restore expected behavior.

### Technical Docs (for architecture and API changes)
**When:** New APIs, new services, significant architectural changes, complex internal logic.
**What:** How it works internally — data flow, key functions, configuration, dependencies.
**Wiki location:** `technical-{area}` (e.g., `technical-api`, `technical-database`)
**Skip when:** Simple bug fixes, UI-only changes, minor tweaks.

### Solution Log (for all completed work)
**When:** Always — every completed issue gets a solution log entry.
**What:** What was the problem, what was done, which files changed, key decisions.
**Wiki location:** `solutions-{label}` (e.g., `solutions-backend`, `solutions-ui`)
**Keep it brief:** 5-10 lines summarizing the issue for future reference.

### Decision Record (for significant choices)
**When:** A non-obvious technical decision was made (chose library X over Y, designed schema a certain way, rejected an approach).
**What:** Context, decision, consequences, alternatives considered.
**Wiki location:** `decisions` (single page, append new entries at top)
**Skip when:** Straightforward implementations with no significant trade-offs.

## Step 3: Create/Update Wiki Pages

For each documentation type needed:

1. Check if the wiki page already exists in `.project/wiki/_index.json`
2. If exists: read the page and append/update the relevant section
3. If new: create the page and add it to `_index.json`
   - Parent should be set based on type:
     - User guides → parent: `guide` (create parent page "User Guide" if missing)
     - Technical docs → parent: `technical` (create parent page "Technical Docs" if missing)
     - Solution logs → parent: `solutions` (create parent page "Solutions" if missing)
     - Decision records → parent: `decisions` (create parent page "Decisions" if missing)

### User Guide Format
```markdown
## {Feature Name}

{What it does in 1-2 sentences}

### How to Use
{Step-by-step instructions}

### Examples
{Concrete examples of usage}

### Notes
{Edge cases, limitations, tips}
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

### Solution Log Format
```markdown
## [{ID}] {Title} — {date}

**Problem:** {1-2 sentence summary}
**Solution:** {What was done}
**Files:** `file1.ts`, `file2.js`
**Key decision:** {If any non-obvious choice was made}

---
```

### Decision Record Format
```markdown
## {Date} — {Decision Title}

**Context:** {Why this decision was needed}
**Decision:** {What was decided}
**Alternatives considered:** {What else was evaluated}
**Consequences:** {Trade-offs, what this means going forward}

---
```

## Step 4: Link and Comment

1. Update the issue description to link to all created/updated wiki pages:
   ```
   ---
   **Documentation:**
   - [User Guide - Auth](/wiki/guide-authentication)
   - [Solutions - Backend](/wiki/solutions-backend)
   ```

2. Add a comment to the issue listing what was documented:
   ```json
   {
     "id": "NNN",
     "author": "Claude Code",
     "content": "Documented in wiki:\n- Updated user guide: guide-authentication\n- Added solution log: solutions-backend",
     "created": "ISO-8601"
   }
   ```

## Decision Matrix: Quick Reference

Ask these questions about the completed work:

1. **Can a user see or interact with this change?** → Yes = User Guide
2. **Does this change how the system works internally?** → Yes = Technical Docs
3. **Was a non-obvious choice made?** → Yes = Decision Record
4. **Was work done?** → Always = Solution Log
