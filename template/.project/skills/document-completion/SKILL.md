---
name: document-completion
description: When an issue or bug is marked as done, automatically create or update a wiki page documenting the solution, link it in the issue description, and add a comment. Use after completing work on any issue.
allowed-tools: Read, Write, Edit, Glob, Grep
disable-model-invocation: false
---

When an issue is completed (status changed to "done" or "review"), document the solution in the wiki.

## When to Trigger

Run this automatically whenever you finish work on an issue — after setting status to "done" or "review".

## Steps

1. **Read the issue context:**
   - Read `.project/issues/$1/issue.json` for metadata (title, type, labels)
   - Read `.project/issues/$1/description.md` for the original problem
   - Read all `.project/issues/$1/comments/*.json` for the work history

2. **Determine the wiki page:**
   - If the issue has labels, find or create a wiki page matching the primary label (e.g., "auth", "ui", "backend")
   - If no labels, use a general "Solutions Log" page
   - Check `.project/wiki/_index.json` for existing pages
   - Page slug format: `solutions-{label}` (e.g., `solutions-auth`, `solutions-backend`)

3. **Create or update the wiki page:**
   - If the page exists: append a new section for this issue
   - If new: create the page with a header and first entry
   - Each entry should include:
     - Issue ID and title as a heading
     - **Problem**: Summary of the original issue
     - **Solution**: What was done to fix/implement it (extracted from comments)
     - **Files Changed**: List of files modified (extracted from comments)
     - **Date**: When it was completed
   - Update `.project/wiki/_index.json` if a new page was created
     - Set parent to "steering" page if it exists, otherwise top-level

4. **Link the wiki page in the issue:**
   - Update `.project/issues/$1/description.md` to append:
     ```

     ---
     **Documentation**: [Solutions - {Label}](wiki/solutions-{label})
     ```

5. **Add a comment to the issue:**
   - Create a new comment in `.project/issues/$1/comments/`:
     ```json
     {
       "id": "NNN",
       "author": "Claude Code",
       "content": "Documented solution in wiki page: solutions-{label}. See [Solutions - {Label}](/wiki/solutions-{label}) for the full writeup.",
       "created": "ISO-8601"
     }
     ```

## Wiki Page Format

```markdown
# Solutions - {Label}

Documentation of completed issues and their solutions.

## [{ID}] {Title}

**Completed**: {date} | **Type**: {type} | **Priority**: {priority}

### Problem
{Original issue description, summarized}

### Solution
{What was done, extracted from comments — approach, key decisions}

### Files Changed
- `path/to/file1.ts` — description of change
- `path/to/file2.js` — description of change

---

## [{OLDER-ID}] {Older Title}
...
```

## Important

- New entries go at the TOP (after the page header), so the most recent solution is first
- Keep entries concise — link to the full issue for details
- Extract file changes from comments; don't list every file, focus on the important ones
- If a wiki page for the label already has an entry for this issue ID, update it instead of duplicating
