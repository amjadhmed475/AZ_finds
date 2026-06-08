import { round } from "../utils/normalize.js";
import type { ProfitabilityAnalysis, SensitivityCell } from "../types/profitability.js";

export interface ProfitInput {
  product_candidate_id?: string;
  sale_price: number;
  unit_cost: number;
  shipping_per_unit?: number;        // FBM outbound shipping (0 for FBA)
  prep_cost?: number;
  packaging_cost?: number;
  referral_fee_percent: number;      // e.g. 15 means 15%
  fba_fee?: number;
  storage_fee_estimate?: number;
  return_rate_percent?: number;      // e.g. 5
  ad_cost_percent?: number;          // e.g. 10
  inbound_shipping_per_unit?: number;
  desired_profit?: number;           // for max_buy_cost (default 0)
}

function pct(n?: number): number {
  return Math.max(0, (n ?? 0) / 100);
}

export function computeProfitability(i: ProfitInput): ProfitabilityAnalysis {
  const sale = Math.max(0, i.sale_price);
  const refP = pct(i.referral_fee_percent);
  const adP = pct(i.ad_cost_percent);
  const retP = pct(i.return_rate_percent);
  const fba = i.fba_fee ?? 0;
  const storage = i.storage_fee_estimate ?? 0;
  const ship = i.shipping_per_unit ?? 0;
  const prepPack = (i.prep_cost ?? 0) + (i.packaging_cost ?? 0);

  const landed = round(i.unit_cost + (i.inbound_shipping_per_unit ?? 0) + (i.packaging_cost ?? 0) + (i.prep_cost ?? 0));
  const referral = round(Math.max(0.3, sale * refP));
  const ad = round(sale * adP);
  const ret = round(sale * retP);

  const total = round(landed + ship + referral + fba + storage + ad + ret);
  const net = round(sale - total);
  const margin = sale > 0 ? round((net / sale) * 100, 1) : 0;
  const roi = landed > 0 ? round((net / landed) * 100, 1) : 0;

  const fixed = landed + ship + fba + storage; // costs independent of price
  const denom = 1 - (refP + adP + retP);
  const breakEven = denom > 0 ? round(fixed / denom) : 0;

  const otherFees = referral + fba + storage + ad + ret + ship;
  const maxBuy = round(sale - otherFees - (i.desired_profit ?? 0));

  return {
    product_candidate_id: i.product_candidate_id ?? "ad-hoc",
    sale_price: sale,
    unit_cost: round(i.unit_cost),
    landed_cost: landed,
    amazon_referral_fee: referral,
    fba_fee: round(fba),
    storage_fee_estimate: round(storage),
    prep_packaging_cost: round(prepPack),
    ad_cost_estimate: ad,
    return_cost_estimate: ret,
    total_cost: total,
    net_profit: net,
    net_margin_percent: margin,
    roi_percent: roi,
    break_even_price: breakEven,
    max_buy_cost: maxBuy,
    sensitivity_data: buildSensitivity(i),
  };
}

/** 5×5 grid over sale price (±20/±10/0) and landed cost (±20/±10/0). */
function buildSensitivity(i: ProfitInput): SensitivityCell[] {
  const priceSteps = [-0.2, -0.1, 0, 0.1, 0.2];
  const costSteps = [-0.2, -0.1, 0, 0.1, 0.2];
  const cells: SensitivityCell[] = [];
  for (const ps of priceSteps) {
    for (const cs of costSteps) {
      const variant = computeCore({
        ...i,
        sale_price: i.sale_price * (1 + ps),
        unit_cost: i.unit_cost * (1 + cs),
      });
      cells.push({
        label: `price ${ps >= 0 ? "+" : ""}${Math.round(ps * 100)}% / cost ${cs >= 0 ? "+" : ""}${Math.round(cs * 100)}%`,
        sale_price: round(i.sale_price * (1 + ps)),
        landed_cost: variant.landed,
        ad_cost_percent: i.ad_cost_percent ?? 0,
        return_rate_percent: i.return_rate_percent ?? 0,
        net_profit: variant.net,
        net_margin_percent: variant.margin,
        roi_percent: variant.roi,
      });
    }
  }
  return cells;
}

function computeCore(i: ProfitInput) {
  const sale = Math.max(0, i.sale_price);
  const refP = pct(i.referral_fee_percent);
  const adP = pct(i.ad_cost_percent);
  const retP = pct(i.return_rate_percent);
  const landed = i.unit_cost + (i.inbound_shipping_per_unit ?? 0) + (i.packaging_cost ?? 0) + (i.prep_cost ?? 0);
  const total = landed + (i.shipping_per_unit ?? 0) + Math.max(0.3, sale * refP) + (i.fba_fee ?? 0) + (i.storage_fee_estimate ?? 0) + sale * adP + sale * retP;
  const net = sale - total;
  return {
    landed: round(landed),
    net: round(net),
    margin: sale > 0 ? round((net / sale) * 100, 1) : 0,
    roi: landed > 0 ? round((net / landed) * 100, 1) : 0,
  };
}
