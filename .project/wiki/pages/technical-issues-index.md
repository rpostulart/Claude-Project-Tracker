# Technical — Issues Index

## Overview

The issues index (`.project/issues_index.json`) provides a single-file lookup for all issue metadata, eliminating the need to scan individual issue directories.

## How It Works

- **Format:** JSON array of issue summary objects, sorted by `updated` descending
- **Fields per entry:** `id`, `title`, `type`, `status`, `priority`, `assignee`, `labels`, `parent`, `created`, `updated`
- **Maintained by:** `server.ts` (on every CRUD operation) and skill instructions (for direct file writes)

### Server-side Functions (server.ts)

| Function | Purpose |
|----------|---------|
| `readIndex()` | Reads the index; rebuilds automatically if missing or corrupt |
| `writeIndex(entries)` | Sorts by `updated` desc and writes to disk |
| `rebuildIndex()` | Scans all `issues/*/issue.json` and rebuilds the index from scratch |
| `updateIndexEntry(issue)` | Upserts a single entry in the index |
| `removeIndexEntry(id)` | Removes an entry by issue ID |
| `issueToIndexEntry(issue)` | Extracts index fields from a full issue object |

### Self-healing

If the index file is missing or contains invalid JSON, `readIndex()` falls back to `rebuildIndex()` automatically. The server also checks on startup and rebuilds if needed.

### API Endpoint

`POST /api/issues/rebuild-index` — Forces a full rebuild. Returns `{ ok: true, count: N }`.

## Configuration

No configuration needed. The index file lives at `.project/issues_index.json` alongside `config.json`.

## Dependencies

- All issue CRUD functions in `server.ts` call index update functions
- Skills (`create-issue`, `update-status`, `add-comment`, `track-work`) include index update instructions
- `standup` skill reads from the index instead of scanning directories
- `rebuild-index` skill provides manual recovery
