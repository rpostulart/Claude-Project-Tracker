# Add related field to issue.json for linking issues

## Problem
Issues are loosely coupled. When a bug is caused by or related to another issue, there's no way to express that link.

## Solution
Add a `related` array to `issue.json` containing IDs of related issues (e.g. `["PROJ-4"]`). Simple flat list, no link types.

## Files to change
- `server.ts` (root + .project): add `related` to allowed update fields and index
- `CLAUDE.md`: update issue.json format docs
- Skills: mention related field
- Retroactively link PROJ-rp-5 → PROJ-4
