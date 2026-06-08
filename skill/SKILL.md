---
name: amazon-seller-research
description: Research generic, likely-ungated Amazon FBA/FBM product opportunities with demand validation, supplier matching (Alibaba/AliExpress/wholesale), profitability math, risk + gating estimates, citations, and an interactive dashboard. Use when the user wants to find Amazon products to sell, source suppliers, calculate FBA profit, or build a product-research dashboard.
---

# Amazon Seller Product Research

Find generic, low-cost, high-yield Amazon products to sell — with honest, cited,
verification-first analysis. This Skill is backed by the `amazon-seller-mcp`
server (eight tools) and renders results into an interactive React dashboard
artifact.

## What it does

1. Searches the web + a curated catalog for generic product opportunities.
2. Validates demand (Keepa if a key is set, otherwise conservative heuristics).
3. Confirms the product can sell as **generic** (no obvious brand/IP dependency).
4. Estimates **gating** (likely ungated / possibly gated / likely gated / manual
   check required) and category/IP/hazmat/regulatory/safety **risk**.
5. Finds **suppliers** (Alibaba, AliExpress, Global Sources, Made-in-China,
   DHgate, Faire, Tundra, CJdropshipping) with cost, MOQ, lead time, and a
   match-quality score; links go to the closest product page found.
6. Calculates **profit, ROI, margin, break-even, max buy cost** and a price/cost
   **sensitivity grid** using an approximate US FBA fee model.
7. **Scores** each product 0–100 and ranks them with reasons.
8. Builds a **dashboard** and exports **markdown / CSV / XLSX / PDF**.

## Honesty rules (always)

- Treat every product as **"manual verification required"** until confirmed in
  Amazon Seller Central. Gating is an estimate, never a guarantee.
- In **mock mode** (no API keys) all demand/price/supplier numbers are
  conservative estimates labeled **low confidence**.
- Never fabricate exact figures. Use "Unknown", "Manual verification required",
  or "Low confidence estimate" when data is missing.
- Every important claim carries a citation with a reliability score.

## How to run product research

Call the MCP tool `search_product_opportunities`, then
`generate_research_dashboard`, then optionally `export_product_report`.

### Example 1 — generic home organization, under $5 landed, 50%+ ROI
```
search_product_opportunities {
  "query": "generic home organization items",
  "category_preferences": ["home organization", "kitchen accessories"],
  "max_landed_cost": 5,
  "min_roi_percent": 50,
  "min_margin_percent": 25,
  "include_alibaba": true,
  "include_aliexpress": true,
  "max_results": 20
}
```

### Example 2 — suppliers + FBA profit for collapsible storage bins
```
search_supplier_matches {
  "product_name": "Collapsible Storage Bins",
  "product_keywords": ["collapsible storage bin", "foldable closet bin"],
  "target_unit_cost": 3.2,
  "include_alibaba": true, "include_aliexpress": true, "max_moq": 200
}
calculate_profitability {
  "sale_price": 18.99, "unit_cost": 3.2, "category": "Home & Kitchen",
  "inbound_shipping_per_unit": 0.6, "ad_cost_percent": 10, "return_rate_percent": 3
}
```

### Example 3 — dashboard for the top 20 likely-ungated products
Run `search_product_opportunities`, pass its `products/suppliers/profitability/
risks/citations` straight into `generate_research_dashboard`, then load the
JSON into the React artifact (`artifact/app`).

### Example 4 — export XLSX and PDF
```
export_product_report { "format": "xlsx", "products": [...], "profitability": [...] }
export_product_report { "format": "pdf",  "products": [...], "profitability": [...] }
```
Then render with the bundled scripts:
```
python skill/scripts/export_xlsx.py reports/amazon-research-<date>.json
python skill/scripts/export_pdf.py  reports/amazon-research-<date>.json
```

## PPC Manager, Capital Planner & Marketing

The MCP now includes ad-planning tools (all estimates — they only become reliable
once you run ads and upload real Amazon Ads reports):

