/**
 * Look up the LIVE Amazon price + fees + sellers for an ASIN via retailerapi.
 *   npm run price:asin -- B0XXXXXXXX
 * Requires RETAILERAPI_KEY in the environment (free tier: 1,000 lookups/mo).
 */
import { lookupByCode, hasRealData } from "../services/realDataService.js";

async function main() {
  const code = process.argv[2];
  if (!code) { console.error("Usage: npm run price:asin -- <ASIN|UPC>"); process.exitCode = 1; return; }
  if (!hasRealData()) { console.error("RETAILERAPI_KEY not set. Get a free key at retailerapi.com and add it to .env."); process.exitCode = 1; return; }

  const r = await lookupByCode(code);
  if (!r) { console.error(`No live data for ${code} (bad code, no match, rate-limited, or not in index). Falling back to estimates.`); process.exitCode = 2; return; }

  console.error(`\n  LIVE Amazon data for ${code} (retailerapi)`);
  console.error(`  ${r.title ?? ""}`);
  console.error(`  Price:        $${r.price}`);
  if (r.referral_fee != null) console.error(`  Referral fee: $${r.referral_fee}`);
  if (r.wfs_fee != null) console.error(`  WFS/FBA fee:  $${r.wfs_fee}`);
  if (r.sellers != null) console.error(`  Sellers:      ${r.sellers}`);
  if (r.estimated_sales != null) console.error(`  Est. sales:   ${r.estimated_sales}/mo${r.is_best_seller ? " (best seller)" : ""}`);
  if (r.rating != null) console.error(`  Rating:       ${r.rating}★ (${r.review_count ?? "?"} reviews)`);
  if (r.tokens_remaining != null) console.error(`  Free lookups left this month: ${r.tokens_remaining}`);
  console.error("");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
