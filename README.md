# Amazon Seller Product Research MCP + Dashboard Skill

A production-grade, **ethical** research assistant that helps an Amazon FBA/FBM
seller find **generic, low-cost, high-yield, likely-ungated** products — with
demand validation, supplier matching (Alibaba/AliExpress/wholesale), full
profitability math, risk + gating estimates, citations, and an interactive
React dashboard.

It is honest about uncertainty: with no API keys it runs in **mock mode** and
labels every figure low-confidence, and it treats **every product as “manual
verification required”** until you confirm it in Amazon Seller Central.

```
amazon-seller-mcp/
├── server/      MCP server (TypeScript) — 8 tools + engines
├── skill/       Claude Skill (SKILL.md) + python exporters + templates
├── artifact/    React + Recharts dashboard
├── README.md
└── .env.example
```

## What it does

- `search_product_opportunities` — find + validate + score generic products.
- `search_supplier_matches` — Alibaba, AliExpress, Global Sources, Made-in-China,
  DHgate, Faire, Tundra, CJdropshipping; cost/MOQ/lead-time + match score.
- `analyze_amazon_market` — demand/BSR/price/sellers/reviews (Keepa or heuristics).
- `analyze_gating_and_risk` — gating estimate + IP/hazmat/regulatory/safety risk.
- `calculate_profitability` — net profit, ROI, margin, break-even, max buy cost,
  5×5 price/cost sensitivity grid.
- `score_product_opportunity` — weighted 0–100 score with reasons.
- `generate_research_dashboard` — dashboard-ready JSON for the artifact.
- `export_product_report` — markdown / CSV (built-in) and XLSX / PDF (via Skill).
- `generate_ppc_strategy` — full Amazon PPC launch + optimization plan.
- `generate_keyword_plan` — keyword research/grouping for PPC + listing SEO.
- `calculate_ppc_budget` — capital split, units to order, sell-through scenarios.
- `optimize_ppc_from_report` — analyze an Ads report → pause/raise/lower/negatives.
- `generate_listing_marketing_strategy` — compliant marketing + 30/60/90 plan.

## Install & build the MCP server

```bash
cd server
npm install
npm run build
npm run research:sample   # offline demo batch (50+ graded products), no keys needed
npm run research:top50    # force a fresh top-50 graded batch
npm run research:daily    # today's batch (cached if present; -- --force to refresh)
```
Then the dashboard:
```bash
cd artifact/app && npm install && npm run dev
```

## Premium dashboard UI

The dashboard is a SaaS-style product research command center: navy/slate theme with
indigo + emerald accents, elevated cards with hover lift, glowing A5–D1 grade badges,
a right-side detail **drawer** with tabbed analysis, saved-view chips, active-filter
pills, sticky filters, and a polished executive Overview. Product cards and table rows
are fully clickable. New run commands:

```
cd server && npm run images:enrich    # attach real photos to the top 50 (if a source is set)
cd server && npm run sources:status    # print data mode, source live/locked, cache + savings
```

## Product images (real photos + premium illustrations)

Products never use emoji. Each product carries full image metadata
(`image_url, image_source_url, image_source_name, image_type, image_confidence,
image_alt_text, image_last_checked, attribution`). The enrichment chain (priority):

1. **User-provided image URL** (exact, high confidence)
2. **Supplier / wholesale listing image** (when a live supplier result includes one — displayed by source URL with attribution)
3. **Pexels** representative product photo (`PEXELS_API_KEY`, free — medium confidence, not the exact SKU)
4. **Openverse** commercial-CC fallback (`OPENVERSE_ENABLED=true` — low confidence)
5. **Premium category illustration** (clean line-art SVG, offline, never breaks the UI)

Without an image key the dashboard shows premium **illustrations** (clearly labelled
"Illustration"). Add `PEXELS_API_KEY` (or Keepa/PA-API for exact Amazon images, or
provide URLs) and run `npm run images:enrich` to populate **real photos** — attached by
source URL with attribution + confidence, never re-hosted, top-50 only, and cached.
Images are honest: representative photos are labelled as not-the-exact-SKU.

