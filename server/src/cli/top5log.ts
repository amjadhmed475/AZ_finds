/**
 * Append the current batch's TOP 5 products to a cumulative spreadsheet
 * (AZ_Finds_Daily_Top5.csv at the project root). Run before regenerating so the
 * spreadsheet captures the previous day's winners. Deduplicates per batch date.
 *   npm run research:top5log
 */
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLatestBatch } from "../services/batchService.js";
import { GRADE_LADDER } from "../types/grade.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const FILE = join(ROOT, "AZ_Finds_Daily_Top5.csv");

const HEADER = "date,rank,grade,product,category,score,roi_pct,margin_pct,net_profit,landed_cost,est_monthly_sales,best_supplier,supplier_url,gating,risk,decision\n";
const gi = (g?: string) => GRADE_LADDER.indexOf((g ?? "D1") as any);
const q = (s: any) => `"${String(s ?? "").replace(/"/g, '""')}"`;

async function main() {
  const batch = await loadLatestBatch();
  if (!batch) { console.error("No batch found. Run npm run research:daily first."); process.exit(1); }

  const date = batch.batch_date;
  let existing = "";
  try { existing = await readFile(FILE, "utf8"); } catch { /* new file */ }
  if (!existing) await writeFile(FILE, HEADER, "utf8");
  if (existing.split("\n").some((l) => l.startsWith(`"${date}"`) || l.startsWith(date + ","))) {
    console.error(`Top 5 for ${date} already logged — skipping.`);
    return;
  }

  const top = [...batch.products]
    .sort((a, b) => gi(a.candidate.grade?.grade) - gi(b.candidate.grade?.grade) || b.candidate.opportunity_score - a.candidate.opportunity_score)
    .slice(0, 5);

  const rows = top.map((bp, i) => {
    const c = bp.candidate; const p = bp.profitability; const sup = bp.suppliers?.[0];
    return [
      q(date), i + 1, c.grade?.grade ?? "", q(c.name), q(c.category), c.opportunity_score,
      p.roi_percent, p.net_margin_percent, p.net_profit, p.landed_cost, c.estimated_monthly_sales,
      q(sup?.supplier_name ?? ""), q(sup?.direct_product_url ?? ""), q(c.gating_status), c.risk_level,
      q(c.recommended_action ?? ""),
    ].join(",");
  }).join("\n") + "\n";

  await appendFile(FILE, rows, "utf8");
  console.error(`Logged top 5 for ${date} → ${FILE}`);
  top.forEach((bp, i) => console.error(`  ${i + 1}. [${bp.candidate.grade?.grade}] ${bp.candidate.name} (score ${bp.candidate.opportunity_score})`));
}

main().catch((e) => { console.error(e); process.exit(1); });
