#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
#  AZ FINDS + MAXIMUS  ·  Unified Launcher
#
#  Starts:
#    MAXIMUS HTTP server  →  http://localhost:3001
#    Vite dev server      →  http://localhost:5174
#
#  MCP stdio server (for Claude Desktop):
#    cd server && npm start
# ════════════════════════════════════════════════════════════
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m';  BOLD='\033[1m';     RESET='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║   AZ FINDS + MAXIMUS  ·  Yamari Group        ║"
echo "  ║   Unified Intelligence Platform              ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${RESET}"

# ── .env setup ──
if [ ! -f "$ROOT/.env" ]; then
  if [ -f "$ROOT/.env.example" ]; then
    echo -e "${YELLOW}  ⚠  No .env found — copying from .env.example${RESET}"
    cp "$ROOT/.env.example" "$ROOT/.env"
    echo -e "${YELLOW}  ⚠  Edit .env and set ANTHROPIC_API_KEY before using MAXIMUS AI${RESET}\n"
  else
    echo -e "${RED}  ✗  No .env or .env.example — cannot start safely${RESET}"
    exit 1
  fi
fi

# ── Install deps ──
if [ ! -d "$ROOT/server/node_modules" ]; then
  echo -e "${YELLOW}  Installing server deps…${RESET}"
  (cd "$ROOT/server" && npm install --silent)
fi
if [ ! -d "$ROOT/artifact/app/node_modules" ]; then
  echo -e "${YELLOW}  Installing frontend deps…${RESET}"
  (cd "$ROOT/artifact/app" && npm install --silent)
fi
if [ ! -d "$ROOT/agents/node_modules" ]; then
  echo -e "${YELLOW}  Installing agent deps…${RESET}"
  (cd "$ROOT/agents" && npm install --silent)
fi

# ── MAXIMUS HTTP server ──
echo -e "${GREEN}  Starting MAXIMUS server on :3001…${RESET}"
(cd "$ROOT/server" && npm run dev:http 2>&1 | sed 's/^/  [MAXIMUS] /') &
MAXIMUS_PID=$!

# give it a moment to bind
sleep 1

# ── Vite dev server ──
echo -e "${GREEN}  Starting Vite on :5174…${RESET}"
(cd "$ROOT/artifact/app" && npm run dev 2>&1 | sed 's/^/  [VITE]    /') &
VITE_PID=$!

echo ""
echo -e "  ${BOLD}${CYAN}► Dashboard${RESET}  http://localhost:5174"
echo -e "  ${BOLD}${CYAN}► MAXIMUS  ${RESET}  http://localhost:3001/health"
echo -e "  ${CYAN}► MCP stdio${RESET}  cd server && npm start"
echo ""
echo -e "  ${YELLOW}API keys:${RESET} edit .env  (never committed)"
echo -e "  ${YELLOW}Deploy:  ${RESET} git push → Netlify auto-builds"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

trap 'echo ""; echo "  Shutting down…"; kill '"$MAXIMUS_PID $VITE_PID"' 2>/dev/null; exit 0' INT TERM
wait
