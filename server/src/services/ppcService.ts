import { makeCitation } from "./citationService.js";
import { round } from "../utils/normalize.js";
import type {
  PPCStrategy, KeywordPlan, CapitalPlan, MarketingStrategy, PPCOptimization,
  RiskTolerance, LaunchPhase, PPCCampaign, KeywordGroup, ProfitScenario, Confidence,
} from "../types/ppc.js";

const PPC_DISCLAIMER =
  "PPC numbers are estimates. Real ACOS/CPC/conversion vary by niche and only become reliable after you run ads and upload real Amazon Ads reports.";

export function breakEvenAcos(netProfitBeforeAds: number, salePrice: number): number {
  if (salePrice <= 0) return 0;
  return round((netProfitBeforeAds / salePrice) * 100, 1);
}

export function recommendTargetAcos(breakEven: number, risk: RiskTolerance): number {
  const factor = risk === "low" ? 0.55 : risk === "medium" ? 0.68 : 0.85;
  return round(breakEven * factor, 1);
}

// ── 1) PPC STRATEGY ──────────────────────────────────────────────────────────
export interface PpcStrategyInput {
  product_candidate_id?: string;
  product_name: string;
  category: string;
  sale_price: number;
  landed_cost: number;
  net_profit_per_unit: number;
  target_acos_percent?: number;
  break_even_acos_percent?: number;
  monthly_budget?: number;
  launch_phase?: LaunchPhase;
  marketplace?: string;
  keyword_seed_list?: string[];
  risk_tolerance?: RiskTolerance;
  has_brand?: boolean;
}

export function generatePpcStrategy(i: PpcStrategyInput): PPCStrategy {
  const risk = i.risk_tolerance || "low";
  const phase = i.launch_phase || "launch";
  const breakEven = i.break_even_acos_percent ?? breakEvenAcos(i.net_profit_per_unit, i.sale_price);
  const targetAcos = i.target_acos_percent ?? recommendTargetAcos(breakEven, risk);

  // Daily budget from monthly budget or a conservative default tied to price.
  const monthly = i.monthly_budget ?? Math.max(150, Math.round(i.sale_price * 20));
  const phaseFactor = phase === "test" ? 0.6 : phase === "scale" ? 1.4 : phase === "defend" ? 1.0 : 1.0;
  const dailyBudget = round((monthly / 30) * phaseFactor);

  // Bid range anchored to a target CPC implied by target ACOS and price.
  const targetCpc = Math.max(0.2, round((i.sale_price * (targetAcos / 100)) * 0.12));
  const bidRange = { min: round(targetCpc * 0.6), max: round(targetCpc * 1.4) };

  const seeds = (i.keyword_seed_list && i.keyword_seed_list.length ? i.keyword_seed_list : [i.product_name]).map((s) => s.toLowerCase());

  const campaigns: PPCCampaign[] = [
    { name: "Auto — Discovery", type: "auto", goal: "Discover converting search terms", daily_budget: round(dailyBudget * 0.3), bid_range: bidRange, notes: "Harvest winners into exact; mine negatives weekly." },
    { name: "Manual Exact — Winners", type: "manual-exact", goal: "Scale proven converting terms", daily_budget: round(dailyBudget * 0.35), bid_range: { min: round(bidRange.min * 1.1), max: round(bidRange.max * 1.2) }, match_type: "exact", notes: "Move only terms with proven orders here." },
    { name: "Manual Phrase — Expansion", type: "manual-phrase", goal: "Expand around winners", daily_budget: round(dailyBudget * 0.2), bid_range: bidRange, match_type: "phrase", notes: "Mid-funnel; feeds exact." },
    { name: "Manual Broad — Research", type: "manual-broad", goal: "Broad keyword discovery", daily_budget: round(dailyBudget * 0.1), bid_range: { min: round(bidRange.min * 0.8), max: bidRange.max }, match_type: "broad", notes: "Low bids; discovery only." },
    { name: "Product Targeting — Competitors", type: "product-targeting", goal: "Target competitor ASINs/categories", daily_budget: round(dailyBudget * 0.05), bid_range: bidRange, notes: "Target weaker competitor listings, not market leaders." },
  ];
  if (i.has_brand) {
    campaigns.push({ name: "Branded Defense", type: "branded-defense", goal: "Defend your brand terms", daily_budget: round(dailyBudget * 0.05), bid_range: { min: 0.2, max: round(bidRange.min) }, notes: "Only because you have a registered brand." });
  }

  const keyword_groups: KeywordGroup[] = [
    { group: "Core product", match_type: "exact", keywords: seeds.slice(0, 5) },
    { group: "Use-case / phrase", match_type: "phrase", keywords: seeds.map((s) => `${s} for home`).slice(0, 4) },
    { group: "Discovery", match_type: "broad", keywords: seeds.slice(0, 3) },
  ];

  const negative_keywords = ["free", "cheap", "used", "diy", "how to", "repair", "replacement part", "wholesale", "bulk"];

  const optimization_rules = [
    `Raise bids 10–15% on keywords converting below ${targetAcos}% ACOS.`,
    `Lower bids 10–20% on keywords above ${Math.round(breakEven)}% (break-even) ACOS.`,
    "Pause keywords with high spend and zero orders after the click/spend threshold.",
    "Move converting auto/broad/phrase search terms into the Manual Exact campaign.",
    "Add irrelevant or wrong-intent search terms as negatives immediately.",
    "Keep a small discovery budget running at all times; do not scale before conversion data exists.",
  ];

  const weekly_action_plan = [
    { week: "Week 1", actions: ["Launch auto + low-bid manual research", "Confirm tracking + budgets", "Daily check for irrelevant terms → negatives"] },
    { week: "Week 2", actions: ["Harvest converting terms → exact", "Add early negatives", "Hold bids steady to gather data"] },
    { week: "Week 3", actions: ["Adjust bids by ACOS vs target", "Pause zero-order high-spend terms", "Expand phrase around winners"] },
    { week: "Week 4", actions: ["Reallocate budget to profitable exact", "Begin cautious scaling if ACOS < target", "Review wasted spend"] },
  ];

  const warnings = [
    PPC_DISCLAIMER,
    phase === "scale" ? "Scaling before you have conversion data can burn budget fast." : "Start small until conversion data exists; PPC commonly loses money during launch.",
    breakEven < 12 ? "Break-even ACOS is low — there is little room for ad spend. Margin may be too thin for aggressive PPC." : "",
  ].filter(Boolean);

  return {
    product_candidate_id: i.product_candidate_id || i.product_name,
    product_name: i.product_name,
    launch_phase: phase,
    target_acos_percent: targetAcos,
    break_even_acos_percent: breakEven,
    daily_budget: dailyBudget,
    monthly_budget: monthly,
    suggested_bid_range: bidRange,
    campaign_structure: campaigns,
    keyword_groups,
    negative_keywords,
    bid_strategy: risk === "high" ? "Dynamic bids - up and down" : "Dynamic bids - down only (safer for launch)",
    optimization_rules,
    weekly_action_plan,
    warnings,
    confidence: "low",
    citations: [makeCitation("PPC heuristic model", "internal://ppc", "Estimated PPC plan, verify with Amazon Ads data", "estimate")],
  };
}

