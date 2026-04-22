---
name: wiki-update
description: Create or update a wiki page in .project/wiki/.
argument-hint: <page-title>
allowed-tools: Read, Write, Edit, Glob
---

Create or update a wiki page.

## Steps

1. Generate a slug from `$ARGUMENTS` (lowercase, hyphens)
2. Check if `.project/wiki/pages/{slug}.md` exists
3. If updating: read existing content and apply changes
4. If creating: write new content
5. Update `.project/wiki/_index.json` to add/update the page entry
6. Confirm the action
