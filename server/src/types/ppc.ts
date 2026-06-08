import type { Citation } from "./citations.js";

export type RiskTolerance = "low" | "medium" | "high";
export type LaunchPhase = "test" | "launch" | "scale" | "defend";
export type Confidence = "low" | "medium" | "high";

export interface PPCCampaign {
  name: string;
  type: "auto" | "manual-exact" | "manual-phrase" | "manual-broad" | "product-targeting" | "branded-defense";
  goal: string;
  daily_budget: number;
  bid_range: { min: number; max: number };
  match_type?: string;
  notes: string;
}

export interface KeywordGroup {
  group: string;
  match_type: "exact" | "phrase" | "broad";
  keywords: string[];
}

export interface PPCStrategy {
  product_candidate_id: string;
  product_name: string;
  launch_phase: LaunchPhase;
  target_acos_percent: number;
  break_even_acos_percent: number;
  daily_budget: number;
  monthly_budget: number;
  suggested_bid_range: { min: number; max: number };
  campaign_structure: PPCCampaign[];
  keyword_groups: KeywordGroup[];
  negative_keywords: string[];
  bid_strategy: string;
  optimization_rules: string[];
  weekly_action_plan: Array<{ week: string; actions: string[] }>;
  warnings: string[];
  confidence: Confidence;
  citations: Citation[];
}

export interface KeywordPlan {
  product_candidate_id: string;
  primary_keywords: string[];
  secondary_keywords: string[];
  long_tail_keywords: string[];
  competitor_keywords: string[];
  exact_match_keywords: string[];
  phrase_match_keywords: string[];
  broad_match_keywords: string[];
  negative_keywords: string[];
  backend_search_terms: string[];
  title_keywords: string[];
  bullet_keywords: string[];
  confidence_score: number;
  confidence: Confidence;
  citations: Citation[];
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

export interface PPCOptimization {
  keywords_to_increase_bid: Array<{ term: string; reason: string }>;
  keywords_to_decrease_bid: Array<{ term: string; reason: string }>;
  keywords_to_pause: Array<{ term: string; reason: string }>;
  search_terms_to_add_exact: string[];
  search_terms_to_add_phrase: string[];
  search_terms_to_add_negative: Array<{ term: string; reason: string }>;
  campaigns_to_adjust: Array<{ campaign: string; action: string }>;
  budget_reallocation: string[];
  wasted_spend_analysis: { total_wasted_spend: number; rows: Array<{ term: string; spend: number; clicks: number; sales: number }> };
  profitable_keyword_analysis: Array<{ term: string; acos: number; sales: number }>;
  next_week_plan: string[];
  warnings: string[];
}