## Browser / Search MCP (for live research + images)

Two reputable, official MCPs are recommended (already used in this project's dev):

- **Playwright MCP** (Microsoft, official) — browser automation, page reading, screenshots.
  ```
  claude mcp add playwright --scope user -- npx -y @playwright/mcp@latest
  ```
- **Fetch MCP** (modelcontextprotocol reference) — fetch a page → markdown.
  ```
  claude mcp add fetch --scope user -- uvx mcp-server-fetch
  ```
- Optional **Brave Search MCP** (web search, free API key):
  ```
  claude mcp add brave-search --scope user --env BRAVE_API_KEY=YOUR_KEY -- npx -y @modelcontextprotocol/server-brave-search
  ```

Use web browsing for **public, legal research only**. Do **not** scrape Amazon Seller
Central data or bypass site protections. Live browsing results still require **citations
and confidence labels** — the tool keeps every claim cited and labelled.

## Premium command center (dashboard v2)

A polished, investor-ready SaaS UI: sidebar app-shell, refined dark theme (deep slate + gold/emerald/blue), Manrope/Inter/JetBrains-Mono type, SVG icons, glass surfaces and smooth hover/transition micro-interactions.

- **Overview widget system** — hero KPIs (profit potential, launch capital, best landed, API saved), best-product cards (best overall / ROI / margin / low-risk / supplier / PPC-ready / capital-fit), and analytics panels: **Grade Unlock**, **Restricted Category Shield**, **Risk Radar**, **Sourcing Pulse**, **PPC Readiness**, **Today's Actions**.
- **Grade Unlock system** — explains the B3 cap honestly. Tiers: Estimate-level → **B3**, Hybrid → **A2**, Live → **A5**, User-verified → **A5**. Every capped product shows a "Why capped?" callout; add live data / verification to earn A-grades (restricted items stay D1).
- **Wholesale Finder** — type any product, get direct listings across **14 sources** (Alibaba, AliExpress, Global Sources, Made-in-China, DHgate, 1688, HKTDC, IndiaMART, CJ, Faire, Tundra, Abound, Wholesale Central, DollarDays, Kole, Thomasnet, Uline, WebstaurantStore, Zoro, Quill) with filters (US / China / low-MOQ / fast / private-label / lowest-landed) and a best-deal ROI/margin banner.
- **Watchlist** — save products, add notes (Seller Central result, supplier reply, sample price, MOQ), persisted locally; each shows a **business decision** (Buy sample / Check Seller Central / Contact supplier / Watch / Avoid).
- **Product drawer actions** — Add to watchlist, mark Seller Central checked / supplier contacted / sample ordered (local persistence) — these raise data confidence toward higher grades.
- **Help Center** — step-by-step: Getting Started, Connect Seller Central, Amazon Ads/PPC reports, Keepa, Search/Browser MCP, supplier data, CSV uploads, pre-order verification, exports, troubleshooting — plus a **Connect Your Stack** status board.
- **Charts** — 7 clear panels (grade distribution, top-10 score/ROI/profit with visible names, risk spread, category mix, demand-vs-competition) with plain-English subtitles.

## Daily 8 AM automation + futuristic timer

A Windows Scheduled Task (**"AZ Finds Daily 8AM"**) runs `scripts/daily-8am.ps1` every
morning at 8:00. Each run:
1. Appends the previous batch's **top 5** products to `AZ_Finds_Daily_Top5.csv` (a
   cumulative spreadsheet at the project root — date, grade, ROI, margin, profit,
   supplier, decision).
2. Regenerates **50** products (`research:daily --force`).
3. Attaches real product photos (`images:enrich`, uses `PEXELS_API_KEY` from `.env`).
4. Rebuilds the dashboard.

The sidebar shows a **futuristic live countdown** to the next 8 AM scan. The dashboard
is branded **"by Yamari Group"** with a Founders badge at the top.

