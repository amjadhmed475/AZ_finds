export interface SensitivityCell {
  label: string;
  sale_price: number;
  landed_cost: number;
  ad_cost_percent: number;
  return_rate_percent: number;
  net_profit: number;
  net_margin_percent: number;
  roi_percent: number;
}

export interface ProfitabilityAnalysis {
  product_candidate_id: string;
  sale_price: number;
  unit_cost: number;
  landed_cost: number;
  amazon_referral_fee: number;
  fba_fee: number;
  storage_fee_estimate: number;
  prep_packaging_cost: number;
  ad_cost_estimate: number;
  return_cost_estimate: number;
  total_cost: number;
  net_profit: number;
  net_margin_percent: number;
  roi_percent: number;
  break_even_price: number;
  max_buy_cost: number;
  sensitivity_data: SensitivityCell[];
}
