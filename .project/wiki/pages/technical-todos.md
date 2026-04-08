# Todos — Technical Documentation

## Overview

Todos extend the existing comment system by adding a `type` field to comment JSON. No new storage mechanism is needed — todos live as comments in the same `comments/` directory per issue.

## Comment Schema Extension

Regular comments remain unchanged. Todo comments add two fields:

```json
{
  "id": "003",
  "author": "user@example.com",
  "content": "Review the PR before merging",
  "type": "todo",
  "done": false,
  "created": "2026-04-08T10:00:00Z"
}
```

- `type`: `"todo"` for todos. Regular comments have no `type` field (backward compatible).
- `done`: `boolean`, only present when `type` is `"todo"`.

## API Endpoints

### `POST /api/issues/{ID}/comments`

Existing endpoint, extended. When `type: "todo"` is in the request body, the comment is saved with `type` and `done` fields.

### `PUT /api/issues/{ID}/comments/{COMMENT_ID}`

New endpoint. Updates a comment's `done` or `content` fields. Used for toggling todo completion.

**Request body:** `{ "done": true }` or `{ "content": "updated text" }`

**Response:** Updated comment JSON.

### `GET /api/todos`

New endpoint. Scans all issues' comments for `type: "todo"` entries. Returns an array of todo objects enriched with issue metadata:

```json
[
  {
    "id": "003",
    "author": "user@example.com",
    "content": "Review the PR",
    "type": "todo",
    "done": false,
    "created": "2026-04-08T10:00:00Z",
    "issueId": "PROJ-rp-9",
    "issueTitle": "Fix hook enforcement",
    "issueStatus": "in-progress"
  }
]
```

**Sort order:** Undone first, then by `created` descending.

## UI Components

### Issue Detail (`ui/js/views/detail.js`)

- Todo comments render with a checkbox in the comment header
- "Add Todo" button creates a comment with `type: "todo"`, `done: false`
- Checkbox `change` event calls `API.updateComment()` and re-renders

### Todos View (`ui/js/views/todos.js`)

- Calls `API.getTodos()` on render
- Segmented filter buttons (Open/All/Closed) — client-side filtering with module-level `todoFilter` state
- Each row links to the parent issue via `navigate('detail', { issueId })`

### Router (`ui/js/app.js`)

- View name: `'todos'`
- URL: `/todos`

## Dependencies

- Reuses `.done-filter-btn` CSS class from board view
- Reuses `renderMarkdown()` for todo content
- No external dependencies added