Manage the task:
```powershell
Get-ScheduledTask -TaskName "AZ Finds Daily 8AM"      # view
Start-ScheduledTask -TaskName "AZ Finds Daily 8AM"    # run now
Unregister-ScheduledTask -TaskName "AZ Finds Daily 8AM" -Confirm:$false   # remove
```
Manual equivalent: `cd server; npm run research:top5log; npm run research:daily -- --force; npm run images:enrich`.

## A5–D1 grading, images, daily batches & API minimization

- **A5–D1 grades.** Every product is graded best→worst (A5 … D1) from a 100-point
  score across 9 weighted criteria, with hard **grade caps** (restricted→D1,
  hazmat→≤D5, no supplier→≤C4, low ROI/margin, IP risk, low demand confidence→≤B3,
  etc.). The detail modal shows the full "Why this grade?" breakdown and caps.
  In estimate mode grades cap at **B3** until a live data source is connected.
- **Product images.** Offline generated **category placeholders** (SVG data URIs,
  never break the UI). Real supplier/marketplace images only populate when a live
  source returns one with metadata. `image_type` records which path was used.
- **Daily batches.** ≥50 graded products per day, cached to
  `/server/data/batches/<date>.json` and reused unless forced. Three buckets:
  Top opportunities / Needs deeper check / Rejected (shown, never hidden).
- **API minimization.** Default **hybrid low-cost** mode: seed catalog first, paid
  calls reserved for top candidates, every response cached for `CACHE_TTL_HOURS`,
  no duplicate queries. The estimate engine makes **0 paid calls**. The
  **Data Sources** tab shows mode, source live/locked status, calls used, cache
  hits, and estimated calls saved.
- **Clickable detail modal.** Cards and table rows open a tabbed modal
  (Overview / Profit / Suppliers / PPC / Keywords / Risk / Checks / Citations).
- **Rejected tab.** Every rejected product with the exact reason and the rule that
  rejected it.

**Honest note:** the estimate engine can rank and organize opportunities, but it
does **not** replace Seller Central checks, the Amazon Revenue Calculator, supplier
samples, or live market validation. Fees and gating drift over time.

## Claude Desktop / Claude Code MCP config

