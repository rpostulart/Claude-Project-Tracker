# Solutions - DevOps

## [PROJ-rp-8] Fix init.sh to auto-lowercase slug input — 2026-04-08

**Problem:** Running `init.sh` and entering an uppercase slug (e.g. "RP") caused the script to exit with an error instead of accepting the input.
**Solution:** Added `tr '[:upper:]' '[:lower:]'` conversion on the slug variable before validation, so uppercase input is automatically lowered.
**Files:** `init.sh` (line 104), `template/init.sh` (synced)
**Key decision:** Applied the conversion after the default is set but before validation, so both interactive and `--slug` CLI paths are covered in one place.

---
