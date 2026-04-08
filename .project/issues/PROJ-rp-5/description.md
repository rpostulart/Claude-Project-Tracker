# Fix init.sh silent failure in non-interactive (curl pipe) mode

## Problem
When running `curl -sL ... | bash -s -- --update`, the script silently does nothing because `-t 0` is false (no TTY), so slug prompts are skipped and SLUG stays empty. No error message is shown.

## Fix
- In non-interactive mode: auto-detect slug from git initials if possible, otherwise exit with clear error and usage example
- Add final validation that slug is never empty
