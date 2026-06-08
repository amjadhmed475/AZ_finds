import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_CATALOG } from "../data/seedCatalog.js";
import { buildCandidate } from "../tools/analyzeProduct.js";
import { resetApiCounters, getApiUsageStatus, apiSnapshot } from "./apiUsageService.js";
import { normalizeText } from "../utils/normalize.js";
import { checkRestriction } from "./restrictionService.js";
import { GRADE_LADDER } from "../types/grade.js";
import type { DailyProductBatch, BatchProduct, RejectedProduct } from "../types/batch.js";
import type { DataMode } from "../types/api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BATCH_DIR = join(__dirname, "..", "..", "data", "batches");

export interface BatchParams {
  date: string;
  min_products?: number;
  data_mode?: DataMode;
  force_refresh?: boolean;
  categories?: string[];
  max_api_calls?: number;
  marketplace?: string;
}

const gradeIdx = (g: string) => GRADE_LADDER.indexOf(g as any);

const RESTRICTED_DEMO: Array<[string, string]> = [
  ["Daily Multivitamin Gummies", "Health"],
  ["Lithium Power Bank 20000mAh", "Electronics"],
  ["Vitamin C Face Serum", "Beauty"],
  ["Pepper Spray Keychain", "Self-defense"],
  ["CBD Sleep Drops", "Wellness"],
];

export async function generateDailyBatch(params: BatchParams): Promise<DailyProductBatch> {
  const date = params.date;
  const min = params.min_products ?? 50;
  const dataMode: DataMode = params.data_mode ?? "hybrid_low_cost";
  const file = join(BATCH_DIR, `${date}.json`);

  if (!params.force_refresh) {
    try {
      const cached = await readFile(file, "utf8");
      return JSON.parse(cached) as DailyProductBatch;
    } catch { /* not cached → generate */ }
  }

  resetApiCounters();

  // date-seeded rotation over the catalog
  const cats = (params.categories || []).map(normalizeText);
  let pool = SEED_CATALOG.filter((s) => !cats.length || cats.some((c) => normalizeText(`${s.category} ${s.product_type}`).includes(c)));
  if (pool.length < min) pool = SEED_CATALOG; // fall back to full catalog to hit the minimum
  const dayMs = Date.parse(date);
  const dayIdx = Number.isFinite(dayMs) ? Math.floor(dayMs / 86_400_000) % pool.length : 0;
  const rotated = [...pool.slice(dayIdx), ...pool.slice(0, dayIdx)];

  const products: BatchProduct[] = [];
  const rejected: RejectedProduct[] = [];
  let processed = 0;

  // Keep building until at least `min` products pass (or the pool is exhausted).
  for (const seed of rotated) {
    if (products.length >= min) break;
    processed += 1;
    let built;
    try {
      built = await buildCandidate(seed, {
        marketplace: params.marketplace || "US",
        include_alibaba: dataMode !== "estimate_engine_only",
        include_aliexpress: dataMode !== "estimate_engine_only",
        include_wholesale_us: true,
      });
    } catch {
      continue;
    }
    const { candidate, profitability, suppliers, risk } = built;
    const grade = candidate.grade?.grade ?? "C3";

    // quality gates → rejected vs passed
    if (profitability.net_profit <= 0) {
      rejected.push(reject(candidate, "Estimated net profit per unit is not positive.", "negative_net_profit", grade));
      continue;
    }
    if (suppliers.length === 0) {
      rejected.push(reject(candidate, "No supplier match or sourcing route found.", "no_supplier_match", grade));
      continue;
    }
    if (gradeIdx(grade) > gradeIdx("D3")) {
      rejected.push(reject(candidate, `Grade ${grade} — below the pursue threshold.`, "grade_too_low", grade));
      continue;
    }
    const bucket: BatchProduct["bucket"] = gradeIdx(grade) <= gradeIdx("B3") ? "top" : "needs_check";
    products.push({ candidate, profitability, suppliers, risk, bucket });
  }

  // grade distribution over passed products
  const dist = new Map<string, number>();
  for (const p of products) {
    const g = p.candidate.grade?.grade ?? "C3";
    dist.set(g, (dist.get(g) ?? 0) + 1);
  }
  const grade_distribution = GRADE_LADDER
    .map((grade) => ({ grade, count: dist.get(grade) ?? 0 }))
    .filter((d) => d.count > 0);
  const topGradeCount = products.filter((p) => gradeIdx(p.candidate.grade?.grade ?? "C3") <= gradeIdx("A1")).length;

  // Restricted-category rejection demos so the engine is always visible.
  for (const [name, category] of RESTRICTED_DEMO) {
    const rc = checkRestriction(name);
    if (rc.reasons.length) {
      rejected.push({
        id: name.toLowerCase().replace(/\s+/g, "-"), name, category,
        rejection_reason: rc.reasons.join(" "), rejected_by_rule: "restricted_category",
        risk_level: "high", would_have_grade: "D1", citations: [],
      });
    }
  }

  const snap = apiSnapshot();
  const api_usage = getApiUsageStatus({ data_mode: dataMode, product_count: processed, max_api_calls: params.max_api_calls ?? 20, date });
  const sourcesLive = api_usage.sources.some((s) => s.connected);

  const batch: DailyProductBatch = {
    batch_id: `batch-${date}`,
    batch_date: date,
    batch_source: sourcesLive ? "hybrid (estimate + live)" : "estimate engine (seed catalog)",
    data_mode: dataMode,
    products_generated: processed,
    products_passed: products.length,
    products_rejected: rejected.length,
    products,
    rejected_products: rejected,
    grade_distribution,
    top_grade_count: topGradeCount,
    data_source_status: sourcesLive ? "one or more live sources connected" : "estimate engine only (sources locked)",
    api_usage,
    cache_stats: { cache_hits: api_usage.cache_hits, cache_misses: snap.misses, reused: api_usage.cache_hits },
    created_at: new Date().toISOString(),
  };

  try {
    await mkdir(BATCH_DIR, { recursive: true });
    await writeFile(file, JSON.stringify(batch, null, 2), "utf8");
  } catch { /* non-fatal: still return the batch */ }

  return batch;
}

function reject(candidate: any, reason: string, rule: string, grade: any): RejectedProduct {
  return {
    id: candidate.id,
    name: candidate.name,
    category: candidate.category,
    rejection_reason: reason,
    rejected_by_rule: rule,
    risk_level: candidate.risk_level,
    would_have_grade: grade,
    citations: candidate.citations ?? [],
  };
}

export { BATCH_DIR };

export async function loadBatch(date: string): Promise<DailyProductBatch | null> {
  try {
    return JSON.parse(await readFile(join(BATCH_DIR, `${date}.json`), "utf8")) as DailyProductBatch;
  } catch {
    return null;
  }
}

export async function loadLatestBatch(): Promise<DailyProductBatch | null> {
  try {
    const files = (await readdir(BATCH_DIR)).filter((f) => f.endsWith(".json")).sort();
    if (!files.length) return null;
    return JSON.parse(await readFile(join(BATCH_DIR, files[files.length - 1]), "utf8")) as DailyProductBatch;
  } catch {
    return null;
  }
}
