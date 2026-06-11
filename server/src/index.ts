#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { runResearch } from "./tools/searchInternet.js";
import { searchSuppliers } from "./tools/searchSuppliers.js";
import { searchAmazonSignals } from "./tools/searchAmazonSignals.js";
import { analyzeGating } from "./tools/analyzeGating.js";
import { computeProfitability } from "./tools/calculateProfit.js";
import { scoreProduct } from "./services/scoringService.js";
import { buildDashboard } from "./tools/generateDashboardData.js";
import { exportReport } from "./tools/exportReport.js";
import { referralFee, estimateFbaFee } from "./services/feeService.js";
import { generatePpcStrategy } from "./tools/generatePpcStrategy.js";
import { generateKeywordPlan } from "./tools/generateKeywordPlan.js";
import { calculatePpcBudget } from "./tools/calculatePpcBudget.js";
import { optimizePpcFromReport } from "./tools/optimizePpcFromReport.js";
import { generateListingMarketingStrategy } from "./tools/generateListingMarketingStrategy.js";
import { gradeProductOpportunity } from "./tools/gradeProductOpportunity.js";
import { generateDailyBatch } from "./services/batchService.js";
import { enrichProductImages } from "./tools/enrichProductImages.js";
import { getProductDetailDashboard } from "./tools/getProductDetailDashboard.js";
import { getApiUsageStatusTool } from "./tools/getApiUsageStatus.js";
import { getLiveDataIntegrationPlan } from "./tools/getLiveDataIntegrationPlan.js";
import { lookupByCode, hasRealData } from "./services/realDataService.js";

const server = new McpServer({ name: "amazon-seller-mcp", version: "1.0.0" });

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (msg: string) => ({ isError: true, content: [{ type: "text" as const, text: msg }] });

// 1) search_product_opportunities ------------------------------------------------
server.tool(
  "search_product_opportunities",
  "Search the web + curated catalog for generic Amazon product opportunities, validate demand/gating/suppliers/profit, score and rank them. Honest about uncertainty; mock mode when no API keys.",
  {
    query: z.string().describe("What to research, e.g. 'home organization under $5 landed'"),
    category_preferences: z.array(z.string()).optional(),
    max_landed_cost: z.number().optional(),
    min_roi_percent: z.number().optional().default(0),
    min_margin_percent: z.number().optional().default(0),
    avoid_categories: z.array(z.string()).optional(),
    supplier_regions: z.array(z.string()).optional(),
    include_alibaba: z.boolean().optional().default(true),
    include_aliexpress: z.boolean().optional().default(true),
    include_wholesale_sites: z.boolean().optional().default(true),
    max_results: z.number().optional().default(20),
    country_marketplace: z.string().optional().default("US"),
  },
  async (args) => {
    try {
      const r = await runResearch(args);
      return ok({
        mode: r.mode, scanned: r.scanned, passed: r.passed, warnings: r.warnings,
        products: r.products, suppliers: r.suppliers, profitability: r.profitability,
        risks: r.risks, citations: r.citations,
      });
    } catch (e) {
      return fail(`search_product_opportunities failed: ${(e as Error).message}`);
    }
  }
);

// 2) search_supplier_matches -----------------------------------------------------
server.tool(
  "search_supplier_matches",
  "Find supplier/wholesale sources (Alibaba, AliExpress, Global Sources, Made-in-China, DHgate, Faire, Tundra, CJdropshipping) for a product, with cost/MOQ/lead-time and a match-quality score. Links go to the closest product page when found.",
  {
    product_name: z.string(),
    product_keywords: z.array(z.string()).default([]),
    target_unit_cost: z.number(),
    supplier_sites: z.array(z.string()).optional(),
    minimum_supplier_rating: z.number().optional(),
    max_moq: z.number().optional(),
    include_alibaba: z.boolean().optional().default(true),
    include_aliexpress: z.boolean().optional().default(true),
    include_wholesale_us: z.boolean().optional().default(true),
  },
  async (args) => {
    try {
      const suppliers = await searchSuppliers({ product_candidate_id: args.product_name, ...args });
      return ok({ suppliers });
    } catch (e) {
      return fail(`search_supplier_matches failed: ${(e as Error).message}`);
    }
  }
);

