import type { ProductSeed } from "../services/searchService.js";
import type { ProductCandidate, Confidence } from "../types/product.js";
import type { SupplierOption } from "../types/supplier.js";
import type { ProfitabilityAnalysis } from "../types/profitability.js";
import type { RiskAnalysis } from "../types/dashboard.js";

import { estimateMarket } from "../services/amazonEstimateService.js";
import { getTrend } from "../services/trendService.js";
import { findSuppliers } from "../services/supplierService.js";
import { referralFee, getReferralFeePercent, estimateFbaFee, estimateMonthlyStorage } from "../services/feeService.js";
import { scoreProduct } from "../services/scoringService.js";
import { computeProfitability } from "./calculateProfit.js";
import { analyzeGating } from "./analyzeGating.js";
import { dedupeCitations } from "../services/citationService.js";
import { gradeProduct } from "../services/gradingService.js";
import { buildProductImage } from "../services/imageService.js";
import { getAsinFor } from "../services/realDataService.js";
import { slugify, round } from "../utils/normalize.js";

export interface BuiltCandidate {
  candidate: ProductCandidate;
  suppliers: SupplierOption[];
  profitability: ProfitabilityAnalysis;
  risk: RiskAnalysis;
}

export interface BuildOptions {
  marketplace?: string;
  include_alibaba?: boolean;
  include_aliexpress?: boolean;
  include_wholesale_us?: boolean;
  ad_cost_percent?: number;
  return_rate_percent?: number;
  use_keepa_if_available?: boolean;
}

