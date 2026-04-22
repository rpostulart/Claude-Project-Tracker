# Bump-version skill + rule to bump VERSION on tracker changes

## What was requested

The SessionStart update-check hook (PROJ-rp-13) compares `VERSION` to upstream, but there's no automation around *bumping* `VERSION` when tracker source changes. Two things needed:

1. A `/bump-version` skill so Claude can bump the version reliably.
2. A workflow rule telling Claude to bump `VERSION` (and `.project/VERSION` locally) when modifying tracker source files.

## Scope

- New skill: `.project/skills/bump-version/` and `demo/.project/skills/bump-version/`.
- `CLAUDE.md` (root-level, shipped to users): add a short rule to the "Sync template after changes" reminder pointing at the new skill.
- Sync to `template/`.
- Bump current `VERSION` to `1.1.1` to cover the README + skill additions since `1.1.0`.
