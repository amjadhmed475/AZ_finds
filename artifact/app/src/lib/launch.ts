import type { DashProduct } from "./types";
import { verifyAndRank, type SupplierVerdict } from "./supplierCheck";
import { ppcDecisionFor } from "./ppcDecision";
import { GRADE_LADDER } from "./grade";

export type LaunchDecision =
  | "Launch now" | "Check Seller Central first" | "Contact supplier first"
  | "Order sample first" | "Watchlist" | "Reject";

export interface Readiness {
  score: number;
  decision: LaunchDecision;
  tone: "good" | "warn" | "bad" | "neutral";
  blocking: string[];
  nextSteps: string[];
  summary: string;
  parts: { product: number; supplier: number; shipping: number; ppc: number; capital: number; gating: string };
  bestSupplier?: SupplierVerdict;
}

const gi = (g?: string) => { const idx = GRADE_LADDER.indexOf((g ?? "D1") as any); return idx < 0 ? GRADE_LADDER.length - 1 : idx; };

export function launchReadiness(p: DashProduct): Readiness {
  const ranked = verifyAndRank(p);
  const best = ranked[0]?.v;
  const ppc = ppcDecisionFor(p);
  const f = p.profitability;
  const restricted = p.grade?.grade === "D1" && p.risk_level === "high";
  const ungated = p.gating_status === "likely ungated";
  const capitalFit = p.capitalFit ?? 0;

  // sub-scores (0..1)
  const productPart = 1 - gi(p.grade?.grade) / Math.max(1, GRADE_LADDER.length - 1); // A5 -> ~1, D1 -> 0
  const supplierPart = best ? best.score / 100 : 0;
  const shippingPart = best ? (best.shipping.status === "pass" ? 1 : best.shipping.status === "borderline" ? 0.6 : best.shipping.status === "fail" ? 0 : 0.3) : 0;
  const ppcPart = ppc.score / 100;
  const capitalPart = capitalFit / 5;
  const profitPart = Math.max(0, Math.min(1, f.roi / 150));

  let score = Math.round(
    productPart * 25 + supplierPart * 22 + shippingPart * 15 + ppcPart * 13 + capitalPart * 10 + profitPart * 10 + (ungated ? 5 : 0)
  );
  if (restricted) score = Math.min(score, 15);
  score = Math.max(0, Math.min(100, score));

  // blocking issues
  const blocking: string[] = [];
  if (restricted) blocking.push("Fails restricted-category rules — must stay rejected.");
  if (!best) blocking.push("No supplier match yet.");
  if (best && best.shipping.status === "fail") blocking.push("Best supplier shipping exceeds 28 days.");
  if (best && best.shipping.status === "unknown") blocking.push("Supplier shipping time unknown — confirm before ordering.");
  if (best && !best.canBeBest) blocking.push("No supplier passes minimum checks (direct link + match ≥75 + grade ≥B).");
  if (!ungated) blocking.push("Seller Central eligibility not confirmed.");
  if (f.netProfit <= 0) blocking.push("Net profit per unit not positive.");
  if (ppc.grade === "D") blocking.push("Weak PPC tolerance.");

  // decision
  let decision: LaunchDecision, tone: Readiness["tone"];
  if (restricted) { decision = "Reject"; tone = "bad"; }
  else if (f.netProfit <= 0 || f.roi < 25 || (best && best.grade === "D")) { decision = "Reject"; tone = "bad"; }
  else if (!best || best.shipping.status === "fail" || best.grade === "C") { decision = "Contact supplier first"; tone = "warn"; }
  else if (!ungated) { decision = "Check Seller Central first"; tone = "warn"; }
  // "Launch now" only with a verified supplier (direct link + passes checks) — never on pure estimates.
  else if (best.canBeBest && best.quality === "likely" && best.shipping.status === "pass" && score >= 78) { decision = "Launch now"; tone = "good"; }
  else if (score >= 60) { decision = "Order sample first"; tone = "warn"; }
  else if (score >= 45) { decision = "Watchlist"; tone = "neutral"; }
  else { decision = "Reject"; tone = "bad"; }

  // next steps
  const nextSteps: string[] = [];
  if (!ungated) nextSteps.push("Run a Seller Central eligibility check (Add a Product → restrictions).");
  if (best && best.shipping.status !== "pass") nextSteps.push("Message the supplier to confirm shipping fits 2–3 weeks.");
  if (best && best.action.includes("quote")) nextSteps.push("Request a landed-cost quote + MOQ from the supplier.");
  if (best && best.quality !== "likely") nextSteps.push("Order a sample to confirm quality before bulk.");
  nextSteps.push("Verify fees in Amazon's Revenue Calculator with the real price.");
  if (ppc.grade !== "A" && ppc.grade !== "B") nextSteps.push("Reassess PPC — margin may not support paid ads.");

  const summary =
    decision === "Reject" ? (restricted ? "Rejected — fails restricted-category rules." : "Rejected — economics or supplier grade too weak.") :
    decision === "Launch now" ? `Strong across the board (supplier ${best?.grade}, shipping ${best?.shipping.max}d, ${Math.round(f.roi)}% ROI) — order a sample then launch.` :
    decision === "Order sample first" ? "Good opportunity, but confirm quality/shipping with a sample before committing." :
    decision === "Check Seller Central first" ? "Good economics, but confirm listing eligibility before ordering." :
    decision === "Contact supplier first" ? "Needs a confirmed, fast-enough supplier before this is orderable." :
    "Keep on the watchlist and re-check as data improves.";

  return {
    score, decision, tone, blocking, nextSteps, summary,
    parts: {
      product: Math.round(productPart * 100), supplier: best?.score ?? 0,
      shipping: Math.round(shippingPart * 100), ppc: ppc.score,
      capital: Math.round(capitalPart * 100), gating: p.gating_status,
    },
    bestSupplier: best,
  };
}
