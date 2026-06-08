import { gradeProduct, type GradeInput } from "../services/gradingService.js";
import type { ProductGrade, DataConfidence } from "../types/grade.js";

export interface GradeToolInput {
  product_candidate: any;
  profitability: any;
  risk: any;
  supplier_options?: any[];
  ppc_strategy?: any;
  capital_plan?: any;
  data_confidence?: DataConfidence;
}

/** Map rich objects into a GradeInput and apply the A5–D1 grading + caps. */
export function gradeProductOpportunity(i: GradeToolInput): ProductGrade {
  const c = i.product_candidate || {};
  const p = i.profitability || {};
  const r = i.risk || {};
  const best = (i.supplier_options || [])[0];
  const input: GradeInput = {
    product_candidate_id: c.id || c.product_candidate_id || "ad-hoc",
    estimated_monthly_sales: c.estimated_monthly_sales ?? 0,
    demand_consistency: c.demand_consistency ?? "unknown",
    trend_status: c.trend_status ?? "unknown",
    demand_confidence: (c.gated_confidence as any) ?? "low",
    seller_count: c.seller_count ?? 0,
    net_profit: p.net_profit ?? 0,
    ad_cost_estimate: p.ad_cost_estimate ?? 0,
    roi: p.roi_percent ?? 0,
    margin: p.net_margin_percent ?? 0,
    break_even_price: p.break_even_price ?? 0,
    sale_price: p.sale_price ?? c.estimated_sale_price ?? 0,
    landed_cost: p.landed_cost ?? 0,
    landed_known: Boolean(best),
    best_supplier: best ? { match_quality_score: best.match_quality_score, moq: best.moq, supplier_rating: best.supplier_rating } : null,
    supplier_count: (i.supplier_options || []).length,
    gating_status: c.gating_status ?? r.gating_status ?? "manual check required",
    category_risk: r.category_risk ?? "medium",
    generic_confidence: c.generic_confidence ?? "high",
    overall_risk: r.overall_risk ?? c.risk_level ?? "medium",
    hazmat_risk: r.hazmat_risk ?? "low",
    ip_risk: r.IP_risk ?? "low",
    trademark_risk: r.trademark_risk ?? "low",
    fragile_risk: r.fragile_risk ?? "low",
    weight_oz: c.weight_oz ?? 8,
    restricted: false,
    assumed_capital: i.capital_plan?.total_available_capital,
    data_confidence: i.data_confidence ?? "estimate-level",
  };
  return gradeProduct(input);
}
