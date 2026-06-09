import type { ProductCandidate } from "../types/product.js";
import type { SupplierOption } from "../types/supplier.js";
import type { ProfitabilityAnalysis } from "../types/profitability.js";
import type { DashboardJson, RiskAnalysis, RejectedProduct } from "../types/dashboard.js";
import type { Citation } from "../types/citations.js";
import type { CapitalPlan, PPCStrategy, MarketingStrategy } from "../types/ppc.js";
import { getTrend } from "../services/trendService.js";
import { round } from "../utils/normalize.js";

export interface DashboardInput {
  products: ProductCandidate[];
  suppliers: SupplierOption[];
  profitability: ProfitabilityAnalysis[];
  risks: RiskAnalysis[];
  citations: Citation[];
  mode?: "mock" | "real";
  rejectedProducts?: RejectedProduct[];
  capitalPlanner?: CapitalPlan;
  ppcManager?: { selectedProductId: string; strategy: PPCStrategy };
  marketingStrategies?: MarketingStrategy[];
  buckets?: Record<string, "top" | "needs_check">;
  batch?: DashboardJson["batch"];
  apiUsage?: DashboardJson["apiUsage"];
  richRejected?: DashboardJson["richRejected"];
}

export async function buildDashboard(input: DashboardInput): Promise<DashboardJson> {
  const { products, suppliers, profitability, risks } = input;
  const profById = new Map(profitability.map((p) => [p.product_candidate_id, p]));
  const supByProduct = groupBy(suppliers, (s) => s.product_candidate_id);
  const riskByProduct = groupBy(risks, (r) => r.product_candidate_id);

  const ranked = [...products].sort((a, b) => b.opportunity_score - a.opportunity_score);

  const margins = profitability.map((p) => p.net_margin_percent);
  const rois = profitability.map((p) => p.roi_percent);
  const ungated = products.filter((p) => p.gating_status === "likely ungated").length;
  const manual = products.filter((p) => p.gating_status === "manual check required").length;

  const summary = {
    productsScanned: products.length,
    productsPassed: products.length,
    bestScore: ranked.length ? ranked[0].opportunity_score : 0,
    highestRoi: rois.length ? round(Math.max(...rois), 1) : 0,
    averageMargin: margins.length ? round(margins.reduce((a, b) => a + b, 0) / margins.length, 1) : 0,
    likelyUngatedCount: ungated,
    manualCheckRequiredCount: manual,
  };

  const dashProducts = ranked.map((p) => {
    const prof = profById.get(p.id);
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      seller_count: p.seller_count,
      trend_status: p.trend_status,
      gating_status: p.gating_status,
      risk_level: p.risk_level,
      opportunity_score: p.opportunity_score,
      recommended_action: p.recommended_action,
      estimatedSalePrice: p.estimated_sale_price,
      estimatedMonthlySales: p.estimated_monthly_sales,
      estimatedRevenue: p.estimated_revenue,
      reviewRating: p.review_rating_average,
      reviewCount: p.review_count_average,
      profitability: {
        unitCost: prof?.unit_cost ?? 0,
        landedCost: prof?.landed_cost ?? 0,
        fbaFee: prof?.fba_fee ?? 0,
        referralFee: prof?.amazon_referral_fee ?? 0,
        netProfit: prof?.net_profit ?? 0,
        roi: prof?.roi_percent ?? 0,
        margin: prof?.net_margin_percent ?? 0,
        breakEvenPrice: prof?.break_even_price ?? 0,
      },
      suppliers: supByProduct.get(p.id) ?? [],
      risks: riskByProduct.get(p.id) ?? [],
      citations: p.citations,
      grade: p.grade,
      image: p.image,
      capitalFit: p.grade?.criteria_scores.capital_fit,
      bucket: input.buckets?.[p.id] ?? "top",
      checks: buildChecks(p, prof, supByProduct.get(p.id) ?? [], (riskByProduct.get(p.id) ?? [])[0]),
    };
  });

  // chart series
  const short = (n: string) => (n.length > 22 ? n.slice(0, 21) + "…" : n);
  const scoreChart = ranked.map((p) => ({ name: short(p.name), value: p.opportunity_score }));
  const roiChart = ranked.map((p) => ({ name: short(p.name), value: profById.get(p.id)?.roi_percent ?? 0 }));
  const marginChart = ranked.map((p) => ({ name: short(p.name), value: profById.get(p.id)?.net_margin_percent ?? 0 }));
  const salesChart = ranked.map((p) => ({ name: short(p.name), value: p.estimated_monthly_sales }));
  const riskMap: Record<string, number> = { low: 0, medium: 0, high: 0 };
  for (const p of products) riskMap[p.risk_level] = (riskMap[p.risk_level] ?? 0) + 1;
  const riskChart = Object.entries(riskMap).map(([name, value]) => ({ name, value }));
  const supplierCostChart = ranked.map((p) => {
    const best = (supByProduct.get(p.id) ?? [])[0];
    return { name: short(p.name), value: best?.estimated_landed_cost ?? 0 };
  });
  const demandCompetitionScatter = ranked.map((p) => ({
    name: short(p.name),
    demand: p.estimated_monthly_sales,
    competition: p.seller_count,
    score: p.opportunity_score,
  }));
  const catMap: Record<string, number> = {};
  for (const p of products) catMap[p.category] = (catMap[p.category] ?? 0) + 1;
  const categoryDistribution = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // grade distribution (from products if not supplied)
  const gradeDistribution = (() => {
    if (input.batch && (input as any).gradeDistribution) return (input as any).gradeDistribution;
    const gm = new Map<string, number>();
    for (const p of products) { const g = p.grade?.grade; if (g) gm.set(g, (gm.get(g) ?? 0) + 1); }
    return Array.from(gm.entries()).map(([grade, count]) => ({ grade: grade as any, count }));
  })();

  // trend timelines for the top 3
  const trendTimeline = [];
  for (const p of ranked.slice(0, 3)) {
    const t = await getTrend(p.amazon_keywords[0] || p.name);
    trendTimeline.push({ name: short(p.name), series: t.series });
  }

  return {
    summary,
    products: dashProducts,
    charts: { scoreChart, roiChart, marginChart, salesChart, riskChart, supplierCostChart, demandCompetitionScatter, trendTimeline, categoryDistribution },
    citations: input.citations,
    mode: input.mode,
    dataSources: [
      { name: "Amazon SP-API", env: "SP_API_REFRESH_TOKEN" },
      { name: "Amazon Ads API", env: "AMAZON_ADS_REFRESH_TOKEN" },
      { name: "Amazon Creators API", env: "AMAZON_CREATORS_API_KEY" },
      { name: "Keepa", env: "KEEPA_API_KEY" },
      { name: "retailerapi (live price)", env: "RETAILERAPI_KEY" },
      { name: "SerpAPI", env: "SERPAPI_KEY" },
      { name: "Bing Search", env: "BING_SEARCH_API_KEY" },
    ].map((s) => {
      const connected = Boolean(process.env[s.env]);
      return { name: s.name, connected, status: connected ? ("live" as const) : ("locked" as const) };
    }),
    unlockTarget: 10000,
    rejectedProducts: input.rejectedProducts,
    capitalPlanner: input.capitalPlanner,
    ppcManager: input.ppcManager,
    marketingStrategies: input.marketingStrategies,
    batch: input.batch,
    apiUsage: input.apiUsage,
    gradeDistribution,
    richRejected: input.richRejected,
  };
}

