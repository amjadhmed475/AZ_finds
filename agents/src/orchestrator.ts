import { CONFIG }             from "./config.js";
import { agentLog, divider, getLog } from "./utils/logger.js";
import { validateEnv, logValidationReport } from "./utils/envValidator.js";
import { ScoutAgent }        from "./agents/scout.js";
import { MaximusAgent }      from "./agents/maximus.js";
import { HeraldAgent }       from "./agents/herald.js";
import { ErrorHunterAgent }  from "./agents/errorHunter.js";
import { ErrorFixerAgent }   from "./agents/errorFixer.js";
import type { MissionResult } from "./types.js";

/* ────────────────────────────────────────────────────────── */
/*  THE DIRECTOR — Orchestrator Agent                         */
/*  Role: Chief Executive, Mission Commander                  */
/*  Powered by: claude-opus-4-8                              */
/*                                                            */
/*  PIPELINE:                                                 */
/*    Director → ErrorHunter → ErrorFixer (auto-heal)        */
/*             → Scout (research) → Maximus (intel)          */
/*             → Herald (compose + dispatch iMessage)        */
/* ────────────────────────────────────────────────────────── */
export class Director {
  readonly name  = "DIRECTOR";
  readonly title = "Chief Executive Agent";

  private scout   = new ScoutAgent();
  private maximus = new MaximusAgent();
  private herald  = new HeraldAgent();
  private hunter  = new ErrorHunterAgent();
  private fixer   = new ErrorFixerAgent();

  async runDailyMission(): Promise<MissionResult> {
    const start = Date.now();
    const date  = new Date().toISOString().slice(0, 10);

    divider("MISSION START");
    agentLog("DIRECTOR", `Daily intelligence mission — ${date}`);
    agentLog("DIRECTOR", `Agents online: Hunter · Fixer · Scout · Maximus · Herald`);
    divider();

    /* ── Phase 0: Environment Health ── */
    divider("PHASE 0 — DIAGNOSTICS");
    const envReport = validateEnv();
    logValidationReport(envReport);
    if (!envReport.allValid) {
      agentLog("DIRECTOR", "Running ErrorHunter + ErrorFixer before mission…");
      const huntReport = await this.hunter.run();
      if (!huntReport.healthy) {
        await this.fixer.run(huntReport);
      }
    }

    let scout, maximus, briefing;

    /* ── Phase 1: Intelligence Gathering ── */
    divider("PHASE 1 — RESEARCH");
    try {
      scout = await this.scout.run();
    } catch (err: any) {
      agentLog("DIRECTOR", `ABORT: Scout failed — ${err.message}`);
      return this.abortMission(date, start, err.message);
    }

    /* ── Phase 2: Market Intelligence ── */
    divider("PHASE 2 — INTELLIGENCE");
    try {
      maximus = await this.maximus.run(scout);
    } catch (err: any) {
      agentLog("DIRECTOR", `Maximus error (non-fatal): ${err.message}`);
      maximus = {
        marketPulse:       "Market intelligence unavailable — API error.",
        strategicInsights: ["Verify API key in agents/.env"],
        buySignal:         "MODERATE" as const,
        focusCategory:     scout.topProducts[0]?.category ?? "Home & Kitchen",
        weeklyOutlook:     "Manual review recommended.",
        confidenceNote:    "Maximus agent offline for this cycle.",
      };
    }

    /* ── Phase 3: Communications ── */
    divider("PHASE 3 — COMMUNICATIONS");
    try {
      briefing = await this.herald.run(scout, maximus);
    } catch (err: any) {
      agentLog("DIRECTOR", `Herald error: ${err.message}`);
      briefing = { success: false, dryRun: false, error: err.message };
    }

    /* ── Mission Complete ── */
    divider("MISSION COMPLETE");
    const durationMs = Date.now() - start;
    agentLog("DIRECTOR", `Mission complete in ${(durationMs / 1000).toFixed(1)}s — brief ${briefing.success ? "✓ delivered" : "✗ failed"}`);

    return { date, success: briefing.success, scout, maximus, briefing, durationMs, agentLog: getLog() };
  }

  private abortMission(date: string, start: number, reason: string): MissionResult {
    return {
      date, success: false,
      scout: {
        batchDate: date, totalScanned: 0, totalPassed: 0,
        bestScore: 0, highestRoi: 0, averageMargin: 0, ungatedCount: 0,
        topProducts: [], mode: "sample",
      },
      maximus: {
        marketPulse: "Mission aborted.", strategicInsights: [reason],
        buySignal: "CAUTIOUS", focusCategory: "n/a",
        weeklyOutlook: "Fix the error and re-run.", confidenceNote: "No data.",
      },
      briefing:   { success: false, dryRun: false, error: reason },
      durationMs: Date.now() - start,
      agentLog:   getLog(),
    };
  }
}