// ── 2) KEYWORD PLAN ──────────────────────────────────────────────────────────
export interface KeywordPlanInput {
  product_candidate_id?: string;
  product_name: string;
  product_features?: string[];
  category: string;
  competitor_keywords?: string[];
  search_volume_data_available?: boolean;
  marketplace?: string;
}

export function generateKeywordPlan(i: KeywordPlanInput): KeywordPlan {
  const base = i.product_name.toLowerCase().replace(/\(.*?\)/g, "").trim();
  const feats = (i.product_features || []).map((f) => f.toLowerCase());
  const primary = uniq([base, ...base.split(" ").filter((w) => w.length > 3).map((w) => w)]).slice(0, 6);
  const useCases = ["for home", "for office", "for kitchen", "for closet", "for travel"].map((u) => `${base} ${u}`);
  const problem = ["space saving", "organizer", "storage solution", "declutter"].map((p) => `${base} ${p}`);
  const material = feats.filter((f) => /steel|silicone|bamboo|plastic|metal|fabric|aluminum/.test(f)).map((m) => `${m} ${base}`);
  const longTail = uniq([...useCases, ...problem]).slice(0, 10);
  const secondary = uniq([...material, ...problem.slice(0, 3), ...feats]).slice(0, 8);

  const negative_keywords = ["free", "used", "broken", "repair", "replacement", "diy", "how to", "rental"];
  const confidence_score = i.search_volume_data_available ? 70 : 35;

  return {
    product_candidate_id: i.product_candidate_id || i.product_name,
    primary_keywords: primary,
    secondary_keywords: secondary,
    long_tail_keywords: longTail,
    competitor_keywords: i.competitor_keywords || [],
    exact_match_keywords: primary.slice(0, 5),
    phrase_match_keywords: uniq([...primary.slice(0, 3), ...useCases.slice(0, 3)]),
    broad_match_keywords: primary.slice(0, 3),
    negative_keywords,
    backend_search_terms: uniq([...secondary, ...longTail]).slice(0, 20),
    title_keywords: primary.slice(0, 4),
    bullet_keywords: uniq([...primary.slice(0, 2), ...secondary.slice(0, 4)]),
    confidence_score,
    confidence: i.search_volume_data_available ? "medium" : "low",
    citations: [makeCitation(i.search_volume_data_available ? "Keyword tool (user data)" : "Keyword heuristic (no volume data)", "internal://kw", "Keyword groupings; volumes unknown unless API data provided", i.search_volume_data_available ? "api" : "mock")],
  };
}

