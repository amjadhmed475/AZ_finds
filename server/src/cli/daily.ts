/**
 * Daily product cycle. Loads today's cached batch or generates a fresh one
 * (>=50 graded products), then writes the dashboard JSON.
 *   npm run research:daily            (load cache if present)
 *   npm run research:daily -- --force (force refresh)
 */
import { generateDailyBatch } from "../services/batchService.js";
import { buildBatchDashboard, writeDashboard, todayStr } from "./lib.js";

async function main() {
  const force = process.argv.includes("--force");
  const date = todayStr();
  const batch = await generateDailyBatch({ date, min_products: 50, data_mode: "hybrid_low_cost", force_refresh: force, max_api_calls: 20 });
  const dashboard = await buildBatchDashboard(batch);
  await writeDashboard(dashboard);
  console.error(`Daily batch ${batch.batch_id} (${force ? "fresh" : "cached/loaded"}): generated ${batch.products_generated}, passed ${batch.products_passed}, rejected ${batch.products_rejected}, top-grade ${batch.top_grade_count}.`);
  console.error(`Data source: ${batch.data_source_status}. API calls used: ${batch.api_usage.api_calls_used_today}, estimated saved: ${batch.api_usage.estimated_calls_saved}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
