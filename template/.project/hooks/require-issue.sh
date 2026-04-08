#!/usr/bin/env bash
# PreToolUse hook: Remind Claude to consider issue tracking before file edits
# Uses a state file to avoid nagging on every single edit
# Exit 0 = allow, Exit 2 = block with feedback

# Get the file path from tool input
FILE_PATH=""
if [ -n "$CLAUDE_TOOL_INPUT" ]; then
  FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')
fi

# Always allow: .project files, .claude files, config files
case "$FILE_PATH" in
  */.project/*|.project/*|*/.claude/*|.claude/*) exit 0 ;;
esac
BASENAME=$(basename "$FILE_PATH" 2>/dev/null)
case "$BASENAME" in
  CLAUDE.md|.gitignore|.env|.env.*|package-lock.json|*.lock) exit 0 ;;
esac

# Find repo/project root: try git first, then walk up looking for .project/
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  # Walk up from current directory to find .project/
  SEARCH_DIR="$(pwd)"
  while [ "$SEARCH_DIR" != "/" ]; do
    if [ -d "$SEARCH_DIR/.project" ]; then
      REPO_ROOT="$SEARCH_DIR"
      break
    fi
    SEARCH_DIR=$(dirname "$SEARCH_DIR")
  done
  if [ -z "$REPO_ROOT" ]; then
    exit 0
  fi
fi

PROJECT_DIR="$REPO_ROOT/.project"
if [ ! -d "$PROJECT_DIR/issues" ]; then
  exit 0
fi

# Check for any in-progress issue
for issue_file in "$PROJECT_DIR"/issues/*/issue.json; do
  [ -f "$issue_file" ] || continue
  if grep -q '"in-progress"' "$issue_file"; then
    # An issue is in-progress — allow silently
    exit 0
  fi
done

# No in-progress issue found
# Check state file: did we already remind Claude in this session?
STATE_FILE="$PROJECT_DIR/.hook-reminded"
if [ -f "$STATE_FILE" ]; then
  # Check if state file is less than 2 minutes old (Claude acknowledged it)
  if [ "$(find "$STATE_FILE" -mmin -2 2>/dev/null)" ]; then
    exit 0
  fi
fi

# First edit without an issue — block and ask Claude to decide
touch "$STATE_FILE"
cat >&2 << 'EOF'
⚠️ No in-progress issue found in .project/issues/.

Before continuing, decide:
- If this task changes functionality (feature, bugfix, refactor) → create an issue first
- If this is a trivial edit (typo, formatting, config) → proceed without an issue

If you decide an issue is needed:
1. Read .project/config.json for prefix and nextId
2. Create .project/issues/{PREFIX}-{ID}/ with issue.json and description.md
3. Set status to "in-progress" and update nextId in config.json

If no issue is needed, explain why to the user and proceed.
EOF
exit 2
