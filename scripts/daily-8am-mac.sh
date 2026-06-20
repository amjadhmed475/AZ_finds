#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  Yamari Group — Daily 8 AM Intelligence Briefing (macOS)
#  Runs: Scout → Maximus → Herald (iMessage delivery)
#
#  Scheduled by launchd via com.azfinds.daily.plist
#  Install:
#    cp scripts/com.azfinds.daily.plist ~/Library/LaunchAgents/
#    launchctl load ~/Library/LaunchAgents/com.azfinds.daily.plist
# ══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Resolve project root (directory containing this script's parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AGENTS_DIR="$PROJECT_ROOT/agents"
SERVER_DIR="$PROJECT_ROOT/server"
LOG_DIR="$PROJECT_ROOT/logs"

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/daily-$(date +%Y-%m-%d).log"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
echo " YAMARI GROUP — $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"

# ── 1. Log yesterday's top 5 before regenerating
echo "[1/3] Logging top 5 to CSV…" | tee -a "$LOG_FILE"
if [ -f "$SERVER_DIR/dist/cli/top5log.js" ]; then
  cd "$SERVER_DIR" && node dist/cli/top5log.js 2>&1 | tee -a "$LOG_FILE" || true
fi

# ── 2. Run today's research batch (server)
echo "[2/3] Generating today's product batch…" | tee -a "$LOG_FILE"
if [ -f "$SERVER_DIR/dist/cli/daily.js" ]; then
  cd "$SERVER_DIR" && node dist/cli/daily.js 2>&1 | tee -a "$LOG_FILE"
else
  echo "Server not built — building now…" | tee -a "$LOG_FILE"
  cd "$SERVER_DIR" && npm run build 2>&1 | tail -5 | tee -a "$LOG_FILE"
  node dist/cli/daily.js 2>&1 | tee -a "$LOG_FILE"
fi

# ── 3. Run multi-agent briefing (Scout → Maximus → Herald → iMessage)
echo "[3/3] Running agent briefing system…" | tee -a "$LOG_FILE"
if [ ! -d "$AGENTS_DIR/node_modules" ]; then
  echo "Installing agent dependencies…" | tee -a "$LOG_FILE"
  cd "$AGENTS_DIR" && npm install 2>&1 | tail -5 | tee -a "$LOG_FILE"
fi

cd "$AGENTS_DIR" && npm run briefing 2>&1 | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "✓ Mission complete — $(date '+%H:%M:%S')" | tee -a "$LOG_FILE"
