import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { CONFIG } from "../config.js";
import { agentLog } from "../utils/logger.js";
import type { ScoutReport, ProductProfile } from "../types.js";

const GRADE_ORDER = ["A5","A4","A3","A2","A1","B5","B4","B3","B2","B1","C5","C4","C3","C2","C1","D5","D4","D3","D2","D1"];
const gradeRank = (g: string) => GRADE_ORDER.indexOf(g ?? "D1");

/* ────────────────────────────────────────────────────────── */
/*  SCOUT AGENT                                               */
/*  Role: Research & Data Acquisition                        */
/*  No AI calls — pure data engineering.                     */
/* ────────────────────────────────────────────────────────── */
export class ScoutAgent {
  readonly name = "SCOUT";
  readonly title = "Director of Research";

  async run(): Promise<ScoutReport> {
    agentLog("SCOUT", "Initiating product intelligence sweep…");

    const dashboard = await this.loadDashboard();
    const report    = this.buildReport(dashboard);

    agentLog("SCOUT", `Sweep complete — ${report.totalScanned} products loaded · best grade ${report.topProducts[0]?.grade ?? "n/a"} · top score ${report.bestScore.toFixed(1)}`);
    return report;
  }

  /* ── Try: dated batch → sample dashboard → run live batch ── */
  private async loadDashboard(): Promise<any> {
    const root      = CONFIG.azFindsRoot;
    const dateStr   = new Date().toISOString().slice(0, 10);
    const batchFile = join(root, "server", "data", "batches", `${dateStr}.json`);
    const sampleFile = join(root, "artifact", "app", "public", "sample-dashboard.json");
    const rootSample = join(root, "sample-dashboard.json");

    /* 1. Try today's dated batch (native server format) */
    if (existsSync(batchFile)) {
      agentLog("SCOUT", `Loading today's live batch (${dateStr})…`);
      return { _format: "batch", data: JSON.parse(await readFile(batchFile, "utf8")), mode: "live" };
    }

    /* 2. Try pre-built sample dashboard */
    for (const f of [sampleFile, rootSample]) {
      if (existsSync(f)) {
        agentLog("SCOUT", `Loading sample dashboard from ${f.split("/").slice(-3).join("/")} (demo mode)…`);
        return { _format: "dashboard", data: JSON.parse(await readFile(f, "utf8")), mode: "sample" };
      }
    }

    /* 3. Run the server CLI to generate a fresh batch */
    agentLog("SCOUT", "No cached batch found — running live research batch (may take 30-60 s)…");
    try {
      const serverDir = join(root, "server");
      if (!existsSync(join(serverDir, "dist", "cli", "daily.js"))) {
        agentLog("SCOUT", "Building server first…");
        execSync("npm run build", { cwd: serverDir, stdio: "pipe" });
      }
      execSync("npm run research:daily", { cwd: serverDir, stdio: "pipe", timeout: 120_000 });
      if (existsSync(batchFile)) {
        return { _format: "batch", data: JSON.parse(await readFile(batchFile, "utf8")), mode: "live" };
      }
    } catch (err: any) {
      agentLog("SCOUT", `Live batch failed: ${err.message} — falling back to sample`);
    }

    throw new Error("SCOUT: No product data available. Run `npm run research:sample` in /server first.");
  }

