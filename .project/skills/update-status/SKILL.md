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
5. Confirm the change

## Valid statuses

backlog, todo, in-progress, review, done