// ── 3) CAPITAL / PPC BUDGET ──────────────────────────────────────────────────
export interface CapitalInput {
  total_available_capital: number;
  inventory_budget_percent?: number;
  ppc_budget_percent?: number;
  emergency_reserve_percent?: number;
  sample_budget_percent?: number;
  shipping_budget_percent?: number;
  product_landed_cost: number;
  sale_price: number;
  expected_net_profit_before_ads: number;
  target_acos_percent?: number;
  break_even_acos_percent?: number;
  risk_tolerance?: RiskTolerance;
  campaign_test_days?: number;
}

export function calculateCapitalPlan(i: CapitalInput): CapitalPlan {
  const risk = i.risk_tolerance || "low";
  const reservePct = (i.emergency_reserve_percent ?? (risk === "low" ? 25 : risk === "medium" ? 20 : 15)) / 100;
  const invPct = (i.inventory_budget_percent ?? 55) / 100;
  const ppcPct = (i.ppc_budget_percent ?? 15) / 100;
  const samplePct = (i.sample_budget_percent ?? 3) / 100;
  const shipPct = (i.shipping_budget_percent ?? 7) / 100;

  const total = Math.max(0, i.total_available_capital);
  const reserve = round(total * reservePct);
  const usable = total - reserve;
  const inventory = round(usable * invPct);
  const ppc = round(usable * ppcPct);
  const sample = round(usable * samplePct);
  const shipping = round(usable * shipPct);

  const units = i.product_landed_cost > 0 ? Math.floor(inventory / i.product_landed_cost) : 0;
  const testDays = i.campaign_test_days ?? 21;
  const maxDaily = round(ppc / testDays);
  const breakEven = i.break_even_acos_percent ?? breakEvenAcos(i.expected_net_profit_before_ads, i.sale_price);
  const targetAcos = i.target_acos_percent ?? recommendTargetAcos(breakEven, risk);
  const breakEvenUnits = i.expected_net_profit_before_ads > 0 ? Math.ceil((inventory + ppc) / i.expected_net_profit_before_ads) : 0;

  const profit_scenarios: ProfitScenario[] = [25, 50, 75, 100].map((st) => {
    const sold = Math.round(units * (st / 100));
    const gross = round(sold * i.expected_net_profit_before_ads);
    const adSpend = round(Math.min(ppc, sold * i.sale_price * (targetAcos / 100)));
    return { sell_through_percent: st, units_sold: sold, gross_profit: gross, ad_spend: adSpend, net_profit: round(gross - adSpend) };
  });

  const warnings: string[] = [PPC_DISCLAIMER];
  if (units < 50) warnings.push("Estimated order quantity is small; many suppliers require higher MOQ. Verify MOQ before ordering.");
  if (ppc < 300) warnings.push("PPC budget may be too small to gather meaningful conversion data (aim for enough for ~10+ clicks per keyword).");
  if (breakEven < 12) warnings.push("Break-even ACOS is low; high ad spend could erase your margin.");
  if (reservePct < 0.15) warnings.push("Reserve under 15% increases cashflow risk if sell-through is slow.");
  warnings.push("Cash can be tied up in inventory for weeks. Plan for a cash-conversion cycle before reordering.");

  return {
    total_available_capital: total,
    inventory_budget: inventory,
    ppc_budget: ppc,
    emergency_reserve: reserve,
    sample_budget: sample,
    shipping_budget: shipping,
    estimated_units_to_order: units,
    safe_test_order_quantity: Math.min(units, Math.max(25, Math.floor(units * 0.4))),
    max_safe_daily_ad_spend: maxDaily,
    launch_testing_budget: round(ppc * 0.4),
    scaling_budget: round(ppc * 0.6),
    break_even_units: breakEvenUnits,
    break_even_acos_percent: breakEven,
    target_acos_percent: targetAcos,
    expected_cash_conversion_cycle: "~30–60 days (order → inbound → sell-through → payout). Verify with your supplier lead time.",
    profit_scenarios,
    warnings,
  };
}

