export interface Supplier {
  id: string;
  supplier_name: string;
  supplier_site: string;
  direct_product_url: string;
  region: string;
  unit_cost_min: number;
  unit_cost_max: number;
  moq: number;
  estimated_shipping: number;
  estimated_landed_cost: number;
  supplier_rating: number;
  years_active: number | null;
  lead_time: string;
  customization_available: boolean;
  match_quality_score: number;
  supplier_risk: "low" | "medium" | "high";
  notes: string;
}

export interface Risk {
  category_risk: string;
  IP_risk: string;
  trademark_risk: string;
  patent_risk: string;
  hazmat_risk: string;
  regulatory_risk: string;
  fragile_risk: string;
  return_risk: string;
  saturation_risk: string;
  price_war_risk: string;
  overall_risk: string;
  manual_verification_steps: string[];
}

export interface Citation {
  source_name: string;
  source_url: string;
  accessed_date: string;
  claim_supported: string;
  reliability_score: number;
}

export type Grade =
  | "A5" | "A4" | "A3" | "A2" | "A1" | "B5" | "B4" | "B3" | "B2" | "B1"
  | "C5" | "C4" | "C3" | "C2" | "C1" | "D5" | "D4" | "D3" | "D2" | "D1";

export interface GradeCriteriaScores {
  demand_strength: number; profit_strength: number; competition_quality: number;
  supplier_strength: number; seller_central_category_risk: number; product_risk: number;
  trend_strength: number; ppc_marketing_viability: number; capital_fit: number;
}
export interface GradeCap {
  cap_reason: string; original_grade: Grade; capped_grade: Grade; severity: string; explanation: string;
}
export interface ProductGrade {
  product_candidate_id: string; grade: Grade; grade_label: string; score_out_of_100: number;
  confidence_label: string; criteria_scores: GradeCriteriaScores; grade_caps_applied: GradeCap[];
  reason_summary: string; weakness_summary: string; created_at: string;
}
export interface ProductImage {
  product_candidate_id: string; image_url: string; image_source_url: string; image_source_name: string;
  image_type: string; image_confidence: string; image_alt_text: string; image_last_checked: string;
  attribution: string; fallback_used: boolean;
}
export interface ProductCheck { label: string; state: "pass" | "fail" | "pending"; }

export interface SourceStatus { name: string; connected: boolean; status: "live" | "locked"; }
export interface ApiUsageStatus {
  data_mode: string; sources: SourceStatus[]; api_calls_used_today: number; cache_hits: number;
  cache_misses: number; estimated_calls_saved: number; last_refresh: string; next_refresh: string;
  max_api_calls: number; warnings: string[];
}
export interface RichRejected {
  id: string; name: string; category: string; rejection_reason: string; rejected_by_rule: string;
  risk_level: string; would_have_grade: Grade | null; citations: Citation[];
}

export interface DashProduct {
  id: string;
  name: string;
  category: string;
  grade?: ProductGrade;
  image?: ProductImage;
  checks?: ProductCheck[];
  capitalFit?: number;
  bucket?: "top" | "needs_check";
  seller_count: number;
  trend_status: string;
  gating_status: string;
  risk_level: "low" | "medium" | "high";
  opportunity_score: number;
  recommended_action: string;
  estimatedSalePrice: number;
  estimatedMonthlySales: number;
  estimatedRevenue: number;
  bsr?: number | null;
  weight_oz?: number | null;
  dimensions?: { length: number; width: number; height: number } | null;
  reviewRating: number;
  reviewCount: number;
  profitability: {
    unitCost: number;
    landedCost: number;
    fbaFee: number;
    referralFee: number;
    netProfit: number;
    roi: number;
    margin: number;
    breakEvenPrice: number;
  };
  suppliers: Supplier[];
  risks: Risk[];
  citations: Citation[];
}

export interface RejectedProduct {
  name: string;
  category: string;
  reasons: string[];
}

