---
name: update-status
description: Change the status of an issue.
argument-hint: <ISSUE-ID> <status>
allowed-tools: Read, Edit
---

Update the status of an existing issue.

## Steps

1. Read `.project/issues/$1/issue.json`
2. Update the `status` field to `$2`
3. Update the `updated` timestamp
4. Save the file
5. **Update issues index**: Read `.project/issues_index.json` (create as `[]` if missing). Replace the entry with matching `id` (or add if missing) using all fields from `issue.json`. Sort by `updated` descending. Write back.
6. Confirm the change

## Valid statuses

backlog, todo, in-progress, review, done
