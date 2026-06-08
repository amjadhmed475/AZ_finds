/**
 * Generate today's top 50+ graded product opportunities (forces a fresh batch)
 * and write the dashboard JSON.
 *   npm run research:top50
 */
import { generateDailyBatch } from "../services/batchService.js";
import { buildBatchDashboard, writeDashboard, todayStr } from "./lib.js";

async function main() {
  const date = todayStr();
  const batch = await generateDailyBatch({ date, min_products: 50, data_mode: "hybrid_low_cost", force_refresh: true, max_api_calls: 20 });
  const dashboard = await buildBatchDashboard(batch);
  await writeDashboard(dashboard);
  const grades = batch.grade_distribution.map((g) => `${g.grade}:${g.count}`).join(" ");
  console.error(`Top50 batch: passed ${batch.products_passed}, rejected ${batch.products_rejected}.`);
  console.error(`Grade distribution: ${grades}`);
  console.error(`Top 3:`);
  batch.products.slice(0, 3).forEach((b, i) => console.error(`  ${i + 1}. [${b.candidate.grade?.grade}] ${b.candidate.name} — ROI ${b.profitability.roi_percent}%`));
}

main().catch((e) => { console.error(e); process.exit(1); });
