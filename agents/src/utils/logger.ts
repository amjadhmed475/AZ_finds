import type { AgentRole, AgentLogEntry } from "../types.js";

const COLORS: Record<AgentRole, string> = {
  DIRECTOR: "\x1b[33m",   // gold
  SCOUT:    "\x1b[36m",   // cyan
  MAXIMUS:  "\x1b[35m",   // magenta
  HERALD:   "\x1b[32m",   // green
};
const RESET = "\x1b[0m";
const DIM   = "\x1b[2m";
const BOLD  = "\x1b[1m";

const log: AgentLogEntry[] = [];

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function agentLog(agent: AgentRole, message: string, data?: unknown): AgentLogEntry {
  const entry: AgentLogEntry = { ts: new Date().toISOString(), agent, message, data };
  log.push(entry);

  const color = COLORS[agent];
  const label = `${BOLD}${color}◆ ${agent.padEnd(9)}${RESET}`;
  const time  = `${DIM}[${now()}]${RESET}`;
  console.log(`${time} ${label} ${message}`);
  if (data && process.env.VERBOSE === "true") {
    console.log(`          ${DIM}${JSON.stringify(data, null, 2).split("\n").join("\n          ")}${RESET}`);
  }
  return entry;
}

export function divider(label?: string) {
  const line = "─".repeat(60);
  if (label) {
    const pad = Math.max(0, Math.floor((60 - label.length - 2) / 2));
    console.log(`\x1b[2m${"─".repeat(pad)} ${label} ${"─".repeat(pad)}${RESET}`);
  } else {
    console.log(`\x1b[2m${line}${RESET}`);
  }
}

export function getLog(): AgentLogEntry[] {
  return [...log];
}

export function banner() {
  console.log(`
\x1b[33m╔══════════════════════════════════════════════════════════╗
║        YAMARI GROUP — INTELLIGENCE DIVISION              ║
║        Daily Briefing System  ·  Agent Swarm v1          ║
╚══════════════════════════════════════════════════════════╝\x1b[0m
`);
}