// 3) analyze_amazon_market -------------------------------------------------------
server.tool(
  "analyze_amazon_market",
  "Estimate Amazon demand, BSR, price, seller count, reviews and competition using Keepa (if key + ASIN) or conservative heuristics. Confidence is labeled; never exact without data.",
  {
    product_name: z.string(),
    amazon_url: z.string().optional(),
    asin: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    marketplace: z.string().optional().default("US"),
    category: z.string().optional(),
    use_keepa_if_available: z.boolean().optional().default(true),
    use_selleramp_if_available: z.boolean().optional().default(false),
    use_manual_estimates: z.boolean().optional().default(true),
  },
  async (args) => {
    try {
      return ok(await searchAmazonSignals(args));
    } catch (e) {
      return fail(`analyze_amazon_market failed: ${(e as Error).message}`);
    }
  }
);

// 4) analyze_gating_and_risk -----------------------------------------------------
server.tool(
  "analyze_gating_and_risk",
  "Estimate gating (likely ungated / possibly gated / likely gated / manual check required) plus IP, hazmat, regulatory and safety risk. Output is an estimate only and always recommends a Seller Central check.",
  {
    product_name: z.string(),
    category: z.string(),
    brand_status: z.enum(["generic", "branded", "unknown"]).optional().default("generic"),
    amazon_category_path: z.string().optional(),
    marketplace: z.string().optional().default("US"),
  },
  async (args) => {
    try {
      return ok(analyzeGating(args));
    } catch (e) {
      return fail(`analyze_gating_and_risk failed: ${(e as Error).message}`);
    }
  }
);

// 5) calculate_profitability -----------------------------------------------------
server.tool(
  "calculate_profitability",
  "Compute FBA/FBM net profit, ROI, margin, break-even, max buy cost and a 5×5 price/cost sensitivity grid. Referral/FBA helpers available if you omit them.",
  {
    sale_price: z.number(),
    unit_cost: z.number(),
    category: z.string().optional(),
    shipping_per_unit: z.number().optional().default(0),
    prep_cost: z.number().optional().default(0.2),
    packaging_cost: z.number().optional().default(0.3),
    referral_fee_percent: z.number().optional(),
    fba_fee: z.number().optional(),
    storage_fee_estimate: z.number().optional().default(0.1),
    return_rate_percent: z.number().optional().default(3),
    ad_cost_percent: z.number().optional().default(10),
    inbound_shipping_per_unit: z.number().optional().default(0.5),
    weight_oz: z.number().optional(),
  },
  async (args) => {
    try {
      const referral = args.referral_fee_percent ?? (args.category ? referralFee(args.sale_price, args.category) / args.sale_price * 100 : 15);
      const fba = args.fba_fee ?? estimateFbaFee(args.weight_oz ?? 8);
      return ok(computeProfitability({ ...args, referral_fee_percent: referral, fba_fee: fba }));
    } catch (e) {
      return fail(`calculate_profitability failed: ${(e as Error).message}`);
    }
  }
);

// 6) score_product_opportunity ---------------------------------------------------
server.tool(
  "score_product_opportunity",
  "Score a product 0–100 with the weighted model (demand 20, consistency 15, profit 20, competition 10, supplier 10, gating 10, risk 10, trend 5). Returns grade, recommendation and reasons.",
  {
    demand_score: z.number(),
    competition_score: z.number(),
    profit_score: z.number(),
    supplier_score: z.number(),
    gating_score: z.number(),
    risk_score: z.number(),
    trend_score: z.number(),
    review_score: z.number(),
  },
  async (args) => {
    try {
      return ok(scoreProduct(args));
    } catch (e) {
      return fail(`score_product_opportunity failed: ${(e as Error).message}`);
    }
  }
);

