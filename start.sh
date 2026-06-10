#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
#  AZ Finds · Unified Launcher
#  Starts:  MAXIMUS intelligence server (port 3001)
#           Vite dev server            (port 5174)
# ──────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colours
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   AZ FINDS  ·  Yamari Group          ║"
echo "  ║   Intelligence System Online         ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${RESET}"

# ── 1. Install agent deps if needed ──
if [ ! -d "$ROOT/agents/node_modules" ]; then
  echo -e "${YELLOW}Installing agent dependencies…${RESET}"
  (cd "$ROOT/agents" && npm install)
fi

# ── 2. Install frontend deps if needed ──
if [ ! -d "$ROOT/artifact/app/node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies…${RESET}"
  (cd "$ROOT/artifact/app" && npm install)
fi

# ── 3. Validate environment ──
if [ ! -f "$ROOT/agents/.env" ]; then
  if [ -f "$ROOT/agents/.env.example" ]; then
    echo -e "${YELLOW}No agents/.env found — copying from .env.example${RESET}"
    cp "$ROOT/agents/.env.example" "$ROOT/agents/.env"
    echo -e "${YELLOW}⚠ Edit agents/.env and set your ANTHROPIC_API_KEY before full operation${RESET}"
  fi
fi

# ── 4. Start MAXIMUS server in background ──
echo -e "${GREEN}Starting MAXIMUS intelligence server on port 3001…${RESET}"
(cd "$ROOT/agents" && npm run server) &
MAXIMUS_PID=$!
echo "  MAXIMUS PID: $MAXIMUS_PID"

# ── 5. Start Vite dev server ──
echo -e "${GREEN}Starting Vite dev server on port 5174…${RESET}"
(cd "$ROOT/artifact/app" && npm run dev) &
VITE_PID=$!
echo "  Vite PID: $VITE_PID"

echo ""
echo -e "${CYAN}  ► Dashboard: http://localhost:5174${RESET}"
echo -e "${CYAN}  ► MAXIMUS:   http://localhost:3001/health${RESET}"
echo ""
echo "  Press Ctrl+C to stop all services"

# ── Cleanup on exit ──
trap "echo ''; echo 'Shutting down…'; kill $MAXIMUS_PID $VITE_PID 2>/dev/null; exit 0" INT TERM
wait
