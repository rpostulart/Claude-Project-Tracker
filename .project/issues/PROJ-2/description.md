# Simplify wiki doc types and fix parent nesting

## Problem
- Wiki pages are flat (no parent nesting) despite UI supporting it
- Solution logs duplicate info already in issue comments
- Same info (problem, solution, files, decision) appears 3-4x across doc types

## Solution
Reduce from 4 doc types to 3, with proper parent nesting:
1. **Functional** — what it does from user perspective (replaces User Guide + Solution Log)
2. **Technical** — how it works internally
3. **Decisions** — why A over B

Issue comments serve as the solution log (no separate wiki page needed).