// 7) generate_research_dashboard -------------------------------------------------
server.tool(
  "generate_research_dashboard",
  "Turn research bundles (products, suppliers, profitability, risks, citations) into dashboard-ready JSON: summary cards, ranked products, and all chart series for the React artifact.",
  {
    products: z.array(z.any()),
    suppliers: z.array(z.any()).default([]),
    profitability: z.array(z.any()).default([]),
    risks: z.array(z.any()).default([]),
    citations: z.array(z.any()).default([]),
  },
  async (args) => {
    try {
      return ok(await buildDashboard(args as any));
    } catch (e) {
      return fail(`generate_research_dashboard failed: ${(e as Error).message}`);
    }
  }
);

// 8) export_product_report -------------------------------------------------------
server.tool(
  "export_product_report",
  "Export the research as markdown or CSV (written to ./reports). For XLSX/PDF it writes a JSON payload and returns the Skill command to render it.",
  {
    format: z.enum(["markdown", "csv", "xlsx", "pdf"]),
    products: z.array(z.any()),
    profitability: z.array(z.any()).optional(),
    suppliers: z.array(z.any()).optional(),
    include_citations: z.boolean().optional().default(true),
    include_charts: z.boolean().optional().default(true),
    include_supplier_links: z.boolean().optional().default(true),
  },
  async (args) => {
    try {
      return ok(await exportReport(args as any));
    } catch (e) {
      return fail(`export_product_report failed: ${(e as Error).message}`);
    }
  }
);

// 9) generate_ppc_strategy -------------------------------------------------------
server.tool(
  "generate_ppc_strategy",
  "Generate an Amazon PPC launch + optimization strategy: campaign structure, keyword groups, negatives, daily budget, bid range, target/break-even ACOS, optimization rules and a weekly action plan. Estimates only — verify with real Amazon Ads data.",
  {
    product_name: z.string(),
    category: z.string(),
    sale_price: z.number(),
    landed_cost: z.number(),
    net_profit_per_unit: z.number(),
    target_acos_percent: z.number().optional(),
    break_even_acos_percent: z.number().optional(),
    monthly_budget: z.number().optional(),
    launch_phase: z.enum(["test", "launch", "scale", "defend"]).optional().default("launch"),
    marketplace: z.string().optional().default("US"),
    keyword_seed_list: z.array(z.string()).optional().default([]),
    risk_tolerance: z.enum(["low", "medium", "high"]).optional().default("low"),
    has_brand: z.boolean().optional().default(false),
  },
  async (args) => {
    try { return ok(generatePpcStrategy(args)); }
    catch (e) { return fail(`generate_ppc_strategy failed: ${(e as Error).message}`); }
  }
);

// 10) generate_keyword_plan ------------------------------------------------------
server.tool(
  "generate_keyword_plan",
  "Generate keyword research + grouping for Amazon PPC and listing SEO (primary/secondary/long-tail/exact/phrase/broad/negatives/backend). Search volumes are marked unknown unless real API data is provided.",
  {
    product_name: z.string(),
    product_features: z.array(z.string()).optional().default([]),
    category: z.string(),
    competitor_keywords: z.array(z.string()).optional().default([]),
    search_volume_data_available: z.boolean().optional().default(false),
    marketplace: z.string().optional().default("US"),
  },
  async (args) => {
    try { return ok(generateKeywordPlan(args)); }
    catch (e) { return fail(`generate_keyword_plan failed: ${(e as Error).message}`); }
  }
);

