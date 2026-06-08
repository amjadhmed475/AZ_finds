/**
 * Offline demo: generates a daily batch of 50+ graded products (mock/estimate
 * mode, no keys), writes the dashboard JSON, plus a sample Amazon Ads CSV and a
 * PPC optimization output. Also appends restricted-category rejection examples
 * so the "Why Rejected" tab demonstrates the engine.
 *   npm run build && npm run research:sample
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateDailyBatch } from "../services/batchService.js";
import { buildBatchDashboard, writeDashboard, todayStr } from "./lib.js";
import { optimizeFromReport } from "../services/ppcService.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");

const SAMPLE_ADS_CSV = `Campaign Name,Ad Group Name,Customer Search Term,Match Type,Impressions,Clicks,CTR,CPC,Spend,Sales,Orders,ACOS
Auto - Discovery,Auto,collapsible storage bin,auto,5200,48,0.92%,0.51,24.48,98.50,5,24.9%
Auto - Discovery,Auto,fabric drawer organizer,auto,3100,22,0.71%,0.62,13.64,0,0,0%
Manual Exact - Winners,Exact,foldable closet bin,exact,4100,55,1.34%,0.47,25.85,142.00,8,18.2%
Manual Broad - Research,Broad,cheap storage box,broad,2600,31,1.19%,0.40,12.40,0,0,0%
Manual Phrase - Expansion,Phrase,closet storage bins for shelves,phrase,1800,16,0.89%,0.55,8.80,36.00,2,24.4%
Manual Broad - Research,Broad,used storage bin,broad,900,14,1.55%,0.38,5.32,0,0,0%`;

async function main() {
  const date = todayStr();
  const batch = await generateDailyBatch({ date, min_products: 50, data_mode: "hybrid_low_cost", force_refresh: true, max_api_calls: 20 });
  const dashboard: any = await buildBatchDashboard(batch);
  await writeDashboard(dashboard);

  // Sample Amazon Ads CSV + optimization output
  const reportsDir = join(ROOT, "reports");
  await mkdir(reportsDir, { recursive: true });
  await writeFile(join(reportsDir, "sample-amazon-ads-search-term-report.csv"), SAMPLE_ADS_CSV, "utf8");
  const rows = csvToRows(SAMPLE_ADS_CSV);
  const optimization = optimizeFromReport({ report_rows: rows, target_acos_percent: dashboard.ppcManager?.strategy.target_acos_percent ?? 25, break_even_acos_percent: dashboard.ppcManager?.strategy.break_even_acos_percent ?? 40 });
  await writeFile(join(reportsDir, "sample-ppc-optimization.json"), JSON.stringify(optimization, null, 2), "utf8");

  console.error(`Sample batch ${batch.batch_id}: passed ${batch.products_passed}, rejected ${batch.products_rejected}.`);
  console.error(`Grades: ${batch.grade_distribution.map((g) => `${g.grade}:${g.count}`).join(" ")}`);
  console.error(`Top: ${batch.products.slice(0, 3).map((b) => `[${b.candidate.grade?.grade}] ${b.candidate.name}`).join(" | ")}`);
}

function csvToRows(csv: string): Array<Record<string, string>> {
  const [head, ...lines] = csv.trim().split("\n");
  const cols = head.split(",");
  return lines.map((line) => {
    const vals = line.split(",");
    const row: Record<string, string> = {};
    cols.forEach((c, i) => (row[c] = vals[i] ?? ""));
    return row;
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