  /* ── Normalise both JSON formats to ScoutReport ── */
  private buildReport(loaded: { _format: string; data: any; mode: string }): ScoutReport {
    const { _format, data, mode } = loaded;

    if (_format === "dashboard") {
      /* Frontend dashboard format */
      const s = data.summary ?? {};
      const products: ProductProfile[] = [...(data.products ?? [])]
        .sort((a: any, b: any) => gradeRank(a.grade?.grade) - gradeRank(b.grade?.grade) || (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0))
        .slice(0, 5)
        .map((p: any, i: number): ProductProfile => ({
          rank:                  i + 1,
          id:                    p.id ?? "",
          name:                  p.name ?? "Unknown",
          category:              p.category ?? "General",
          grade:                 p.grade?.grade ?? "C1",
          score:                 p.opportunity_score ?? p.grade?.score_out_of_100 ?? 0,
          roi:                   p.profitability?.roi ?? 0,
          margin:                p.profitability?.margin ?? 0,
          netProfit:             p.profitability?.netProfit ?? 0,
          unitCost:              p.profitability?.unitCost ?? 0,
          landedCost:            p.profitability?.landedCost ?? 0,
          estimatedMonthlySales: p.estimatedMonthlySales ?? 0,
          risk:                  p.risks?.[0]?.overall_risk ?? p.risk_level ?? "unknown",
          gating:                p.gating_status ?? "unknown",
          decision:              p.recommended_action ?? "",
          topSupplierName:       p.suppliers?.[0]?.supplier_name,
          topSupplierCost:       p.suppliers?.[0]?.unit_cost_min,
        }));

      return {
        batchDate:    data.batch?.batch_date ?? new Date().toISOString().slice(0, 10),
        totalScanned: s.productsScanned ?? data.products?.length ?? 0,
        totalPassed:  s.productsPassed  ?? data.products?.length ?? 0,
        bestScore:    s.bestScore   ?? products[0]?.score ?? 0,
        highestRoi:   s.highestRoi  ?? products[0]?.roi   ?? 0,
        averageMargin:s.averageMargin ?? 0,
        ungatedCount: s.likelyUngatedCount ?? 0,
        topProducts:  products,
        mode:         mode as "live" | "sample",
      };
    }

    /* Raw server batch format */
    const allProducts = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);
    const sorted = [...allProducts]
      .sort((a: any, b: any) =>
        gradeRank(a.candidate?.grade?.grade) - gradeRank(b.candidate?.grade?.grade) ||
        (b.candidate?.opportunity_score ?? 0) - (a.candidate?.opportunity_score ?? 0)
      )
      .slice(0, 5);

    const products: ProductProfile[] = sorted.map((bp: any, i: number): ProductProfile => {
      const c   = bp.candidate   ?? bp;
      const prf = bp.profitability ?? {};
      const sup = bp.suppliers?.[0];
      return {
        rank:                  i + 1,
        id:                    c.id ?? String(i),
        name:                  c.name ?? "Unknown",
        category:              c.category ?? "General",
        grade:                 c.grade?.grade ?? "C1",
        score:                 c.opportunity_score ?? c.grade?.score_out_of_100 ?? 0,
        roi:                   prf.roi_percent ?? prf.roi ?? 0,
        margin:                prf.net_margin_percent ?? prf.margin ?? 0,
        netProfit:             prf.net_profit ?? prf.netProfit ?? 0,
        unitCost:              prf.unit_cost ?? prf.unitCost ?? 0,
        landedCost:            prf.landed_cost ?? prf.landedCost ?? 0,
        estimatedMonthlySales: c.estimated_monthly_sales ?? 0,
        risk:                  c.risk_level ?? "unknown",
        gating:                c.gating_status ?? "unknown",
        decision:              c.recommended_action ?? "",
        topSupplierName:       sup?.supplier_name,
        topSupplierCost:       sup?.unit_cost_min,
      };
    });

    const scores  = allProducts.map((p: any) => p.candidate?.opportunity_score ?? 0);
    const rois    = allProducts.map((p: any) => p.profitability?.roi_percent    ?? 0);
    const margins = allProducts.map((p: any) => p.profitability?.net_margin_percent ?? 0);

    return {
      batchDate:     data.batch_date ?? new Date().toISOString().slice(0, 10),
      totalScanned:  allProducts.length,
      totalPassed:   allProducts.filter((p: any) => (p.candidate?.grade?.grade ?? "D1").startsWith("A") || (p.candidate?.grade?.grade ?? "D1").startsWith("B")).length,
      bestScore:     Math.max(...scores, 0),
      highestRoi:    Math.max(...rois, 0),
      averageMargin: margins.length ? margins.reduce((a: number, b: number) => a + b, 0) / margins.length : 0,
      ungatedCount:  allProducts.filter((p: any) => (p.candidate?.gating_status ?? "").includes("ungated")).length,
      topProducts:   products,
      mode:          mode as "live" | "sample",
    };
  }
}