// 11) calculate_ppc_budget -------------------------------------------------------
server.tool(
  "calculate_ppc_budget",
  "Capital + PPC budget planner: splits capital into inventory/PPC/reserve/sample/shipping, estimates units to order, max safe daily ad spend, break-even units, and 25/50/75/100% sell-through profit scenarios. Estimates only.",
  {
    total_available_capital: z.number(),
    inventory_budget_percent: z.number().optional(),
    ppc_budget_percent: z.number().optional(),
    emergency_reserve_percent: z.number().optional(),
    sample_budget_percent: z.number().optional(),
    shipping_budget_percent: z.number().optional(),
    product_landed_cost: z.number(),
    sale_price: z.number(),
    expected_net_profit_before_ads: z.number(),
    target_acos_percent: z.number().optional(),
    break_even_acos_percent: z.number().optional(),
    risk_tolerance: z.enum(["low", "medium", "high"]).optional().default("low"),
    campaign_test_days: z.number().optional(),
  },
  async (args) => {
    try { return ok(calculatePpcBudget(args)); }
    catch (e) { return fail(`calculate_ppc_budget failed: ${(e as Error).message}`); }
  }
);

// 12) optimize_ppc_from_report ---------------------------------------------------
server.tool(
  "optimize_ppc_from_report",
  "Analyze an uploaded Amazon Ads search-term/targeting/campaign report (array of rows) and recommend bid increases/decreases, pauses, exact/phrase/negative additions, budget reallocation, and wasted-spend totals.",
  {
    report_rows: z.array(z.record(z.any())),
    product_name: z.string().optional(),
    target_acos_percent: z.number(),
    break_even_acos_percent: z.number(),
    min_clicks_before_decision: z.number().optional().default(10),
    min_spend_before_decision: z.number().optional().default(10),
  },
  async (args) => {
    try { return ok(optimizePpcFromReport(args)); }
    catch (e) { return fail(`optimize_ppc_from_report failed: ${(e as Error).message}`); }
  }
);

// 13) generate_listing_marketing_strategy ---------------------------------------
server.tool(
  "generate_listing_marketing_strategy",
  "Generate a full, Amazon-policy-compliant marketing strategy: positioning, title/bullet/image/A+ strategy, pricing, coupons, PPC, COMPLIANT review building (Request-a-Review only, no incentives), and 30/60/90-day launch plans.",
  {
    product_name: z.string(),
    category: z.string(),
    sale_price: z.number(),
    main_features: z.array(z.string()).optional().default([]),
    target_customer: z.string().optional(),
    competitors: z.array(z.string()).optional().default([]),
    available_capital: z.number().optional(),
    inventory_units: z.number().optional(),
    risk_tolerance: z.enum(["low", "medium", "high"]).optional().default("low"),
  },
  async (args) => {
    try { return ok(generateListingMarketingStrategy(args)); }
    catch (e) { return fail(`generate_listing_marketing_strategy failed: ${(e as Error).message}`); }
  }
);

// 14) grade_product_opportunity --------------------------------------------------
server.tool(
  "grade_product_opportunity",
  "Apply the A5–D1 grading system (best A5 → worst D1) to a product using 9 weighted criteria plus hard grade caps (restricted→D1, hazmat→≤D5, no supplier→≤C4, low ROI/margin, IP risk, etc.). Returns grade, criteria scores, caps applied, and an estimate-level confidence label.",
  {
    product_candidate: z.record(z.any()),
    profitability: z.record(z.any()),
    risk: z.record(z.any()),
    supplier_options: z.array(z.any()).optional().default([]),
    ppc_strategy: z.record(z.any()).optional(),
    capital_plan: z.record(z.any()).optional(),
    data_confidence: z.enum(["estimate-level", "hybrid", "live", "user-uploaded"]).optional().default("estimate-level"),
  },
  async (args) => {
    try { return ok(gradeProductOpportunity(args as any)); }
    catch (e) { return fail(`grade_product_opportunity failed: ${(e as Error).message}`); }
  }
);

