# Add issues_index.json for fast issue lookups by AI

## What was requested
When AI needs to find "the latest issues", it currently has to glob all issue directories and read each issue.json individually. Add a central index file that gives all issue metadata in a single read.

## Acceptance criteria
- `.project/issues_index.json` exists with all issue summaries sorted by `updated` desc
- server.ts maintains the index on every create/update/delete
- Skills include instructions to update the index
- Index self-heals (rebuilds from dir scan if missing/corrupt)
- `listIssues()` API response unchanged

## Technical approach
- Add index helper functions to server.ts
- Hook into all CRUD functions
- Update all modifying skills with index update step
- Add rebuild-index skill and API endpoint
