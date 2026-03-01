#!/bin/bash
# run-agents.sh
# Fetches GitHub issues labeled "claude" and runs a Claude Code agent
# per issue in its own tmux pane + git worktree.
#
# Usage:
#   ./scripts/run-agents.sh              # picks up issues labeled "claude"
#   ./scripts/run-agents.sh --label bug  # custom label
#   ./scripts/run-agents.sh --max 2      # limit to 2 agents

set -e

# ── Config ────────────────────────────────────────────────────────────────────
REPO="drageo2000/MyAncestors"
LABEL="claude-local"
MAX_AGENTS=3
SESSION="myancestors-agents"
WORKTREE_BASE=".claude/worktrees"

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --label) LABEL="$2"; shift 2 ;;
    --max)   MAX_AGENTS="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── Checks ────────────────────────────────────────────────────────────────────
command -v tmux >/dev/null 2>&1 || { echo "Error: tmux not installed. Run: brew install tmux"; exit 1; }
command -v gh   >/dev/null 2>&1 || { echo "Error: gh not installed. Run: brew install gh"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "Error: claude not installed. Run: npm install -g @anthropic-ai/claude-code"; exit 1; }

# ── Fetch issues ──────────────────────────────────────────────────────────────
echo "Fetching issues labeled '$LABEL' from $REPO..."
ISSUE_JSON=$(gh issue list \
  --repo "$REPO" \
  --label "$LABEL" \
  --state open \
  --limit "$MAX_AGENTS" \
  --json number,title,body)

ISSUE_COUNT=$(echo "$ISSUE_JSON" | jq length)

if [[ "$ISSUE_COUNT" -eq 0 ]]; then
  echo "No open issues found with label '$LABEL'."
  echo "Label some issues at: https://github.com/$REPO/issues"
  exit 0
fi

# Flatten body to single line to avoid newline issues in bash variables
ISSUES=$(echo "$ISSUE_JSON" | jq -r '.[] | "\(.number)|\(.title)|\(.body | gsub("\n";" "))"')

echo "Found $ISSUE_COUNT issue(s). Spinning up agents..."

# ── Kill existing session if any ──────────────────────────────────────────────
tmux kill-session -t "$SESSION" 2>/dev/null || true

# ── Create tmux session ───────────────────────────────────────────────────────
tmux new-session -d -s "$SESSION" -x 220 -y 50

PANE=0
while IFS='|' read -r NUMBER TITLE BODY; do
  BRANCH="fix/issue-${NUMBER}"
  WORKTREE="${WORKTREE_BASE}/issue-${NUMBER}"

  # Create worktree on a new branch (skip if already exists)
  if [ ! -d "$WORKTREE" ]; then
    git worktree add "$WORKTREE" -b "$BRANCH" 2>/dev/null || \
    git worktree add "$WORKTREE" "$BRANCH" 2>/dev/null || true
  fi

  # Write prompt to a temp file to avoid shell escaping issues
  PROMPT_FILE=$(mktemp /tmp/claude-issue-${NUMBER}.XXXXXX)
  cat > "$PROMPT_FILE" <<PROMPT
You are working on GitHub issue #${NUMBER} in the MyAncestors genealogy app.

Issue: ${TITLE}

${BODY}

Instructions:
- You are in a git worktree on branch '${BRANCH}'
- Read relevant files before making changes
- Implement the fix or feature described in the issue
- Run 'npx tsc --noEmit' to verify no type errors
- Commit your changes with message: 'fix: issue #${NUMBER} - ${TITLE}'
- When done, run: gh pr create --repo ${REPO} --title 'fix: #${NUMBER} ${TITLE}' --body 'Closes #${NUMBER}' --base main
PROMPT

  CMD="cd $WORKTREE && echo '=== Agent for Issue #${NUMBER}: ${TITLE} ===' && claude \"\$(cat $PROMPT_FILE)\""

  if [ "$PANE" -eq 0 ]; then
    tmux send-keys -t "$SESSION:0.$PANE" "$CMD" Enter
  else
    if [ "$PANE" -eq 1 ]; then
      tmux split-window -h -t "$SESSION:0"
    else
      tmux split-window -v -t "$SESSION:0.$((PANE - 1))"
    fi
    tmux send-keys -t "$SESSION:0.$PANE" "$CMD" Enter
  fi

  # Set pane title
  tmux select-pane -t "$SESSION:0.$PANE" -T "Issue #${NUMBER}"

  PANE=$((PANE + 1))
done <<< "$ISSUES"

# ── Even out pane sizes ───────────────────────────────────────────────────────
tmux select-layout -t "$SESSION:0" even-horizontal 2>/dev/null || true

# ── Attach ────────────────────────────────────────────────────────────────────
echo ""
echo "Attaching to tmux session '$SESSION' with $PANE agent(s)..."
echo ""
echo "tmux controls:"
echo "  Switch panes : Ctrl+b then arrow keys"
echo "  Zoom a pane  : Ctrl+b then z  (repeat to unzoom)"
echo "  Detach       : Ctrl+b then d  (agents keep running)"
echo "  Kill session : Ctrl+b then :kill-session"
echo ""
tmux attach-session -t "$SESSION"