// 15) generate_daily_product_batch -----------------------------------------------
server.tool(
  "generate_daily_product_batch",
  "Generate or load the daily batch of at least 50 graded product opportunities while minimizing API calls. Caches to /server/data/batches/<date>.json and reuses it unless force_refresh. Default mode hybrid_low_cost; estimate mode uses 0 paid calls.",
  {
    date: z.string(),
    min_products: z.number().optional().default(50),
    data_mode: z.enum(["estimate_engine_only", "hybrid_low_cost", "live_selected_only", "full_live_scan"]).optional().default("hybrid_low_cost"),
    force_refresh: z.boolean().optional().default(false),
    categories: z.array(z.string()).optional().default([]),
    max_api_calls: z.number().optional().default(20),
    marketplace: z.string().optional().default("US"),
  },
  async (args) => {
    try {
      const b = await generateDailyBatch(args);
      // trim heavy product payloads in the tool echo; full data is in the batch file
      return ok({ batch_id: b.batch_id, batch_date: b.batch_date, data_mode: b.data_mode, products_generated: b.products_generated, products_passed: b.products_passed, products_rejected: b.products_rejected, top_grade_count: b.top_grade_count, grade_distribution: b.grade_distribution, api_usage: b.api_usage, cache_stats: b.cache_stats, data_source_status: b.data_source_status });
    } catch (e) { return fail(`generate_daily_product_batch failed: ${(e as Error).message}`); }
  }
);

// 16) enrich_product_images ------------------------------------------------------
server.tool(
  "enrich_product_images",
  "Attach product images or category placeholders to product candidates. With no live source, every product gets an offline generated category placeholder (never breaks the UI). Records image_type and attribution.",
  {
    products: z.array(z.record(z.any())),
    allow_supplier_images: z.boolean().optional().default(false),
    allow_marketplace_images: z.boolean().optional().default(false),
    use_placeholders: z.boolean().optional().default(true),
  },
  async (args) => {
    try { return ok(await enrichProductImages(args as any)); }
    catch (e) { return fail(`enrich_product_images failed: ${(e as Error).message}`); }
  }
);

// 17) get_product_detail_dashboard -----------------------------------------------
server.tool(
  "get_product_detail_dashboard",
  "Return complete detail data for one product (from the latest or a given daily batch) for the clickable modal: overview, profit, suppliers, PPC, keywords, risk, checks, and citations, plus grade breakdown.",
  {
    product_id: z.string(),
    batch_date: z.string().optional(),
    include_profit: z.boolean().optional().default(true),
    include_suppliers: z.boolean().optional().default(true),
    include_ppc: z.boolean().optional().default(true),
    include_keywords: z.boolean().optional().default(true),
    include_risk: z.boolean().optional().default(true),
    include_citations: z.boolean().optional().default(true),
  },
  async (args) => {
    try { return ok(await getProductDetailDashboard(args)); }
    catch (e) { return fail(`get_product_detail_dashboard failed: ${(e as Error).message}`); }
  }
);

// 18) get_api_usage_status -------------------------------------------------------
server.tool(
  "get_api_usage_status",
  "Return data mode, source live/locked status, API calls used today, cache hits/misses, estimated calls saved, and last/next refresh — so paid usage stays visible and low.",
  {
    date: z.string().optional(),
    data_mode: z.enum(["estimate_engine_only", "hybrid_low_cost", "live_selected_only", "full_live_scan"]).optional(),
    include_cache_details: z.boolean().optional().default(true),
  },
  async (args) => {
    try { return ok(await getApiUsageStatusTool(args)); }
    catch (e) { return fail(`get_api_usage_status failed: ${(e as Error).message}`); }
  }
);

// 19) get_live_data_integration_plan --------------------------------------------
server.tool(
  "get_live_data_integration_plan",
  "Return the official, safe integration plan for live Amazon store data: SP-API, Amazon Ads API, Creator/product data, Keepa, server-side env vars, CSV bridge, and guardrails.",
  {
    marketplace: z.string().optional().default("US"),
    include_csv_bridge: z.boolean().optional().default(true),
  },
  async (args) => {
    try { return ok(getLiveDataIntegrationPlan(args)); }
    catch (e) { return fail(`get_live_data_integration_plan failed: ${(e as Error).message}`); }
  }
);

