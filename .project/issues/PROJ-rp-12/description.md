# Token optimization: slim tracker overhead

The tracker's always-loaded context (CLAUDE.md + skill descriptions) costs ~2.6k tokens per turn before the user even types. This issue applies five targeted fixes to cut that substantially while keeping the workflow's guarantees.

## Fixes

1. Slim CLAUDE.md from 226 lines to a terse pointer; move verbose workflow details into a steering wiki page that is only read when tracker work starts.
2. Shorten skill `description` frontmatter (always injected into the system prompt) to ≤15 words each.
3. Progressive loading in `review-ticket` and `track-work`: read `issue.json` + `description.md` + last 3 comments first; fetch older comments only when asked.
4. Remove the "fall back to scanning issues/*/issue.json" language. Index-miss should rebuild, not scan.
5. Drop empty-section boilerplate from `description.md` template — only include sections with content.

## Acceptance

- CLAUDE.md ≤ ~80 lines, still references golden rules and workflow location.
- Steering page contains the detail.
- Skill descriptions tightened.
- review-ticket and track-work skills updated for progressive load.
- Template and demo synced.