// ── 4) OPTIMIZE FROM REPORT ──────────────────────────────────────────────────
export interface OptimizeInput {
  report_rows: Array<Record<string, any>>;
  product_name?: string;
  target_acos_percent: number;
  break_even_acos_percent: number;
  min_clicks_before_decision?: number;
  min_spend_before_decision?: number;
}

function pickNum(row: Record<string, any>, keys: string[]): number {
  for (const k of Object.keys(row)) {
    if (keys.some((want) => k.toLowerCase().replace(/[^a-z]/g, "").includes(want))) {
      const v = parseFloat(String(row[k]).replace(/[$,%]/g, ""));
      if (!isNaN(v)) return v;
    }
  }
  return 0;
}
function pickStr(row: Record<string, any>, keys: string[]): string {
  for (const k of Object.keys(row)) {
    if (keys.some((want) => k.toLowerCase().replace(/[^a-z]/g, "").includes(want))) return String(row[k]);
  }
  return "";
}

export function optimizeFromReport(i: OptimizeInput): PPCOptimization {
  const minClicks = i.min_clicks_before_decision ?? 10;
  const minSpend = i.min_spend_before_decision ?? 10;
  const warnings: string[] = [PPC_DISCLAIMER];

  const rows = Array.isArray(i.report_rows) ? i.report_rows : [];
  if (!rows.length) {
    return emptyOptimization(["No report rows provided. Upload an Amazon Ads Search Term / Targeting / Campaign report CSV."]);
  }
  // column sanity check
  const sample = rows[0];
  const hasSearchTerm = Object.keys(sample).some((k) => /search.?term|targeting|keyword/i.test(k));
  const hasSpend = Object.keys(sample).some((k) => /spend|cost/i.test(k));
  if (!hasSearchTerm || !hasSpend) {
    warnings.push("Could not find expected columns (search term/targeting + spend). Showing best-effort parse; verify column names.");
  }

  const out = emptyOptimization(warnings);
  for (const row of rows) {
    const term = pickStr(row, ["customersearchterm", "searchterm", "targeting", "keyword"]) || "(unknown)";
    const clicks = pickNum(row, ["clicks"]);
    const spend = pickNum(row, ["spend", "cost"]);
    const sales = pickNum(row, ["sales", "revenue"]);
    const orders = pickNum(row, ["orders", "units"]);
    let acos = pickNum(row, ["acos"]);
    if (!acos && sales > 0) acos = round((spend / sales) * 100, 1);

    if (spend >= minSpend && orders === 0 && clicks >= minClicks) {
      out.keywords_to_pause.push({ term, reason: `${clicks} clicks, $${spend} spend, 0 orders.` });
      out.search_terms_to_add_negative.push({ term, reason: "Spend with no conversions." });
      out.wasted_spend_analysis.rows.push({ term, spend, clicks, sales });
      out.wasted_spend_analysis.total_wasted_spend = round(out.wasted_spend_analysis.total_wasted_spend + spend);
      continue;
    }
    if (sales > 0 && acos > 0) {
      if (acos <= i.target_acos_percent) {
        out.keywords_to_increase_bid.push({ term, reason: `ACOS ${acos}% ≤ target ${i.target_acos_percent}%.` });
        out.profitable_keyword_analysis.push({ term, acos, sales });
        if (orders >= 2) out.search_terms_to_add_exact.push(term);
        else out.search_terms_to_add_phrase.push(term);
      } else if (acos > i.break_even_acos_percent) {
        out.keywords_to_decrease_bid.push({ term, reason: `ACOS ${acos}% above break-even ${i.break_even_acos_percent}%.` });
      } else {
        out.keywords_to_decrease_bid.push({ term, reason: `ACOS ${acos}% above target but below break-even; trim bid.` });
      }
    }
  }

  out.budget_reallocation = [
    "Shift budget from high-ACOS campaigns toward the profitable exact campaign.",
    "Keep a small discovery budget on auto/broad.",
    "Do not scale a campaign until it shows consistent profitable orders.",
  ];
  out.next_week_plan = [
    `Add ${out.search_terms_to_add_negative.length} negative term(s).`,
    `Promote ${out.search_terms_to_add_exact.length} term(s) to exact.`,
    `Raise bids on ${out.keywords_to_increase_bid.length}, lower on ${out.keywords_to_decrease_bid.length}.`,
    `Recovered/avoidable wasted spend: $${out.wasted_spend_analysis.total_wasted_spend}.`,
  ];
  return out;
}