export interface PPCCampaign {
  name: string;
  type: string;
  goal: string;
  daily_budget: number;
  bid_range: { min: number; max: number };
  match_type?: string;
  notes: string;
}

export interface PPCStrategy {
  product_candidate_id: string;
  product_name: string;
  launch_phase: string;
  target_acos_percent: number;
  break_even_acos_percent: number;
  daily_budget: number;
  monthly_budget: number;
  suggested_bid_range: { min: number; max: number };
  campaign_structure: PPCCampaign[];
  keyword_groups: Array<{ group: string; match_type: string; keywords: string[] }>;
  negative_keywords: string[];
  bid_strategy: string;
  optimization_rules: string[];
  weekly_action_plan: Array<{ week: string; actions: string[] }>;
  warnings: string[];
  confidence: string;
}

export interface ProfitScenario {
  sell_through_percent: number;
  units_sold: number;
  gross_profit: number;
  ad_spend: number;
  net_profit: number;
}

export interface CapitalPlan {
  total_available_capital: number;
  inventory_budget: number;
  ppc_budget: number;
  emergency_reserve: number;
  sample_budget: number;
  shipping_budget: number;
  estimated_units_to_order: number;
  safe_test_order_quantity: number;
  max_safe_daily_ad_spend: number;
  launch_testing_budget: number;
  scaling_budget: number;
  break_even_units: number;
  break_even_acos_percent: number;
  target_acos_percent: number;
  expected_cash_conversion_cycle: string;
  profit_scenarios: ProfitScenario[];
  warnings: string[];
}

export interface MarketingStrategy {
  product_candidate_id: string;
  product_name: string;
  positioning: string;
  target_customer: string;
  main_pain_point: string;
  title_strategy: string;
  bullet_strategy: string;
  image_strategy: string;
  infographic_strategy: string;
  a_plus_content_strategy: string;
  pricing_strategy: string;
  coupon_strategy: string;
  ppc_strategy: string;
  organic_ranking_strategy: string;
  competitor_differentiation: string;
  review_strategy: string[];
  launch_plan_30_days: string[];
  launch_plan_60_days: string[];
  launch_plan_90_days: string[];
  capital_allocation: string;
  warnings: string[];
}

export interface Dashboard {
  summary: {
    productsScanned: number;
    productsPassed: number;
    bestScore: number;
    highestRoi: number;
    averageMargin: number;
    likelyUngatedCount: number;
    manualCheckRequiredCount: number;
  };
  mode?: "mock" | "real";
  dataSources?: Array<{ name: string; connected: boolean; status: "live" | "locked" }>;
  unlockTarget?: number;
  rejectedProducts?: RejectedProduct[];
  capitalPlanner?: CapitalPlan;
  ppcManager?: { selectedProductId: string; strategy: PPCStrategy };
  marketingStrategies?: MarketingStrategy[];
  batch?: {
    batch_id: string; batch_date: string; batch_source: string; products_generated: number;
    products_passed: number; products_rejected: number; top_grade_count: number; data_source_status: string;
  };
  apiUsage?: ApiUsageStatus;
  gradeDistribution?: Array<{ grade: Grade; count: number }>;
  richRejected?: RichRejected[];
  products: DashProduct[];
  charts: {
    scoreChart: Array<{ name: string; value: number }>;
    roiChart: Array<{ name: string; value: number }>;
    marginChart: Array<{ name: string; value: number }>;
    salesChart: Array<{ name: string; value: number }>;
    riskChart: Array<{ name: string; value: number }>;
    supplierCostChart: Array<{ name: string; value: number }>;
    demandCompetitionScatter: Array<{ name: string; demand: number; competition: number; score: number }>;
    trendTimeline: Array<{ name: string; series: Array<{ t: string; v: number }> }>;
    categoryDistribution: Array<{ name: string; value: number }>;
  };
  citations: Citation[];
}
