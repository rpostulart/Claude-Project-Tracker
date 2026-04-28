---
name: rebuild-index
description: Rebuild the issues index from individual issue files. Use when the index is out of sync or missing.
allowed-tools: Read, Write, Glob
---

Rebuild `.project/issues_index.json` from scratch.

## Steps

1. Glob `.project/issues/*/issue.json` to find all issues
2. Read each `issue.json` file
3. Build an array of entries with fields: `id`, `title`, `type`, `status`, `priority`, `assignee`, `labels`, `parent`, `created`, `updated`
4. Sort by `updated` descending (newest first)
5. Write to `.project/issues_index.json`
6. Report how many issues were indexed