export async function buildCandidate(seed: ProductSeed, opts: BuildOptions = {}): Promise<BuiltCandidate> {
  const id = slugify(seed.name);

  const market = await estimateMarket({
    product_name: seed.name,
    keywords: seed.amazon_keywords,
    category: seed.category,
    marketplace: opts.marketplace,
    asin: seed.asin ?? getAsinFor(id),
    use_keepa_if_available: opts.use_keepa_if_available,
  });

  const trend = await getTrend(seed.amazon_keywords[0] || seed.name);

  const suppliers = await findSuppliers({
    product_candidate_id: id,
    product_name: seed.name,
    product_keywords: seed.amazon_keywords,
    target_unit_cost: seed.target_unit_cost,
    include_alibaba: opts.include_alibaba,
    include_aliexpress: opts.include_aliexpress,
    include_wholesale_us: opts.include_wholesale_us,
  });

  const best = suppliers[0];
  // Use the LIVE price when a real source (Keepa / retailerapi / user) provided one;
  // otherwise use the curated realistic price, NOT the hash-based market guess.
  const salePrice = market.price_source === "real" && market.average_price > 0 ? market.average_price : seed.price_hint;
  const unitCost = best ? round((best.unit_cost_min + best.unit_cost_max) / 2) : seed.target_unit_cost;
  // Inbound freight per unit: conservative floor so small-item costs aren't understated.
  const inbound = Math.max(0.5, best ? best.estimated_shipping : round(seed.target_unit_cost * 0.15));

  const fbaFee = estimateFbaFee(seed.weight_oz, seed.dimensions_in);
  const storage = estimateMonthlyStorage(seed.dimensions_in);

  const profitability = computeProfitability({
    product_candidate_id: id,
    sale_price: salePrice,
    unit_cost: unitCost,
    inbound_shipping_per_unit: inbound,
    packaging_cost: 0.3,
    prep_cost: 0.2,
    referral_fee_percent: market.referral_fee && salePrice > 0 ? round((market.referral_fee / salePrice) * 100, 1) : getReferralFeePercent(seed.category) * 100,
    fba_fee: fbaFee,
    storage_fee_estimate: storage,
    ad_cost_percent: opts.ad_cost_percent ?? 10,
    return_rate_percent: opts.return_rate_percent ?? 3,
  });

  const gating = analyzeGating({
    product_candidate_id: id,
    product_name: seed.name,
    category: seed.category,
    brand_status: "generic",
    marketplace: opts.marketplace,
  });

  // --- sub-scores ---
  const demand_score = salesToScore(market.estimated_monthly_sales);
  const competition_score = sellersToScore(market.number_of_sellers || seed.seller_count_hint);
  const profit_score = profitToScore(profitability.roi_percent, profitability.net_margin_percent);
  const supplier_score = best ? best.match_quality_score : 40;
  const gating_score = gatingToScore(gating.gating_status);
  const risk_score = riskToScore(gating.risk.overall_risk);
  const trend_score = trendToScore(trend.trend_status);
  const review_score = consistencyToScore(market.demand_consistency);

  const score = scoreProduct({
    demand_score, competition_score, profit_score, supplier_score,
    gating_score, risk_score, trend_score, review_score,
  });

  const generic_confidence: Confidence = "high";
  const citations = dedupeCitations([
    ...seed.citations, ...market.citations, ...trend.citations,
    ...(best ? best.citations : []),
  ]);

  const grade = gradeProduct({
    product_candidate_id: id,
    estimated_monthly_sales: market.estimated_monthly_sales,
    demand_consistency: market.demand_consistency,
    trend_status: trend.trend_status,
    demand_confidence: market.confidence,
    seller_count: market.number_of_sellers || seed.seller_count_hint,
    net_profit: profitability.net_profit,
    ad_cost_estimate: profitability.ad_cost_estimate,
    roi: profitability.roi_percent,
    margin: profitability.net_margin_percent,
    break_even_price: profitability.break_even_price,
    sale_price: salePrice,
    landed_cost: profitability.landed_cost,
    landed_known: Boolean(best),
    best_supplier: best ? { match_quality_score: best.match_quality_score, moq: best.moq, supplier_rating: best.supplier_rating } : null,
    supplier_count: suppliers.length,
    gating_status: gating.gating_status,
    category_risk: gating.risk.category_risk,
    generic_confidence,
    overall_risk: gating.risk.overall_risk,
    hazmat_risk: gating.risk.hazmat_risk,
    ip_risk: gating.risk.IP_risk,
    trademark_risk: gating.risk.trademark_risk,
    fragile_risk: gating.risk.fragile_risk,
    weight_oz: seed.weight_oz,
    restricted: seed.restricted_check?.restricted,
    data_confidence: market.confidence === "high" ? "live" : market.price_source === "real" ? "hybrid" : "estimate-level",
  });

  const image = buildProductImage(id, seed.name, seed.product_type, seed.category, { use_placeholders: true });

  const candidate: ProductCandidate = {
    id,
    name: seed.name,
    short_description: seed.short_description,
    category: seed.category,
    amazon_keywords: seed.amazon_keywords,
    estimated_sale_price: salePrice,
    estimated_monthly_sales: market.estimated_monthly_sales,
    estimated_revenue: round(salePrice * market.estimated_monthly_sales),
    seller_count: market.number_of_sellers || seed.seller_count_hint,
    review_count_average: Math.round((market.review_count_range[0] + market.review_count_range[1]) / 2),
    review_rating_average: market.review_rating_average,
    trend_status: trend.trend_status,
    demand_consistency: market.demand_consistency,
    gating_status: gating.gating_status,
    gated_confidence: gating.gating_confidence,
    product_type: seed.product_type,
    generic_confidence,
    opportunity_score: score.total_score_out_of_100,
    risk_level: gating.risk.overall_risk,
    recommended_action: score.recommendation,
    weight_oz: seed.weight_oz,
    dimensions_in: seed.dimensions_in,
    grade,
    image,
    citations,
  };

  return { candidate, suppliers, profitability, risk: gating.risk };
}

// ---- score mappings ----
function clamp(n: number) { return Math.max(0, Math.min(100, n)); }
function salesToScore(s: number) { return clamp(s >= 1500 ? 100 : s >= 600 ? 78 : s >= 300 ? 58 : s >= 100 ? 38 : s > 0 ? 18 : 0); }
function sellersToScore(n: number) { return clamp(n <= 8 ? 90 : n <= 15 ? 70 : n <= 25 ? 48 : 28); }
function profitToScore(roi: number, margin: number) {
  const r = clamp((roi / 100) * 60);   // 100% ROI → 60
  const m = clamp((margin / 40) * 40);  // 40% margin → 40
  return clamp(r + m);
}
function gatingToScore(s: string) {
  return s === "likely ungated" ? 85 : s === "possibly gated" ? 55 : s === "manual check required" ? 45 : s === "likely gated" ? 15 : 40;
}
function riskToScore(r: string) { return r === "low" ? 85 : r === "medium" ? 55 : 20; }
function trendToScore(t: string) {
  return t === "rising" ? 90 : t === "stable" ? 65 : t === "seasonal" ? 45 : t === "declining" ? 20 : 40;
}
function consistencyToScore(c: string) {
  return c === "very strong" ? 95 : c === "strong" ? 75 : c === "moderate" ? 50 : c === "weak" ? 25 : 35;
}
