#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
#  AZ Finds · Unified Launcher
#  Starts:  Vite dev server  (port 5174)
#
#  MAXIMUS AI: https://themaximus.netlify.app  (already live)
#  Agent pipeline: cd agents && npm run briefing:dry
# ──────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   AZ FINDS  ·  Yamari Group              ║"
echo "  ║   Intelligence Dashboard Online          ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${RESET}"

# ── Install frontend deps if needed ──
if [ ! -d "$ROOT/artifact/app/node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies…${RESET}"
  (cd "$ROOT/artifact/app" && npm install)
fi

# ── Start Vite dev server ──
echo -e "${GREEN}Starting Vite dev server on port 5174…${RESET}"
echo ""
echo -e "${CYAN}  ► Dashboard:  http://localhost:5174${RESET}"
echo -e "${CYAN}  ► MAXIMUS:    https://themaximus.netlify.app${RESET}"
echo ""
echo "  Press Ctrl+C to stop"

(cd "$ROOT/artifact/app" && npm run dev)
