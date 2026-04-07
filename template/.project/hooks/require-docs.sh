#!/usr/bin/env bash
# PreToolUse hook (Edit/Write): When marking an issue as done, check if docs are needed
# Exit 0 = allow, Exit 2 = block with feedback

INPUT="${CLAUDE_TOOL_INPUT:-}"

# Get the file path
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')

# Only check issue.json files
case "$FILE_PATH" in
  */.project/issues/*/issue.json) ;;
  *) exit 0 ;;
esac

# Check if this edit is setting status to "done"
# Look for the word "done" near "status" in the tool input
if ! echo "$INPUT" | grep -q 'status'; then
  exit 0
fi
if ! echo "$INPUT" | grep -q 'done'; then
  exit 0
fi

# Find repo root and issue
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

PROJECT_DIR="$REPO_ROOT/.project"
ISSUE_ID=$(echo "$FILE_PATH" | sed 's|.*/issues/\([^/]*\)/issue.json|\1|')
ISSUE_DIR="$PROJECT_DIR/issues/$ISSUE_ID"

if [ -z "$ISSUE_ID" ] || [ ! -d "$ISSUE_DIR" ]; then
  exit 0
fi

# Check the issue type/scope to decide if docs are needed
# Read the existing issue to check labels
ISSUE_CONTENT=""
if [ -f "$ISSUE_DIR/issue.json" ]; then
  ISSUE_CONTENT=$(cat "$ISSUE_DIR/issue.json")
fi

# If issue has "skip-docs" or "trivial" label, allow without docs
if echo "$ISSUE_CONTENT" | grep -qi '"skip-docs"\|"trivial"\|"chore"'; then
  exit 0
fi

# Check if wiki documentation exists
WIKI_DOCUMENTED=false

# Check comments for explicit wiki documentation references
if [ -d "$ISSUE_DIR/comments" ]; then
  for comment_file in "$ISSUE_DIR"/comments/*.json; do
    [ -f "$comment_file" ] || continue
    # Look for explicit documentation markers, not just the word "wiki"
    if grep -q 'documented in wiki\|Documented in wiki\|wiki.*updated\|/document-completion\|[Ff]unctional:\|[Tt]echnical:\|[Dd]ecision' "$comment_file"; then
      WIKI_DOCUMENTED=true
      break
    fi
  done
fi

# Check if a wiki page mentions this issue ID
if [ "$WIKI_DOCUMENTED" = false ] && [ -d "$PROJECT_DIR/wiki/pages" ]; then
  for wiki_page in "$PROJECT_DIR"/wiki/pages/*.md; do
    [ -f "$wiki_page" ] || continue
    if grep -q "$ISSUE_ID" "$wiki_page"; then
      WIKI_DOCUMENTED=true
      break
    fi
  done
fi

if [ "$WIKI_DOCUMENTED" = false ]; then
  cat >&2 << EOF
⚠️ Marking $ISSUE_ID as done — but no wiki documentation found.

Decide if documentation is needed:
- User-facing change → run /document-completion (functional doc)
- Architecture change → run /document-completion (technical doc)
- Trivial fix → add label "skip-docs" to the issue and retry

To skip docs for this issue, add "skip-docs" to the labels array in issue.json first.
EOF
  exit 2
fi

exit 0