// 20) lookup_real_price ----------------------------------------------------------
server.tool(
  "lookup_real_price",
  "Look up the LIVE Amazon price, referral fee, seller count and reviews for an ASIN/UPC via retailerapi (free tier, needs RETAILERAPI_KEY). Real data — not an estimate. Returns null-ish guidance if no key or no match.",
  {
    identifier: z.string().describe("Amazon ASIN (B0...) or a UPC/EAN/GTIN"),
  },
  async (args) => {
    try {
      if (!hasRealData()) return ok({ connected: false, note: "RETAILERAPI_KEY not set — add a free key from retailerapi.com to .env to enable live prices." });
      const r = await lookupByCode(args.identifier);
      if (!r) return ok({ connected: true, found: false, note: `No live data for ${args.identifier} (bad code, no match, or API error).` });
      return ok({ connected: true, found: true, ...r });
    } catch (e) {
      return fail(`lookup_real_price failed: ${(e as Error).message}`);
    }
  }
);

// 21) ask_maximus ---------------------------------------------------------------
server.tool(
  "ask_maximus",
  "Ask MAXIMUS (claude-fable-5, Chief Intelligence Officer) any question about Amazon FBA strategy, product research, suppliers, PPC, or market intelligence. Returns a full analytical response.",
  {
    question: z.string().describe("The question or request for MAXIMUS"),
    context:  z.string().optional().describe("Optional JSON context e.g. a product object or batch summary"),
  },
  async (args) => {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return fail("ANTHROPIC_API_KEY not set — add it to .env");

      const body = {
        model: "claude-fable-5",
        max_tokens: 2048,
        system: "You are MAXIMUS — Chief Intelligence Officer of Yamari Group. You provide sharp, data-driven intelligence on Amazon FBA opportunities, supplier sourcing, PPC strategy, and market dynamics. Be direct, precise, and actionable.",
        messages: [{
          role: "user",
          content: args.context
            ? `Context:\n${args.context}\n\nQuestion: ${args.question}`
            : args.question,
        }],
      };

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:  "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) return fail(`Anthropic API error ${res.status}: ${await res.text()}`);
      const data = await res.json() as any;
      const text: string = data.content?.[0]?.text ?? "No response";
      return ok({ answer: text, model: "claude-fable-5", tokens: data.usage });
    } catch (e) {
      return fail(`ask_maximus failed: ${(e as Error).message}`);
    }
  }
);

// 22) get_intelligence_brief ----------------------------------------------------
server.tool(
  "get_intelligence_brief",
  "Generate a concise executive intelligence brief from MAXIMUS summarising the top opportunities, risks, and recommended actions from the current batch data.",
  {
    batch_summary: z.string().describe("JSON string of the batch summary or product list"),
    focus: z.enum(["opportunities", "risks", "ppc", "suppliers", "full"]).optional().default("full"),
  },
  async (args) => {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return fail("ANTHROPIC_API_KEY not set");

      const focusMap: Record<string, string> = {
        opportunities: "Focus on the top 3 product opportunities with highest ROI potential.",
        risks:         "Focus on the most critical risks and what to avoid.",
        ppc:           "Focus on PPC strategy recommendations for the best products.",
        suppliers:     "Focus on supplier quality and sourcing recommendations.",
        full:          "Cover opportunities, risks, supplier notes, and PPC recommendations.",
      };

      const prompt = `Amazon FBA Batch Data:\n${args.batch_summary}\n\nProvide a concise executive intelligence brief. ${focusMap[args.focus ?? "full"]} Format with clear headers and bullet points. Keep it tight and actionable — max 400 words.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:  "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      "claude-fable-5",
          max_tokens: 1024,
          system:     "You are MAXIMUS — Chief Intelligence Officer of Yamari Group. Write sharp, executive-level intelligence briefs.",
          messages:   [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) return fail(`Anthropic API error ${res.status}: ${await res.text()}`);
      const data = await res.json() as any;
      return ok({ brief: data.content?.[0]?.text ?? "", focus: args.focus, model: "claude-fable-5" });
    } catch (e) {
      return fail(`get_intelligence_brief failed: ${(e as Error).message}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs (stdout is the MCP channel)
  console.error("amazon-seller-mcp running on stdio");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
