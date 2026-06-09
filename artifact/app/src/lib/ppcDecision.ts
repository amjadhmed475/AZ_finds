import type { DashProduct } from "./types";

export type PpcGrade = "A" | "B" | "C" | "D";
const r2 = (n: number) => Math.round(n * 100) / 100;
const r0 = (n: number) => Math.round(n);

export interface PpcDecision {
  score: number;
  grade: PpcGrade;
  decision: string;              // PPC friendly / workable / risky / not recommended
  breakEvenAcos: number;
  targetAcos: { conservative: number; moderate: number; aggressive: number };
  maxCpc: number;
  requiredCvr: number;           // % needed at assumed CPC
  adProfitPerUnit: number;
  dailyBudget: number;
  monthlyBudget: number;
  minTestBudget: number;
  thresholds: { minClicks: number; reviewClicks: number; pauseSpend: number; minOrdersToScale: number; maxAcos: number };
  phases: Array<{ k: string; t: string }>;
  notes: string[];
}

const ASSUMED_CVR = 0.10;   // 10% — placeholder until real data
const ASSUMED_CPC = 0.9;    // $0.90 — placeholder

export function ppcDecisionFor(p: DashProduct, riskTolerance: "low" | "moderate" | "aggressive" = "moderate"): PpcDecision {
  const price = p.estimatedSalePrice || 0;
  const f = p.profitability;
  const netBeforeAds = f.netProfit + price * 0.1;            // add back the ~10% ad estimate
  const breakEvenAcos = price > 0 ? r2((netBeforeAds / price) * 100) : 0;
  const targetAcos = {
    conservative: r2(breakEvenAcos * 0.5),
    moderate: r2(breakEvenAcos * 0.65),
    aggressive: r2(breakEvenAcos * 0.8),
  };
  const tA = riskTolerance === "low" ? targetAcos.conservative : riskTolerance === "aggressive" ? targetAcos.aggressive : targetAcos.moderate;
  const maxCpc = r2(price * ASSUMED_CVR * (tA / 100));
  const requiredCvr = price > 0 && tA > 0 ? r2((ASSUMED_CPC / (price * (tA / 100))) * 100) : 0;
  const adProfitPerUnit = r2(netBeforeAds - price * (tA / 100));

  // viability score (out of 100)
  let s = 0;
  s += Math.min(35, (breakEvenAcos / 40) * 35);                 // ACOS headroom
  s += Math.min(20, (f.margin / 35) * 20);                       // margin
  s += Math.min(15, (netBeforeAds / 8) * 15);                   // absolute profit cushion
  s += price >= 15 ? 10 : price >= 12 ? 6 : 0;                  // not too cheap for PPC
  s += p.seller_count <= 10 ? 10 : p.seller_count <= 20 ? 6 : 2; // competition
  s += 7;                                                        // keyword clarity (unknown — neutral)
  s = Math.max(0, Math.min(100, r0(s)));

  const grade: PpcGrade = s >= 78 ? "A" : s >= 62 ? "B" : s >= 45 ? "C" : "D";
  let decision =
    price < 12 ? "PPC risky — product may be too cheap for paid ads" :
    grade === "A" ? "PPC friendly" : grade === "B" ? "PPC workable" : grade === "C" ? "PPC risky" : "PPC not recommended";

  const dailyBudget = r0(Math.max(8, maxCpc * 12));
  const monthlyBudget = dailyBudget * 30;
  const minTestBudget = r0(Math.max(40, netBeforeAds * 12));

  const thresholds = {
    minClicks: 10, reviewClicks: 25, pauseSpend: r2(netBeforeAds),
    minOrdersToScale: 5, maxAcos: r0(breakEvenAcos),
  };

  const phases = [
    { k: "Days 1–7 — Launch", t: `Auto discovery + manual exact on obvious terms. Daily ~$${dailyBudget}. Bid ≤ $${maxCpc} max CPC. Collect data; don't judge keywords under ${thresholds.minClicks} clicks.` },
    { k: "Days 8–14 — Optimize", t: `Move converting search terms to exact. Add zero-order, high-spend terms as negatives. Lower bids on ACOS > ${thresholds.maxAcos}%.` },
    { k: "Days 15–30 — Decide", t: `Keep terms converting under ${tA}% target ACOS. Pause terms past $${thresholds.pauseSpend} spend with no order. Decide: scale, hold, or drop.` },
    { k: "Days 31–60 — Scale", t: `Raise bids on profitable low-impression-share keywords. Add phrase/broad discovery. Only scale after ≥ ${thresholds.minOrdersToScale} profitable orders.` },
    { k: "Days 61–90 — Grow", t: `Add product-targeting on weaker competitor ASINs. Defensive brand campaign only if you own a real brand. Reinvest profit into winners.` },
  ];

  const notes: string[] = [];
  if (breakEvenAcos < 20) notes.push("Thin break-even ACOS — little room for ads; protect margin.");
  if (price < 15) notes.push("Low price point — CPC eats margin fast; lean on exact match.");
  if (p.seller_count > 20) notes.push("Crowded niche — expect higher CPCs and slower ranking.");
  if (requiredCvr > 15) notes.push(`Needs ~${requiredCvr}% conversion at $${ASSUMED_CPC} CPC — strong images/reviews required.`);

  return { score: s, grade, decision, breakEvenAcos, targetAcos, maxCpc, requiredCvr, adProfitPerUnit, dailyBudget, monthlyBudget, minTestBudget, thresholds, phases, notes };
}
