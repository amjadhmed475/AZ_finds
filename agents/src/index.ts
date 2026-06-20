#!/usr/bin/env node
/**
 * Yamari Group — Intelligence Division
 * Daily Briefing Agent System
 *
 * Usage:
 *   npm run briefing           — full run (sends iMessage)
 *   npm run briefing:dry       — dry run (print to console)
 *   DRY_RUN=true tsx src/index.ts
 */

import { CONFIG } from "./config.js";
import { banner, agentLog, divider } from "./utils/logger.js";
import { Director } from "./orchestrator.js";
import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  banner();

  /* Validate minimum config */
  if (!CONFIG.anthropicKey) {
    console.error("❌  ANTHROPIC_API_KEY is not set.\n    Copy agents/.env.example to agents/.env and add your key.");
    process.exit(1);
  }

  const director = new Director();
  const result   = await director.runDailyMission();

  /* Persist mission log for auditing */
  try {
    const logDir  = join(__dirname, "../../logs");
    const logFile = join(logDir, `mission-${result.date}.json`);
    const { mkdirSync } = await import("fs");
    mkdirSync(logDir, { recursive: true });
    await writeFile(logFile, JSON.stringify(result, null, 2), "utf8");
    agentLog("DIRECTOR", `Mission log saved → logs/mission-${result.date}.json`);
  } catch {}

  divider();
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