function buildChecks(c: any, p: any, suppliers: any[], r: any) {
  const mk = (label: string, state: "pass" | "fail" | "pending") => ({ label, state });
  const beAcos = p ? (p.net_profit + p.ad_cost_estimate) / Math.max(0.01, p.sale_price) * 100 : 0;
  return [
    mk("Restricted category passed", "pass"),
    mk("Seller Central check", c.gating_status === "likely ungated" ? "pass" : "pending"),
    mk("Supplier found", suppliers.length ? "pass" : "fail"),
    mk("Profit positive", p && p.net_profit > 0 ? "pass" : "fail"),
    mk("ROI above target", p && p.roi_percent >= 30 ? "pass" : "fail"),
    mk("Margin above target", p && p.net_margin_percent >= 20 ? "pass" : "fail"),
    mk("PPC viable", beAcos >= 15 ? "pass" : "pending"),
    mk("Trend acceptable", ["rising", "stable"].includes(c.trend_status) ? "pass" : "pending"),
    mk("Image available", c.image ? "pass" : "fail"),
    mk("Citations attached", (c.citations || []).length ? "pass" : "fail"),
    mk("Capital fit", (c.grade?.criteria_scores?.capital_fit ?? 0) >= 3 ? "pass" : "pending"),
  ];
}

function groupBy<T>(arr: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    (m.get(k) ?? m.set(k, []).get(k)!).push(item);
  }
  return m;
}
