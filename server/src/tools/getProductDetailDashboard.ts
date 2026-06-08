import { loadBatch, loadLatestBatch } from "../services/batchService.js";
import { generatePpcStrategy, generateKeywordPlan } from "../services/ppcService.js";

export interface DetailInput {
  product_id: string;
  batch_date?: string;
  include_profit?: boolean;
  include_suppliers?: boolean;
  include_ppc?: boolean;
  include_keywords?: boolean;
  include_risk?: boolean;
  include_citations?: boolean;
}

const MODAL_TABS = ["Overview", "Profit", "Suppliers", "PPC", "Keywords", "Risk", "Checks", "Citations"];

export async function getProductDetailDashboard(i: DetailInput) {
  const batch = i.batch_date ? await loadBatch(i.batch_date) : await loadLatestBatch();
  if (!batch) {
    return { error: "No batch found. Run generate_daily_product_batch first.", product_detail: null, modal_tabs: MODAL_TABS, charts: {}, checklist: [], citations: [] };
  }
  const found = batch.products.find((p) => p.candidate.id === i.product_id);
  if (!found) {
    return { error: `Product '${i.product_id}' not found in batch ${batch.batch_date}.`, product_detail: null, modal_tabs: MODAL_TABS, charts: {}, checklist: [], citations: [] };
  }

  const { candidate, profitability, suppliers, risk } = found;
  const ppc = i.include_ppc !== false
    ? generatePpcStrategy({
        product_candidate_id: candidate.id, product_name: candidate.name, category: candidate.category,
        sale_price: candidate.estimated_sale_price, landed_cost: profitability.landed_cost,
        net_profit_per_unit: profitability.net_profit + profitability.ad_cost_estimate,
        keyword_seed_list: candidate.amazon_keywords, risk_tolerance: "low",
      })
    : undefined;
  const keywords = i.include_keywords !== false
    ? generateKeywordPlan({ product_candidate_id: candidate.id, product_name: candidate.name, category: candidate.category, product_features: candidate.amazon_keywords })
    : undefined;

  const checklist = buildChecklist(candidate, profitability, suppliers, risk);

  return {
    product_detail: {
      ...candidate,
      profitability: i.include_profit !== false ? profitability : undefined,
      suppliers: i.include_suppliers !== false ? suppliers : undefined,
      risk: i.include_risk !== false ? risk : undefined,
      ppc, keywords,
      why_it_could_work: candidate.grade?.reason_summary,
      why_it_could_fail: candidate.grade?.weakness_summary,
      final_recommendation: candidate.recommended_action,
    },
    modal_tabs: MODAL_TABS,
    charts: {
      criteria: candidate.grade?.criteria_scores ?? {},
      sensitivity: profitability.sensitivity_data,
    },
    checklist,
    citations: i.include_citations !== false ? candidate.citations : [],
  };
}

function buildChecklist(c: any, p: any, suppliers: any[], r: any) {
  const mk = (label: string, state: "pass" | "fail" | "pending") => ({ label, state });
  return [
    mk("Restricted category passed", "pass"),
    mk("Seller Central check", c.gating_status === "likely ungated" ? "pass" : "pending"),
    mk("Supplier found", suppliers.length ? "pass" : "fail"),
    mk("Profit positive", p.net_profit > 0 ? "pass" : "fail"),
    mk("ROI above 30%", p.roi_percent >= 30 ? "pass" : "fail"),
    mk("Margin above 20%", p.net_margin_percent >= 20 ? "pass" : "fail"),
    mk("PPC viable", (p.net_profit + p.ad_cost_estimate) / Math.max(0.01, p.sale_price) * 100 >= 15 ? "pass" : "pending"),
    mk("Image available", c.image ? "pass" : "fail"),
    mk("Citations attached", (c.citations || []).length ? "pass" : "fail"),
    mk("Risk acceptable", r.overall_risk === "low" ? "pass" : r.overall_risk === "medium" ? "pending" : "fail"),
  ];
}
