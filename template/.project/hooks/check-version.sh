#!/usr/bin/env bash
# SessionStart hook: check for tracker updates at most once per day.
# Silent when up-to-date (zero token cost). Prints a short notice to Claude
# only when the local VERSION differs from remote.
#
# Exit 0 with empty stdout = no context added.
# Exit 0 with stdout      = appended to Claude's context for this session.

set -u

VERSION_URL="${CLAUDE_PROJECT_VERSION_URL:-https://raw.githubusercontent.com/rpostulart/Claude-Project-Tracker/main/VERSION}"
THROTTLE_HOURS="${CLAUDE_PROJECT_VERSION_THROTTLE:-24}"

# Find repo root (same strategy as require-issue.sh)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  SEARCH_DIR="$(pwd)"
  while [ "$SEARCH_DIR" != "/" ]; do
    if [ -d "$SEARCH_DIR/.project" ]; then REPO_ROOT="$SEARCH_DIR"; break; fi
    SEARCH_DIR=$(dirname "$SEARCH_DIR")
  done
fi
[ -z "$REPO_ROOT" ] && exit 0
[ ! -d "$REPO_ROOT/.project" ] && exit 0

LOCAL_VERSION_FILE="$REPO_ROOT/.project/VERSION"
THROTTLE_FILE="$REPO_ROOT/.project/.version-check-ts"

# No local VERSION → we don't know what we have; don't spam, just exit.
# (Old installs will write VERSION on the next `init.sh --update`.)
[ ! -f "$LOCAL_VERSION_FILE" ] && exit 0

# Throttle: skip if last check was less than THROTTLE_HOURS hours ago
NOW=$(date +%s)
if [ -f "$THROTTLE_FILE" ]; then
  LAST=$(cat "$THROTTLE_FILE" 2>/dev/null || echo 0)
  case "$LAST" in ''|*[!0-9]*) LAST=0 ;; esac
  ELAPSED=$(( NOW - LAST ))
  MIN_ELAPSED=$(( THROTTLE_HOURS * 3600 ))
  if [ "$ELAPSED" -lt "$MIN_ELAPSED" ]; then exit 0; fi
fi

# Fetch remote VERSION. Short timeout so slow network never blocks sessions.
REMOTE=$(curl -fsSL --max-time 3 "$VERSION_URL" 2>/dev/null | tr -d '[:space:]')
# Even on network failure, update throttle so we don't retry every turn.
echo "$NOW" > "$THROTTLE_FILE" 2>/dev/null || true

[ -z "$REMOTE" ] && exit 0

LOCAL=$(tr -d '[:space:]' < "$LOCAL_VERSION_FILE")

if [ "$LOCAL" != "$REMOTE" ]; then
  cat <<MSG
[.project tracker] Update available: local=$LOCAL, remote=$REMOTE.
Ask the user whether to run: curl -sL https://raw.githubusercontent.com/rpostulart/Claude-Project-Tracker/main/init.sh | bash -s -- --update
Do not run it without confirmation.
MSG
fi

exit 0
