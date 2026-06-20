import Anthropic from "@anthropic-ai/sdk";
import { CONFIG } from "../config.js";
import { agentLog } from "../utils/logger.js";
import { sendIMessage, ensureMessagesRunning, iMessageAvailable } from "../utils/imessage.js";
import type { ScoutReport, MaximusReport, BriefingPayload, BriefingResult } from "../types.js";

const SIGNAL_EMOJI: Record<string, string> = {
  STRONG:   "🟢",
  MODERATE: "🟡",
  CAUTIOUS: "🔴",
};

/* ────────────────────────────────────────────────────────── */
/*  HERALD AGENT                                              */
/*  Role: Director of Communications                         */
/*  Formats the daily briefing and delivers via iMessage.    */
/* ────────────────────────────────────────────────────────── */
export class HeraldAgent {
  readonly name  = "HERALD";
  readonly title = "Director of Communications";

  async run(scout: ScoutReport, maximus: MaximusReport): Promise<BriefingResult> {
    agentLog("HERALD", "Composing daily intelligence brief…");

    const message = this.compose(scout, maximus);
    const payload: BriefingPayload = { scout, maximus, formattedMessage: message };

    agentLog("HERALD", `Brief composed — ${message.length} chars · ${message.split("\n").length} lines`);

    return this.dispatch(payload);
  }

  /* ── Format the iMessage ── */
  private compose(scout: ScoutReport, maximus: MaximusReport): string {
    const date = new Date();
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const signal   = SIGNAL_EMOJI[maximus.buySignal] ?? "🟡";
    const modeTag  = scout.mode === "live" ? "📡 LIVE" : "📊 ESTIMATE";

    const rankEmoji = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"];
    const gradeGlow = (g: string) => g.startsWith("A") ? "⭐" : g.startsWith("B") ? "✦" : "◦";

    const productLines = scout.topProducts.map((p, i) => {
      const sup = p.topSupplierName ? ` · ${p.topSupplierName}` : "";
      return [
        `${rankEmoji[i]} ${gradeGlow(p.grade)}${p.grade}  ${p.name}`,
        `   ROI ${p.roi.toFixed(0)}% · $${p.netProfit.toFixed(2)}/unit · ${p.margin.toFixed(0)}% margin`,
        `   ${p.category}${sup} · risk: ${p.risk}`,
      ].join("\n");
    }).join("\n\n");

    const insightLines = maximus.strategicInsights.map(i => `  › ${i}`).join("\n");

    return [
      `━━━━━━━━━━━━━━━━━━━━━━━`,
      `🧠 YAMARI INTEL BRIEF`,
      `📅 ${dayName} · ${dateStr}`,
      `⏰ ${timeStr}  ${modeTag}`,
      `━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `🏆 TODAY'S TOP 5`,
      ``,
      productLines,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━`,
      `⚡ MAXIMUS REPORT`,
      ``,
      maximus.marketPulse,
      ``,
      insightLines,
      ``,
      `${signal} Signal: ${maximus.buySignal}`,
      `📍 Focus: ${maximus.focusCategory}`,
      `👁 Outlook: ${maximus.weeklyOutlook}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━`,
      `📊 ${scout.totalScanned} scanned · ${scout.totalPassed} passed · ${scout.ungatedCount} ungated`,
      `⚠️ ${maximus.confidenceNote}`,
      ``,
      `— Yamari Group Intelligence —`,
    ].join("\n");
  }

  /* ── Send via iMessage or dry-run ── */
  private async dispatch(payload: BriefingPayload): Promise<BriefingResult> {
    const recipient = CONFIG.imessageTarget;
    const now       = new Date().toISOString();

    /* Dry run */
    if (CONFIG.dryRun) {
      agentLog("HERALD", "DRY RUN — printing brief to console instead of sending");
      console.log("\n" + "═".repeat(54));
      console.log(payload.formattedMessage);
      console.log("═".repeat(54) + "\n");
      return { success: true, dryRun: true, sentAt: now };
    }

    if (!recipient) {
      agentLog("HERALD", "No IMESSAGE_RECIPIENT set — switching to dry run");
      console.log("\n" + payload.formattedMessage + "\n");
      return { success: true, dryRun: true, sentAt: now };
    }

    if (!iMessageAvailable()) {
      agentLog("HERALD", "Messages.app not running — attempting to launch…");
      try { await ensureMessagesRunning(); } catch {}
    }

    try {
      await sendIMessage(recipient, payload.formattedMessage);
      agentLog("HERALD", `✓ iMessage dispatched to ${this.maskNumber(recipient)}`);
      return { success: true, recipient, sentAt: now, dryRun: false };
    } catch (err: any) {
      agentLog("HERALD", `iMessage failed: ${err.message} — printing to console as fallback`);
      console.log("\n" + payload.formattedMessage + "\n");
      return { success: false, recipient, error: err.message, dryRun: false };
    }
  }

  private maskNumber(n: string): string {
    if (n.length > 4) return n.slice(0, -4).replace(/\d/g, "*") + n.slice(-4);
    return "****";
  }
}