- `generate_ppc_strategy` — campaign structure (auto / manual exact / phrase /
  broad / product-targeting; branded-defense only if you have a brand), keyword
  groups, negatives, daily budget, bid range, target + break-even ACOS,
  optimization rules, weekly action plan.
- `generate_keyword_plan` — primary / secondary / long-tail / exact / phrase /
  broad / negatives / backend terms. Volumes are "unknown" unless API data exists.
- `calculate_ppc_budget` — splits capital into inventory / PPC / reserve / sample /
  shipping, estimates units to order, max safe daily ad spend, break-even units,
  and 25/50/75/100% sell-through profit scenarios.
- `optimize_ppc_from_report` — paste Amazon Ads report rows → bid up/down, pause,
  add exact/phrase/negative, budget reallocation, wasted-spend total.
- `generate_listing_marketing_strategy` — positioning, title/bullet/image/A+,
  pricing, coupons, PPC, **policy-compliant** review strategy (Request-a-Review
  only; never incentivized or positive-only), and 30/60/90-day launch plans.

Key formulas: `break_even_acos = net_profit_before_ads / sale_price * 100`;
target ACOS = 55% (low) / 68% (medium) / 85% (high) of break-even.

Dashboard tabs: **PPC Manager**, **Capital Planner** (interactive + charts),
**Marketing**, and **Why Rejected** (restricted-category engine output).

### PPC / capital examples

Example 1: Research 20 generic Amazon FBA products under $5 landed cost and generate a dashboard.
Example 2: For the top 5 products, create PPC launch strategies using a $3,000 total capital budget.
Example 3: Create a capital plan if I have $10,000 available and want to keep 25% as reserve.
Example 4: Generate keyword plans for collapsible storage bins, under-sink organizers, and car seat gap fillers.
Example 5: Analyze my Amazon Ads search term report and tell me what to pause, what to scale, and what to add as negative keywords.
Example 6: Create a 30/60/90 day launch and marketing strategy for the best product.

## A5–D1 grading, daily batches & data modes

Every product gets a **grade from A5 (best) to D1 (worst)**, built from the 100-point
score across 9 weighted criteria: demand 20, profit 20, competition 10, supplier 10,
Seller Central/category 10, product risk 10, trend 5, PPC viability 10, capital fit 5.

Score → grade: 95–100 A5 · 90–94 A4 · … · 50–54 B1 · 45–49 C5 · … · 0–4 D1.

**Grade caps** force a ceiling regardless of score: restricted category → D1;
likely hazmat → ≤D5; strong IP/trademark → ≤D4; SC-check + high category risk → ≤C5;
ROI <30% → ≤C5; margin <20% → ≤C4; no supplier → ≤C4; Amazon/dominant brand → ≤C3;
oversize erodes margin → ≤C2; landed cost unknown → ≤B2; **low demand confidence → ≤B3**.
In estimate mode demand confidence is low, so grades cap at **B3** — connect a live
source to let products earn higher grades. The detail modal shows the full
"Why this grade?" breakdown and every cap applied.

**Daily batches.** `generate_daily_product_batch` builds (or loads) ≥50 graded
products for a date, caches to `/server/data/batches/<date>.json`, and reuses it
unless `force_refresh`. Run from `/server`:
- `npm run research:daily` — today's batch (cached if present; `-- --force` to refresh)
- `npm run research:top50` — force a fresh top-50 batch
- `npm run research:sample` — offline demo batch + sample Ads CSV + optimization

**Data modes** (default `hybrid_low_cost`): `estimate_engine_only` (0 paid calls),
`hybrid_low_cost` (seed first, paid calls reserved for A/high-B candidates, cached),
`live_selected_only`, `full_live_scan`. `get_api_usage_status` shows calls used,
cache hits, and estimated calls saved. The estimate engine uses **0 paid API calls**.

