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
SLUG=""
PROJECT_NAME=""
UPDATE_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --prefix) PREFIX="$2"; shift 2 ;;
    --email)  EMAIL="$2"; shift 2 ;;
    --slug)   SLUG="$2"; shift 2 ;;
    --name)   PROJECT_NAME="$2"; shift 2 ;;
    --repo)   REPO_URL="$2"; shift 2 ;;
    --update) UPDATE_MODE=true; shift ;;
    -h|--help)
      echo "Usage: ./init.sh [--prefix PREFIX] [--email EMAIL] [--slug SLUG] [--name NAME] [--repo URL] [--update]"
      echo ""
      echo "Bootstraps .project/ into the current git repo."
      echo ""
      echo "Options:"
      echo "  --prefix  Issue prefix (default: first 4 chars of dir name, uppercase)"
      echo "  --email   Your email (default: git config user.email)"
      echo "  --slug    Your unique 2-3 letter identifier for issue IDs (e.g. 'rp')"
      echo "  --name    Project name (default: directory name)"
      echo "  --repo    Git repo URL for the template (default: $REPO_URL)"
      echo "  --update  Update system files (server, UI, skills) while preserving your data"
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

# --- User identity (interactive) ---
DEFAULT_EMAIL=$(git config user.email 2>/dev/null || echo "")
DEFAULT_NAME=$(git config user.name 2>/dev/null || echo "")

# Check if .env already has slug (for --update mode)
EXISTING_SLUG=""
EXISTING_EMAIL=""
if [[ -f .env ]]; then
  EXISTING_SLUG=$(grep '^PROJECT_SLUG=' .env 2>/dev/null | cut -d= -f2 | tr -d '[:space:]' || true)
  EXISTING_EMAIL=$(grep '^PROJECT_USER=' .env 2>/dev/null | cut -d= -f2 | tr -d '[:space:]' || true)
fi

