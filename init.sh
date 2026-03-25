#!/usr/bin/env bash
set -euo pipefail

# .project — Git-Native Project Management Installer
# Usage: curl -sL https://raw.githubusercontent.com/rpostulart/Claude-Project-Tracker/main/init.sh | bash
#        ./init.sh [--prefix PREFIX] [--email EMAIL] [--name NAME]

REPO_URL="https://github.com/rpostulart/Claude-Project-Tracker.git"
TEMPLATE_DIR="template"

# --- Parse arguments ---
PREFIX=""
EMAIL=""
PROJECT_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --prefix) PREFIX="$2"; shift 2 ;;
    --email)  EMAIL="$2"; shift 2 ;;
    --name)   PROJECT_NAME="$2"; shift 2 ;;
    --repo)   REPO_URL="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: ./init.sh [--prefix PREFIX] [--email EMAIL] [--name NAME] [--repo URL]"
      echo ""
      echo "Bootstraps .project/ into the current git repo."
      echo ""
      echo "Options:"
      echo "  --prefix  Issue prefix (default: first 4 chars of dir name, uppercase)"
      echo "  --email   Your email (default: git config user.email)"
      echo "  --name    Project name (default: directory name)"
      echo "  --repo    Git repo URL for the template (default: $REPO_URL)"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Find repo root ---
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [[ -z "$REPO_ROOT" ]]; then
  echo "Warning: Not in a git repository. Using current directory."
  REPO_ROOT=$(pwd)
fi
cd "$REPO_ROOT"

# --- Derive defaults ---
DIR_NAME=$(basename "$REPO_ROOT")
PROJECT_NAME="${PROJECT_NAME:-$DIR_NAME}"
PREFIX="${PREFIX:-$(echo "${DIR_NAME:0:4}" | tr '[:lower:]' '[:upper:]')}"
EMAIL="${EMAIL:-$(git config user.email 2>/dev/null || echo "")}"

echo ""
echo "  .project — Git-Native Project Management"
echo "  ========================================="
echo ""
echo "  Project:  $PROJECT_NAME"
echo "  Prefix:   $PREFIX"
echo "  Email:    ${EMAIL:-<not set>}"
echo "  Location: $REPO_ROOT/.project/"
echo ""

# --- Clone template repo to temp dir ---
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "  Fetching template..."
git clone --depth 1 --quiet "$REPO_URL" "$TMPDIR/repo"

TEMPLATE="$TMPDIR/repo/$TEMPLATE_DIR"
if [[ ! -d "$TEMPLATE/.project" ]]; then
  echo "  Error: Template not found at $TEMPLATE_DIR/.project in repo"
  exit 1
fi

# --- Copy .project/ (don't overwrite existing files) ---
if [[ -d .project ]]; then
  echo "  .project/ already exists — merging new files only..."
  # Copy missing directories and files
  rsync -a --ignore-existing "$TEMPLATE/.project/" .project/
else
  cp -r "$TEMPLATE/.project" .project
fi
echo "  Installed .project/"

# --- Write config.json (only if it doesn't exist, to preserve nextId) ---
if [[ ! -f .project/config.json ]] || [[ $(cat .project/config.json | grep -c '"nextId"') -eq 0 ]]; then
  cat > .project/config.json << JSONEOF
{
  "name": "$PROJECT_NAME",
  "prefix": "$PREFIX",
  "nextId": 1,
  "statuses": ["backlog", "todo", "in-progress", "review", "done"],
  "types": ["feature", "bug", "task", "epic"],
  "priorities": ["critical", "high", "medium", "low"],
  "labels": ["ui", "backend", "docs", "security", "performance", "devops"],
  "team": [$(if [[ -n "$EMAIL" ]]; then echo "
    {\"name\": \"$(echo "$EMAIL" | cut -d@ -f1)\", \"email\": \"$EMAIL\"}"; fi)
  ]
}
JSONEOF
  echo "  Configured .project/config.json"
else
  echo "  Skipped config.json (already configured)"
fi

# --- Symlink skills to .claude/skills/ ---
echo ""
echo "  Linking skills to .claude/skills/..."
mkdir -p .claude/skills

for skill_dir in .project/skills/*/; do
  skill_name=$(basename "$skill_dir")
  if [[ ! -f "$skill_dir/SKILL.md" ]]; then continue; fi

  target=".claude/skills/$skill_name"
  if [[ -e "$target" || -L "$target" ]]; then
    rm -rf "$target"
  fi

  if ln -s "../../.project/skills/$skill_name" "$target" 2>/dev/null; then
    echo "  Linked $skill_name"
  else
    mkdir -p "$target"
    cp "$skill_dir/SKILL.md" "$target/SKILL.md"
    echo "  Copied $skill_name (symlink not supported)"
  fi
done

# --- CLAUDE.md (from template, with merge logic) ---
CLAUDE_TEMPLATE="$TEMPLATE/CLAUDE.md"
echo ""
if [[ -f "$CLAUDE_TEMPLATE" ]]; then
  if [[ ! -f CLAUDE.md ]]; then
    cp "$CLAUDE_TEMPLATE" CLAUDE.md
    echo "  Created CLAUDE.md"
  elif grep -q '<!-- .project -->' CLAUDE.md; then
    # Replace existing .project section
    awk '
      /<!-- \.project -->/ { skip=1; next }
      /<!-- \/\.project -->/ { skip=0; next }
      !skip { print }
    ' CLAUDE.md > CLAUDE.md.tmp
    cat "$CLAUDE_TEMPLATE" >> CLAUDE.md.tmp
    mv CLAUDE.md.tmp CLAUDE.md
    echo "  Updated .project section in CLAUDE.md"
  else
    echo "" >> CLAUDE.md
    cat "$CLAUDE_TEMPLATE" >> CLAUDE.md
    echo "  Appended .project section to CLAUDE.md"
  fi
fi

# --- .gitignore ---
if [[ -f .gitignore ]]; then
  if ! grep -qx '.env' .gitignore 2>/dev/null; then
    echo '.env' >> .gitignore
    echo "  Added .env to .gitignore"
  fi
else
  echo '.env' > .gitignore
  echo "  Created .gitignore with .env"
fi

# --- .env ---
if [[ -n "$EMAIL" && ! -f .env ]]; then
  cat > .env << ENVEOF
PROJECT_USER=$EMAIL
PROJECT_DIR=.project
PORT=8000
ENVEOF
  echo "  Created .env"
fi

# --- Summary ---
echo ""
echo "  Done! .project/ is ready."
echo ""
echo "  Next steps:"
echo "    1. Start the UI server (requires Deno):"
echo "       deno run --allow-net --allow-read --allow-write --allow-env .project/server.ts"
echo ""
echo "    2. Open http://localhost:8000"
echo ""
echo "    3. Or just use Claude Code — it will automatically track work as issues."
echo "       Try: /create-issue My first ticket"
echo ""