**Product detail modal** (tool `get_product_detail_dashboard`): tabs Overview /
Profit / Suppliers / PPC / Keywords / Risk / Checks / Citations, with grade
breakdown, supplier table, profit math, risk + pre-order checklists, and citations.

### Grading / batch examples
- Example 1: Generate today's top 50 Amazon product opportunities with A5–D1 grades.
- Example 2: Show only A-grade and B-grade products with 50%+ ROI and supplier matches.
- Example 3: Open the detail view for the highest-graded product (profit, PPC, suppliers, risk, citations).
- Example 4: Run the daily product cycle in hybrid low-cost mode with a maximum of 20 API calls.
- Example 5: Show rejected products and explain why each one failed.
- Example 6: Export today's graded product batch to XLSX.

## Using the premium dashboard & images

- **Click any product card or table row** to open the right-side detail drawer
  (tabs: Overview, Profit, Suppliers, PPC, Keywords, Risk, Checks, Citations) with the
  grade breakdown and "Why this grade?" criteria bars.
- **Grades** read A5 (elite) → D1 (avoid); A = emerald, B = indigo, C = amber, D = rose.
  In estimate mode grades cap at B3 (low demand confidence) — connect a live source for higher.
- **Saved views** (A & B grade, 50%+ ROI, low risk, supplier found, top opportunities,
  needs check) and active-filter pills make scanning fast.
- **Product images:** premium category illustrations by default (labelled "Illustration").
  For real photos, set `PEXELS_API_KEY` (representative) or Keepa/PA-API (exact Amazon),
  or provide URLs, then run `npm run images:enrich`. Images show source + confidence.
- **Keep API calls low:** default hybrid low-cost mode, daily batch cache, image cache,
  top-50-only enrichment, selected-product live refresh only. `npm run sources:status`
  shows usage. The estimate engine makes 0 paid calls.
- **Browser/search MCP** (Playwright + Fetch, optional Brave) is for public/legal research
  only — never Seller Central scraping; live results still need citations + confidence labels.

## Interpreting scores

| Score | Meaning |
|------|---------|
| 90–100 | Excellent — verify immediately |
| 80–89 | Strong — deeper validation |
| 70–79 | Possible — manual checks needed |
| 60–69 | Risky/average — only with niche knowledge |
| < 60 | Avoid unless strategic |

Weighting: demand 20, sales consistency 15, profit/ROI 20, competition 10,
supplier 10, gating 10, risk 10, trend 5. The dashboard shows the reason for
each score.

## Manual verification (do this before buying)

1. Search the product in Seller Central → Add a Product.
2. Click "Sell this product" / "Show limitations" — is approval required?
3. Confirm category + sub-category restrictions.
4. Confirm you can list as Generic.
5. Check if invoices / compliance docs are requested.
6. Run the live Amazon Revenue Calculator.
7. Check Keepa price history.
8. Order a supplier sample; inspect quality, packaging, barcode.
9. Confirm no trademark (USPTO TESS) or design-patent conflict.
10. Start with a small test order.

## Adding API keys (enables real mode)

Copy `.env.example` to `.env` in the project root and fill any of:
`KEEPA_API_KEY`, `SERPAPI_KEY`, `BING_SEARCH_API_KEY`, `AMAZON_PA_API_KEY` +
`AMAZON_PA_SECRET` + `AMAZON_ASSOCIATE_TAG`, `GOOGLE_TRENDS_ENABLED=true`.
You can also import SellerAmp / Helium 10 / Jungle Scout / SmartScout CSV
exports — pass their rows as `manual` anchors into `analyze_amazon_market`.

## Scripts in this Skill

- `scripts/run_research.py` — summarize a saved dashboard/research JSON.
- `scripts/generate_dashboard.py` — render a standalone HTML dashboard (Chart.js).
- `scripts/export_xlsx.py` — multi-sheet Excel workbook (openpyxl).
- `scripts/export_pdf.py` — printable PDF report (reportlab, HTML fallback).