# Suggest slug from initials (first letter of each word in name)
SUGGESTED_SLUG=$(echo "$DEFAULT_NAME" | awk '{for(i=1;i<=NF;i++) printf tolower(substr($i,1,1))}')
# Ensure at least 2 chars
if [[ ${#SUGGESTED_SLUG} -lt 2 ]]; then
  SUGGESTED_SLUG=$(echo "${DEFAULT_EMAIL%%@*}" | tr '[:upper:]' '[:lower:]' | head -c3)
fi

# Only prompt if not provided via args and not already in .env
if [[ -z "$EMAIL" ]]; then
  if [[ -n "$EXISTING_EMAIL" ]]; then
    EMAIL="$EXISTING_EMAIL"
  elif [[ -t 0 ]]; then
    # Interactive terminal — prompt
    echo ""
    echo "  Setting up your user identity..."
    read -p "  Email [${DEFAULT_EMAIL}]: " EMAIL
    EMAIL="${EMAIL:-$DEFAULT_EMAIL}"
  else
    EMAIL="$DEFAULT_EMAIL"
  fi
fi

if [[ -z "$SLUG" ]]; then
  if [[ -n "$EXISTING_SLUG" ]]; then
    SLUG="$EXISTING_SLUG"
  elif [[ -t 0 ]]; then
    # Interactive terminal — prompt for slug
    EXISTING_SLUGS=""
    if [[ -f .project/config.json ]]; then
      EXISTING_SLUGS=$(grep '"slug"' .project/config.json 2>/dev/null | sed 's/.*"slug"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | tr '\n' ' ' || true)
    fi
    if [[ -n "$EXISTING_SLUGS" ]]; then
      echo "  Existing team slugs: $EXISTING_SLUGS"
    fi
    read -p "  Your unique slug (2-4 lowercase letters, e.g. 'rp') [${SUGGESTED_SLUG}]: " SLUG
    SLUG="${SLUG:-$SUGGESTED_SLUG}"
    # Validate slug format
    if ! echo "$SLUG" | grep -qE '^[a-z]{2,4}$'; then
      echo "  Error: Slug must be 2-4 lowercase letters (got: '$SLUG')"
      exit 1
    fi
    # Check uniqueness
    if echo " $EXISTING_SLUGS " | grep -q " $SLUG "; then
      echo "  Error: Slug '$SLUG' is already taken by another team member"
      exit 1
    fi
  else
    # Non-interactive (piped from curl) — try suggested slug, or require --slug arg
    if [[ -n "$SUGGESTED_SLUG" ]] && echo "$SUGGESTED_SLUG" | grep -qE '^[a-z]{2,4}$'; then
      SLUG="$SUGGESTED_SLUG"
      echo "  Auto-detected slug: $SLUG (from git user.name)"
    else
      echo ""
      echo "  Error: Cannot determine your user slug in non-interactive mode."
      echo "  Please re-run with --slug and --email flags:"
      echo ""
      echo "    curl -sL https://raw.githubusercontent.com/rpostulart/Claude-Project-Tracker/main/init.sh | bash -s -- --slug rp --email you@example.com"
      echo ""
      exit 1
    fi
  fi
fi

# Final validation: slug must not be empty
if [[ -z "$SLUG" ]]; then
  echo ""
  echo "  Error: No user slug could be determined."
  echo "  Please re-run with: --slug <2-4 lowercase letters> --email <your-email>"
  echo ""
  exit 1
fi

echo ""
echo "  .project — Git-Native Project Management"
echo "  ========================================="
echo ""
echo "  Project:  $PROJECT_NAME"
echo "  Prefix:   $PREFIX"
echo "  Email:    ${EMAIL:-<not set>}"
echo "  Slug:     ${SLUG:-<not set>}"
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

# --- Copy .project/ ---
if [[ -d .project ]] && [[ "$UPDATE_MODE" == true ]]; then
  echo "  Updating system files (preserving your data)..."
  # Update server, UI, skills, and hooks — never touch issues/, wiki/, config.json
  cp "$TEMPLATE/.project/server.ts" .project/server.ts
  rsync -a --delete "$TEMPLATE/.project/ui/" .project/ui/
  # Merge skills: update existing, add new, don't delete user-created ones
  rsync -a "$TEMPLATE/.project/skills/" .project/skills/
  # Update hooks
  if [[ -d "$TEMPLATE/.project/hooks" ]]; then
    rsync -a "$TEMPLATE/.project/hooks/" .project/hooks/
  fi
  echo "  Updated server, UI, skills, and hooks"
elif [[ -d .project ]]; then
  echo "  .project/ already exists — merging new files only..."
  echo "  (Run with --update to update server/UI/skills to latest version)"
  rsync -a --ignore-existing "$TEMPLATE/.project/" .project/
else
  cp -r "$TEMPLATE/.project" .project
fi
echo "  Installed .project/"

# --- Write config.json ---
if [[ ! -f .project/config.json ]]; then
  # Fresh install: create config with team entry including slug
  USER_NAME=$(echo "$EMAIL" | cut -d@ -f1)
  cat > .project/config.json << JSONEOF
{
  "name": "$PROJECT_NAME",
  "prefix": "$PREFIX",
  "nextId": 1,
  "statuses": ["backlog", "todo", "in-progress", "review", "done"],
  "types": ["feature", "bug", "task", "epic"],
  "priorities": ["critical", "high", "medium", "low"],
  "labels": ["ui", "backend", "docs", "security", "performance", "devops"],
  "team": [$(if [[ -n "$EMAIL" && -n "$SLUG" ]]; then echo "
    {\"name\": \"$USER_NAME\", \"email\": \"$EMAIL\", \"slug\": \"$SLUG\"}"; fi)
  ]
}
JSONEOF
  # Create per-user counter file
  if [[ -n "$SLUG" ]]; then
    mkdir -p .project/counters
    echo "{\"nextId\": 1}" > ".project/counters/${SLUG}.json"
    echo "  Created counter file for slug '$SLUG'"
  fi
  echo "  Configured .project/config.json"
else
  # Existing config: add current user to team if not already present
  if [[ -n "$EMAIL" && -n "$SLUG" ]]; then
    if ! grep -q "\"slug\": \"$SLUG\"" .project/config.json 2>/dev/null; then
      USER_NAME=$(echo "$EMAIL" | cut -d@ -f1)
      # Add team member using python3 for reliable JSON manipulation
      if command -v python3 &>/dev/null; then
        python3 -c "
import json
with open('.project/config.json') as f:
    config = json.load(f)
team = config.get('team', [])
# Check slug uniqueness
if not any(m.get('slug') == '$SLUG' for m in team):
    team.append({'name': '$USER_NAME', 'email': '$EMAIL', 'slug': '$SLUG'})
    config['team'] = team
    with open('.project/config.json', 'w') as f:
        json.dump(config, f, indent=2)
        f.write('\n')
    print('  Added you to the team in config.json')
else:
    print('  Slug already exists in team — skipped')
" 2>/dev/null || echo "  Warning: Could not update config.json team array — add yourself manually"
      else
        echo "  Warning: python3 not available to update config.json. Add yourself to team array manually."
      fi
      # Create per-user counter file
      mkdir -p .project/counters
      if [[ ! -f ".project/counters/${SLUG}.json" ]]; then
        # Seed counter from existing nextId to avoid ID overlap with legacy issues
        SEED_ID=1
        if command -v python3 &>/dev/null; then
          SEED_ID=$(python3 -c "
import json
with open('.project/config.json') as f:
    config = json.load(f)
print(config.get('nextId', 1))
" 2>/dev/null || echo "1")
        fi
        echo "{\"nextId\": $SEED_ID}" > ".project/counters/${SLUG}.json"
        echo "  Created counter file for slug '$SLUG' (seeded at $SEED_ID)"
      fi
    else
      echo "  Skipped config.json (your slug already registered)"
    fi
  else
    echo "  Skipped config.json (already configured)"
  fi
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

# --- Install hooks for enforcement ---
echo ""
echo "  Installing enforcement hooks..."
mkdir -p .claude/hooks

if [[ -d "$TEMPLATE/.project/hooks" ]]; then
  for hook_file in "$TEMPLATE/.project/hooks"/*.sh; do
    [ -f "$hook_file" ] || continue
    hook_name=$(basename "$hook_file")
    cp "$hook_file" ".claude/hooks/$hook_name"
    chmod +x ".claude/hooks/$hook_name"
    echo "  Installed hook: $hook_name"
  done
fi

# --- Configure .claude/settings.json with hooks ---
SETTINGS_FILE=".claude/settings.json"
HOOKS_CONFIG='{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/require-issue.sh"
          },
          {
            "type": "command",
            "command": ".claude/hooks/require-docs.sh"
          }
        ]
      }
    ]
  }
}'

if [[ -f "$SETTINGS_FILE" ]]; then
  # Check if hooks are already configured
  if grep -q '"require-issue.sh"' "$SETTINGS_FILE" 2>/dev/null; then
    echo "  Hooks already configured in settings.json"
  else
    # Merge: add hooks to existing settings using python/node if available, or simple approach
    if command -v python3 &>/dev/null; then
      python3 -c "
import json, sys
with open('$SETTINGS_FILE') as f:
    settings = json.load(f)
hooks = json.loads('''$HOOKS_CONFIG''')
settings.setdefault('hooks', {})
for event, rules in hooks['hooks'].items():
    if event not in settings['hooks']:
        settings['hooks'][event] = rules
    else:
        # Check if our hooks already exist
        existing_cmds = [h.get('command','') for rule in settings['hooks'][event] for h in rule.get('hooks',[])]
        for rule in rules:
            for h in rule.get('hooks',[]):
                if h['command'] not in existing_cmds:
                    settings['hooks'][event].append(rule)
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=2)
" 2>/dev/null && echo "  Merged hooks into existing settings.json" || echo "  Warning: Could not merge settings.json — add hooks manually"
    else
      echo "  Warning: settings.json exists but python3 not available for merge."
      echo "  Add hooks configuration manually. See .claude/hooks/README.md"
    fi
  fi
else
  echo "$HOOKS_CONFIG" > "$SETTINGS_FILE"
  echo "  Created settings.json with hook configuration"
fi

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
# Gitignore issues_index.json (it's rebuildable, prevents merge conflicts)
if ! grep -q 'issues_index.json' .gitignore 2>/dev/null; then
  echo '.project/issues_index.json' >> .gitignore
  echo "  Added .project/issues_index.json to .gitignore"
fi

# --- .env ---
if [[ ! -f .env ]]; then
  cat > .env << ENVEOF
PROJECT_USER=${EMAIL}
PROJECT_SLUG=${SLUG}
PROJECT_DIR=.project
PORT=8000
ENVEOF
  echo "  Created .env"
else
  # Add PROJECT_SLUG if missing
  if [[ -n "$SLUG" ]] && ! grep -q '^PROJECT_SLUG=' .env 2>/dev/null; then
    echo "PROJECT_SLUG=${SLUG}" >> .env
    echo "  Added PROJECT_SLUG to .env"
  fi
  # Add PROJECT_USER if missing
  if [[ -n "$EMAIL" ]] && ! grep -q '^PROJECT_USER=' .env 2>/dev/null; then
    echo "PROJECT_USER=${EMAIL}" >> .env
    echo "  Added PROJECT_USER to .env"
  fi
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
