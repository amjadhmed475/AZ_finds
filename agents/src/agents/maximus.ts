import Anthropic from "@anthropic-ai/sdk";
import { CONFIG } from "../config.js";
import { agentLog } from "../utils/logger.js";
import type { ScoutReport, MaximusReport, BuySignal } from "../types.js";

const SYSTEM_PROMPT = `You are MAXIMUS — Chief Intelligence Officer of Yamari Group's Amazon FBA Intelligence Division.

Your mission: Transform raw product data into strategic intelligence that drives profitable decisions.

COMMUNICATION STYLE:
- Executive and decisive — insights, not data dumps
- Confident with measured optimism — acknowledge risk, focus on opportunity
- Numbers-driven but narrative-led — every number tells a story
- Time-aware — you understand FBA market cycles, Q4 dynamics, seasonal patterns
- Honest about uncertainty — label estimates clearly

YOUR DELIVERABLE (respond ONLY with valid JSON, no markdown, no explanation):
{
  "marketPulse": "One crisp sentence on current FBA market conditions today",
  "strategicInsights": [
    "Insight 1 — specific to the products shown, not generic advice",
    "Insight 2 — supplier, competition, or timing angle",
    "Insight 3 — risk or opportunity the seller should act on now"
  ],
  "buySignal": "STRONG" | "MODERATE" | "CAUTIOUS",
  "focusCategory": "The single category worth doubling down on",
  "weeklyOutlook": "One sentence on what to watch for in the next 7 days",
  "confidenceNote": "One sentence honest uncertainty statement (data is estimated)"
}

SIGNAL CRITERIA:
- STRONG: multiple A-grade products, low competition, clear supplier paths, good margin
- MODERATE: mixed grades, some supply chain complexity, normal competition
- CAUTIOUS: mostly B/C grades, high competition, margin pressure, or uncertain gating`;

/* ────────────────────────────────────────────────────────── */
/*  MAXIMUS AGENT                                             */
/*  Role: Chief Intelligence Officer                         */
/*  Powered by: claude-sonnet-4-6                            */
/* ────────────────────────────────────────────────────────── */
export class MaximusAgent {
  readonly name    = "MAXIMUS";
  readonly title   = "Chief Intelligence Officer";
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: CONFIG.anthropicKey });
  }

  async run(scout: ScoutReport): Promise<MaximusReport> {
    agentLog("MAXIMUS", "Engaging market intelligence protocols…");

    const prompt = this.buildPrompt(scout);
    let raw = "";

    try {
      const response = await this.client.messages.create({
        model:      CONFIG.models.maximus,
        max_tokens: 800,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: "user", content: prompt }],
      });

      raw = response.content.find(b => b.type === "text")?.text ?? "";
      const report = this.parseReport(raw, scout);

      agentLog("MAXIMUS", `Intelligence report ready — signal: ${report.buySignal} · focus: ${report.focusCategory}`);
      return report;

    } catch (err: any) {
      agentLog("MAXIMUS", `API error: ${err.message} — generating fallback report`);
      return this.fallbackReport(scout);
    }
  }

  private buildPrompt(s: ScoutReport): string {
    const productLines = s.topProducts.map(p =>
      `${p.rank}. [${p.grade}] ${p.name} (${p.category})\n   Score: ${p.score.toFixed(1)} | ROI: ${p.roi.toFixed(1)}% | Margin: ${p.margin.toFixed(1)}% | Net: $${p.netProfit.toFixed(2)}/unit | Risk: ${p.risk} | Gating: ${p.gating}${p.topSupplierName ? ` | Best supplier: ${p.topSupplierName} @$${p.topSupplierCost?.toFixed(2)}` : ""}`
    ).join("\n");

    return `DAILY BATCH INTELLIGENCE BRIEF — ${s.batchDate}

BATCH SUMMARY:
- Products scanned: ${s.totalScanned} | Passed: ${s.totalPassed}
- Best score: ${s.bestScore.toFixed(1)}/100 | Highest ROI: ${s.highestRoi.toFixed(1)}%
- Avg margin: ${s.averageMargin.toFixed(1)}% | Ungated: ${s.ungatedCount}/${s.totalScanned}
- Data mode: ${s.mode === "live" ? "LIVE (Keepa/PA-API)" : "ESTIMATE (no live keys)"}

TOP 5 PRODUCTS:
${productLines}

Provide your intelligence assessment now.`;
  }

  private parseReport(raw: string, scout: ScoutReport): MaximusReport {
    /* Strip markdown code fences if Claude wrapped the JSON */
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      return {
        marketPulse:       String(parsed.marketPulse       ?? ""),
        strategicInsights: Array.isArray(parsed.strategicInsights) ? parsed.strategicInsights.slice(0, 3) : [],
        buySignal:         (["STRONG","MODERATE","CAUTIOUS"].includes(parsed.buySignal) ? parsed.buySignal : "MODERATE") as BuySignal,
        focusCategory:     String(parsed.focusCategory     ?? scout.topProducts[0]?.category ?? "Home & Kitchen"),
        weeklyOutlook:     String(parsed.weeklyOutlook     ?? ""),
        confidenceNote:    String(parsed.confidenceNote    ?? "All figures are estimates pending live data integration."),
      };
    } catch {
      agentLog("MAXIMUS", "JSON parse failed — using fallback");
      return this.fallbackReport(scout);
    }
  }

  private fallbackReport(scout: ScoutReport): MaximusReport {
    const topCat = scout.topProducts[0]?.category ?? "Home & Kitchen";
    const signal: BuySignal = scout.topProducts.some(p => p.grade.startsWith("A"))
      ? "STRONG" : scout.topProducts.some(p => p.grade.startsWith("B"))
      ? "MODERATE" : "CAUTIOUS";

    return {
      marketPulse: `Today's batch shows ${scout.totalPassed} qualified opportunities across ${scout.totalScanned} scanned products.`,
      strategicInsights: [
        `${topCat} leads with the highest-scoring opportunity at ${scout.bestScore.toFixed(1)}/100.`,
        `Peak ROI of ${scout.highestRoi.toFixed(1)}% suggests strong unit economics in this batch.`,
        `${scout.ungatedCount} of ${scout.totalScanned} products are likely ungated — minimal barrier to entry.`,
      ],
      buySignal: signal,
      focusCategory: topCat,
      weeklyOutlook: "Monitor supplier lead times and competitor restocking cycles.",
      confidenceNote: "All figures are estimates. Verify with Seller Central before ordering.",
    };
  }
}
