import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDashboard } from "../tools/generateDashboardData.js";
import { calculateCapitalPlan, generatePpcStrategy, generateMarketingStrategy } from "../services/ppcService.js";
import type { DailyProductBatch } from "../types/batch.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");

export async function buildBatchDashboard(batch: DailyProductBatch) {
  const products = batch.products.map((b) => b.candidate);
  const suppliers = batch.products.flatMap((b) => b.suppliers);
  const profitability = batch.products.map((b) => b.profitability);
  const risks = batch.products.map((b) => b.risk);
  const buckets: Record<string, "top" | "needs_check"> = {};
  for (const b of batch.products) buckets[b.candidate.id] = b.bucket;

  const citations = dedupe(products.flatMap((p) => p.citations || []));
  const top = batch.products[0];
  const capitalPlanner = top
    ? calculateCapitalPlan({
        total_available_capital: 3000,
        product_landed_cost: top.profitability.landed_cost,
        sale_price: top.candidate.estimated_sale_price,
        expected_net_profit_before_ads: top.profitability.net_profit + top.profitability.ad_cost_estimate,
        risk_tolerance: "low",
      })
    : undefined;
  const ppcManager = top
    ? {
        selectedProductId: top.candidate.id,
        strategy: generatePpcStrategy({
          product_candidate_id: top.candidate.id, product_name: top.candidate.name, category: top.candidate.category,
          sale_price: top.candidate.estimated_sale_price, landed_cost: top.profitability.landed_cost,
          net_profit_per_unit: top.profitability.net_profit + top.profitability.ad_cost_estimate,
          monthly_budget: 450, keyword_seed_list: top.candidate.amazon_keywords, risk_tolerance: "low",
        }),
      }
    : undefined;
  const marketingStrategies = batch.products.slice(0, 5).map((b) =>
    generateMarketingStrategy({ product_candidate_id: b.candidate.id, product_name: b.candidate.name, category: b.candidate.category, sale_price: b.candidate.estimated_sale_price, main_features: b.candidate.amazon_keywords, risk_tolerance: "low" })
  );

  const dashboard = await buildDashboard({
    products, suppliers, profitability, risks, citations,
    mode: batch.api_usage.sources.some((s) => s.connected) ? "real" : "mock",
    buckets,
    capitalPlanner, ppcManager, marketingStrategies,
    batch: {
      batch_id: batch.batch_id, batch_date: batch.batch_date, batch_source: batch.batch_source,
      products_generated: batch.products_generated, products_passed: batch.products_passed,
      products_rejected: batch.products_rejected, top_grade_count: batch.top_grade_count,
      data_source_status: batch.data_source_status,
    },
    apiUsage: batch.api_usage,
    richRejected: batch.rejected_products,
    rejectedProducts: batch.rejected_products.map((r) => ({ name: r.name, category: r.category, reasons: [r.rejection_reason] })),
  });

  return dashboard;
}

export async function writeDashboard(dashboard: unknown) {
  const publicDir = join(ROOT, "artifact", "app", "public");
  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, "sample-dashboard.json"), JSON.stringify(dashboard, null, 2), "utf8");
  await writeFile(join(ROOT, "sample-dashboard.json"), JSON.stringify(dashboard, null, 2), "utf8");
}

function dedupe<T extends { source_url?: string; claim_supported?: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    const k = `${c.source_url}::${c.claim_supported}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
