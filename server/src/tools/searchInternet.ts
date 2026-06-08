import { findOpportunitiesDetailed, type RejectedSeed } from "../services/searchService.js";
import { buildCandidate, type BuiltCandidate } from "./analyzeProduct.js";
import type { ProductCandidate } from "../types/product.js";
import type { SupplierOption } from "../types/supplier.js";
import type { ProfitabilityAnalysis } from "../types/profitability.js";
import type { RiskAnalysis } from "../types/dashboard.js";
import type { Citation } from "../types/citations.js";

export interface ResearchParams {
  query: string;
  category_preferences?: string[];
  max_landed_cost?: number;
  min_roi_percent?: number;
  min_margin_percent?: number;
  avoid_categories?: string[];
  supplier_regions?: string[];
  include_alibaba?: boolean;
  include_aliexpress?: boolean;
  include_wholesale_sites?: boolean;
  max_results?: number;
  country_marketplace?: string;
}

export interface ResearchResult {
  products: ProductCandidate[];
  suppliers: SupplierOption[];
  profitability: ProfitabilityAnalysis[];
  risks: RiskAnalysis[];
  citations: Citation[];
  warnings: string[];
  scanned: number;
  passed: number;
  mode: "mock" | "real";
  rejected: RejectedSeed[];
}

export async function runResearch(params: ResearchParams): Promise<ResearchResult> {
  const warnings: string[] = [];
  const mode: "mock" | "real" =
    process.env.SERPAPI_KEY || process.env.BING_SEARCH_API_KEY || process.env.KEEPA_API_KEY ? "real" : "mock";
  if (mode === "mock") {
    warnings.push("Estimate engine active. Live data sources are locked for now (planned once the business passes $10k in sales); figures are directional until a source is connected.");
  } else {
    warnings.push("Live mode: connected data sources are in use.");
  }

  const found = await findOpportunitiesDetailed({
    query: params.query,
    category_preferences: params.category_preferences,
    avoid_categories: params.avoid_categories,
    max_landed_cost: params.max_landed_cost,
    max_results: params.max_results ?? 20,
  });
  const seeds = found.accepted;

  const scanned = seeds.length;
  const bundles: BuiltCandidate[] = [];
  for (const seed of seeds) {
    try {
      const b = await buildCandidate(seed, {
        marketplace: params.country_marketplace || "US",
        include_alibaba: params.include_alibaba,
        include_aliexpress: params.include_aliexpress,
        include_wholesale_us: params.include_wholesale_sites,
      });
      bundles.push(b);
    } catch (e) {
      warnings.push(`Skipped "${seed.name}": ${(e as Error).message}`);
    }
  }

  // Apply ROI / margin gates.
  const minRoi = params.min_roi_percent ?? 0;
  const minMargin = params.min_margin_percent ?? 0;
  const passing = bundles.filter(
    (b) => b.profitability.roi_percent >= minRoi && b.profitability.net_margin_percent >= minMargin
  );
  if (passing.length < bundles.length) {
    warnings.push(`${bundles.length - passing.length} product(s) filtered out for not meeting ROI ≥ ${minRoi}% or margin ≥ ${minMargin}%.`);
  }

  passing.sort((a, b) => b.candidate.opportunity_score - a.candidate.opportunity_score);

  warnings.push("Gating shown is an estimate; confirm in Seller Central when you create the listing.");

  const allCitations: Citation[] = [];
  for (const b of passing) allCitations.push(...b.candidate.citations);

  return {
    products: passing.map((b) => b.candidate),
    suppliers: passing.flatMap((b) => b.suppliers),
    profitability: passing.map((b) => b.profitability),
    risks: passing.map((b) => b.risk),
    citations: dedupe(allCitations),
    warnings,
    scanned,
    passed: passing.length,
    mode,
    rejected: found.rejected,
  };
}

function dedupe(list: Citation[]): Citation[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    const k = `${c.source_url}::${c.claim_supported}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
