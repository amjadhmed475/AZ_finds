import type { DashProduct } from "./types";

export interface Decision { label: string; tone: "good" | "warn" | "bad" | "neutral"; reason: string; }

/** Translate a product's data into a clear next action. */
export function decisionFor(p: DashProduct): Decision {
  const f = p.profitability;
  const best = p.suppliers?.[0];
  const supMatch = best?.match_quality_score ?? 0;
  const ungated = p.gating_status === "likely ungated";

  if (p.risk_level === "high") return { label: "Avoid", tone: "bad", reason: "High overall risk — not worth pursuing right now." };
  if (f.netProfit <= 0) return { label: "Avoid", tone: "bad", reason: "Estimated net profit per unit is not positive after fees." };
  if (!best) return { label: "Watch only", tone: "neutral", reason: "No supplier match yet — find a source before committing." };
  if (!ungated) return { label: "Check Seller Central first", tone: "warn", reason: "Good economics, but confirm listing eligibility before ordering." };
  if (supMatch < 60) return { label: "Contact supplier first", tone: "warn", reason: "Strong product, but supplier match confidence is low — get a quote and sample." };
  if (f.roi >= 50 && f.margin >= 25 && p.risk_level === "low") return { label: "Buy sample now", tone: "good", reason: "Low risk, strong ROI and margin, supplier found — order a sample." };
  if (f.margin < 20) return { label: "Watch only", tone: "neutral", reason: "Margin is thin — PPC could erase profit. Validate demand first." };
  return { label: "Watch only", tone: "neutral", reason: "Decent opportunity — verify in Seller Central and check a sample." };
}
