# Fix document-completion skill: add issue ID argument and improve comment/link behavior

## Problem
1. The skill had no `argument-hint` and no Step 0 to find the target issue — it didn't know which issue to document
2. The comment added to the issue was verbose (listing all created pages) instead of a simple "Documented in wiki"
3. Wiki page links were not added to the issue description, so users couldn't navigate from issue to docs

## Solution
- Add `argument-hint: <ISSUE-ID>` and Step 0 (find issue by argument or most recently updated done/review issue)
- Simplify comment to just "Documented in wiki"
- Add `## Documentation` section with hyperlinks at the end of the issue description

## Documentation
- [Functional: Wiki Documentation System](/wiki/functional-wiki-docs)