Add to `claude_desktop_config.json` (Desktop) or your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "amazon-seller": {
      "command": "node",
      "args": ["C:/Users/User/Desktop/amazon-seller-mcp/server/dist/index.js"],
      "env": {
        "KEEPA_API_KEY": "",
        "SERPAPI_KEY": "",
        "BING_SEARCH_API_KEY": ""
      }
    }
  }
}
```

Claude Code one-liner:
```bash
claude mcp add amazon-seller --scope user -- node C:/Users/User/Desktop/amazon-seller-mcp/server/dist/index.js
```

## Environment variables

Copy `.env.example` → `.env` (project root). All keys optional.

| Var | Purpose |
|-----|---------|
| `KEEPA_API_KEY` | Real BSR / price history (with an ASIN) |
| `SERPAPI_KEY` / `BING_SEARCH_API_KEY` | Web + supplier discovery |
| `AMAZON_PA_API_KEY` / `_SECRET` / `_ASSOCIATE_TAG` | Product Advertising API |
| `GOOGLE_TRENDS_ENABLED` | Attempt interest-over-time |
| `DEFAULT_MARKETPLACE` / `DEFAULT_CURRENCY` | Defaults (US / USD) |
| `CACHE_TTL_HOURS` / `MAX_SEARCH_RESULTS` | Caching + result caps |

**No keys → mock mode**: conservative estimates, confidence = low. Add keys for
real mode. You can also feed SellerAmp/Helium 10/Jungle Scout/SmartScout CSV
rows as `manual` anchors into `analyze_amazon_market`.

## Run the dashboard artifact

```bash
cd artifact/app
npm install
npm run dev      # http://localhost:5173
```
It auto-loads `public/sample-dashboard.json`. You can also upload or paste any
JSON produced by `generate_research_dashboard`. In Claude, the same component
set renders as an interactive Artifact.

## Use the Skill

`skill/SKILL.md` documents the workflow and examples (e.g. “Find 20 generic
products under $5 landed, 50%+ ROI, with Alibaba + AliExpress suppliers, and
generate a dashboard”). Exporters:

```bash
python skill/scripts/run_research.py       sample-dashboard.json
python skill/scripts/generate_dashboard.py sample-dashboard.json out.html
python skill/scripts/export_xlsx.py        reports/amazon-research-<date>.json
python skill/scripts/export_pdf.py         reports/amazon-research-<date>.json
```

## PPC Manager, Capital Planner & Marketing

Five additional MCP tools and four dashboard tabs help you plan ads and capital:

- **PPC Manager tab** — pick a product, set capital / risk / target ACOS / monthly
  budget; see daily budget, campaign structure, keyword groups, negatives, bid
  strategy, weekly optimization checklist, and a weekly action plan. **Upload an
  Amazon Ads report CSV** (Search Term / Targeting / Campaign / Advertised
  Product) and it computes what to pause, raise, lower, add as exact/phrase, add
  as negative, and total wasted spend. Export the plan as JSON.
- **Capital Planner tab** — enter available capital, reserve %, inventory %,
  PPC %, sample %, shipping %, landed cost, sale price, net profit before ads, and
  risk. It outputs inventory/PPC/reserve budgets, units to order, safe test-order
  quantity, max safe daily ad spend, break-even units, and profit at 25/50/75/100%
  sell-through, with allocation pie + profit-scenario bar charts.
- **Marketing tab** — positioning, title/bullet/image/A+ strategy, pricing,
  coupons, PPC, **Amazon-policy-compliant** review strategy, and 30/60/90-day plans.
- **Why Rejected tab** — the restricted-category engine's hard-rejects with reasons.

### Ad-metrics glossary

- **ACOS** = Ad Spend ÷ Ad Sales × 100. Lower is better.
- **ROAS** = Ad Sales ÷ Ad Spend. Higher is better (inverse of ACOS).
- **CPC** = cost per click. **CTR** = clicks ÷ impressions.
- **Conversion rate** = orders ÷ clicks.
- **Break-even ACOS** = net profit before ads ÷ sale price × 100. Above this, ads lose money.
- **Target ACOS** = the ACOS you aim for (a fraction of break-even, by risk tolerance).
- **Wasted spend** = spend on clicks/terms with no orders past your thresholds.

### Warnings

PPC recommendations are **estimates** until you upload real Amazon Ads data. PPC
commonly **loses money during launch** — start small and scale only once you have
conversion data. The fee model **drifts** and must be verified with the Amazon
Revenue Calculator. Review strategy is strictly compliant: Request-a-Review only,
no incentives, no positive-only requests, no manipulation.

## Interpreting scores

90–100 excellent · 80–89 strong · 70–79 possible · 60–69 risky · <60 avoid.
Weighting: demand 20, consistency 15, profit/ROI 20, competition 10, supplier
10, gating 10, risk 10, trend 5.

## Limitations

- Fee model approximates the **US** FBA schedule and **drifts** — always confirm
  in the live Amazon Revenue Calculator.
- Mock-mode demand/price/supplier numbers are **estimates**, not measurements.
- Gating is an **estimate**. Only Seller Central confirms it for your account.
- Supplier links may resolve to a search page; confirm the exact item and MOQ.

## Manual verification (before buying)

Search the product in Seller Central → Add a Product → check approval and
category limits → confirm Generic listing → check invoice/compliance asks →
run the Revenue Calculator → check Keepa history → order a sample → confirm no
trademark (USPTO TESS) or patent conflict → start with a small test order.

## Legal / ethical use

This tool uses **only legal, public, or user-authorized** data: official APIs
with your keys, public web/supplier pages, and files you provide. It does **not**
scrape private data, bypass site protections, or log into accounts. It does not
violate Amazon’s terms. It is research assistance, **not** financial or legal
advice. You are responsible for verifying compliance, IP, and safety before
listing or importing any product.
