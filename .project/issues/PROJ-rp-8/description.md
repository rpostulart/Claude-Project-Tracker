# Fix init.sh to auto-lowercase slug input instead of rejecting uppercase

## What was requested
When running `init.sh` and entering an uppercase slug like "RP", the script errors out with "Slug must be 2-4 lowercase letters" instead of auto-converting to lowercase.

## Acceptance criteria
- Uppercase slug input (e.g. "RP") is automatically converted to lowercase ("rp")
- Mixed case input (e.g. "Rp") is also handled
- Validation still rejects invalid input (numbers, special chars, wrong length)

## Technical approach
Add `tr '[:upper:]' '[:lower:]'` conversion on the SLUG variable before validation on line 105 of init.sh.

## Context
User reported this as a friction point when setting up a new project. The prompt says "2-4 lowercase letters" but should be forgiving of case.