function emptyOptimization(warnings: string[]): PPCOptimization {
  return {
    keywords_to_increase_bid: [], keywords_to_decrease_bid: [], keywords_to_pause: [],
    search_terms_to_add_exact: [], search_terms_to_add_phrase: [], search_terms_to_add_negative: [],
    campaigns_to_adjust: [], budget_reallocation: [],
    wasted_spend_analysis: { total_wasted_spend: 0, rows: [] },
    profitable_keyword_analysis: [], next_week_plan: [], warnings,
  };
}

// ── 5) MARKETING STRATEGY ────────────────────────────────────────────────────
export interface MarketingInput {
  product_candidate_id?: string;
  product_name: string;
  category: string;
  sale_price: number;
  main_features?: string[];
  target_customer?: string;
  competitors?: string[];
  available_capital?: number;
  inventory_units?: number;
  risk_tolerance?: RiskTolerance;
}

export function generateMarketingStrategy(i: MarketingInput): MarketingStrategy {
  const feats = (i.main_features || []).join(", ") || "durability, ease of use, space saving";
  const customer = i.target_customer || "organized home and small-office buyers who value simple, reliable solutions";
  return {
    product_candidate_id: i.product_candidate_id || i.product_name,
    product_name: i.product_name,
    positioning: `A dependable, no-fuss ${i.category.toLowerCase()} solution that does one job well.`,
    target_customer: customer,
    main_pain_point: "Clutter / wasted space / flimsy alternatives that fail quickly.",
    title_strategy: "Lead with the primary keyword + key benefit + pack count/size. Keep it readable, avoid keyword stuffing.",
    bullet_strategy: `Five benefit-led bullets covering ${feats}. Start each with a capitalized benefit phrase.`,
    image_strategy: "Clean white-background hero, then in-use lifestyle shots, scale/size reference, and what's-in-the-box.",
    infographic_strategy: "One infographic showing dimensions + materials, one showing the problem→solution.",
    a_plus_content_strategy: "Comparison chart vs flimsy alternatives, materials close-ups, and use-case modules.",
    pricing_strategy: `Launch slightly below the category median to win early sales, then test raising toward $${round(i.sale_price)}. Avoid a race to the bottom.`,
    coupon_strategy: "Small launch coupon (5–10%) to lift conversion and early velocity; remove once organic rank stabilizes.",
    ppc_strategy: "Auto + manual exact/phrase/broad + competitor product targeting; harvest winners to exact (see PPC Manager).",
    organic_ranking_strategy: "Drive early sales velocity on 3–5 core keywords, keep ACOS controlled, and maintain in-stock status.",
    competitor_differentiation: i.competitors?.length ? `Differentiate from ${i.competitors.join(", ")} on materials, pack count, or a clearer size guide.` : "Differentiate on materials, pack count, and clearer sizing than typical listings.",
    review_strategy: [
      "Use Amazon's 'Request a Review' button on all orders (policy-compliant).",
      "Add a neutral, policy-compliant packaging insert focused on product use and support — never asking for positive reviews.",
      "Request reviews from ALL buyers, not only happy ones.",
      "Never offer discounts, gifts, or incentives for reviews.",
      "Never ask specifically for positive reviews or use review-manipulation services.",
    ],
    launch_plan_30_days: [
      "Publish a fully optimized listing (title, bullets, images, A+).",
      "Start PPC small (auto + low manual) to gather conversion data.",
      "Use Request-a-Review on every order; monitor for quality issues.",
    ],
    launch_plan_60_days: [
      "Harvest converting terms to exact; prune wasted spend.",
      "Test a small price increase if conversion is healthy.",
      "Expand images/A+ based on customer questions.",
    ],
    launch_plan_90_days: [
      "Scale profitable exact campaigns within target ACOS.",
      "Add product-targeting on weaker competitors.",
      "Plan reorder based on sell-through and lead time.",
    ],
    capital_allocation: i.available_capital
      ? `With ~$${i.available_capital}, keep a reserve, fund inventory first, then a disciplined PPC test budget (see Capital Planner).`
      : "Fund inventory first, keep a reserve, then a disciplined PPC test budget (see Capital Planner).",
    warnings: [PPC_DISCLAIMER, "All review tactics above are Amazon-policy-compliant. Do not use incentivized or manipulated reviews."],
  };
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
