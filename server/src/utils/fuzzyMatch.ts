import { keywordTokens } from "./normalize.js";

/** Sørensen–Dice coefficient over token sets (0..1). */
export function diceCoefficient(a: string, b: string): number {
  const sa = new Set(keywordTokens(a));
  const sb = new Set(keywordTokens(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return (2 * inter) / (sa.size + sb.size);
}

/**
 * Supplier match quality 0..100 combining title similarity with optional
 * keyword overlap. Returns an integer score and a bucketed label.
 */
export function matchQuality(
  productName: string,
  productKeywords: string[],
  supplierTitle: string
): { score: number; label: string } {
  const titleSim = diceCoefficient(productName, supplierTitle);
  const kw = productKeywords.join(" ");
  const kwSim = kw ? diceCoefficient(kw, supplierTitle) : titleSim;
  const blended = 0.65 * titleSim + 0.35 * kwSim;
  const score = Math.round(Math.max(0, Math.min(1, blended)) * 100);
  let label = "Weak match";
  if (score >= 90) label = "Very close match";
  else if (score >= 75) label = "Close match";
  else if (score >= 60) label = "Similar, verify";
  return { score, label };
}
