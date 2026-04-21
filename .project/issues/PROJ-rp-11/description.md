# Flexible port selection on server startup

## What was requested
When running `deno run ... server.ts`, if port 8000 is in use the server crashes with `AddrInUse`. Make it more flexible: pick the next available port and tell the user which one it chose.

## Acceptance criteria
- If the configured port is free, use it as today.
- If the port is in use, try subsequent ports (8001, 8002, …) up to a reasonable cap.
- Log which port was chosen so the user sees it clearly.
- No crash when the default port is busy (unless every port in the fallback range is busy).

## Technical approach
- Wrap `Deno.serve` start in a loop that catches `AddrInUse` and bumps the port.
- Only log the final "running at" line once the bind succeeds.
- Cap attempts (e.g. +20) to avoid scanning endlessly.

## Context
User had an orphaned process on 8000 and wanted a smoother experience — see terminal output in conversation.
