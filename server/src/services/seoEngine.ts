import { db } from "../db/database.js";

function newId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export interface KeywordOpportunity {
  keyword: string;
  searchVolumeEstimate: number;
  competitionScore: number;
  opportunityScore: number;
  relevanceScore: number;
  monthlyRevenuePotential: number;
  currentRank?: number;
  recommendedBid?: number;
}

export interface ListingAudit {
  asin?: string;
  title: string;
  titleScore: number;
  bulletsScore: number;
  descriptionScore: number;
  backendKeywordsScore: number;
  imageScore: number;
  overallScore: number;
  issues: string[];
  recommendations: string[];
  optimizedTitle?: string;
  optimizedBullets?: string[];
}

export interface SEOReport {
  productId?: string;
  asin?: string;
  keywords: KeywordOpportunity[];
  audit: ListingAudit;
  competitorGaps: string[];
  actionPlan: string[];
  estimatedTrafficLift: string;
}

// Analyze a product listing for SEO issues
export function auditListing(product: {
  title?: string;
  bullets?: string[];
  description?: string;
  asin?: string;
  reviewCount?: number;
  category?: string;
}): ListingAudit {
  const title = product.title ?? "";
  const bullets = product.bullets ?? [];
  const description = product.description ?? "";

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Title analysis (max 200 chars, should have primary keyword in first 80 chars)
  let titleScore = 100;
  if (title.length < 50) { titleScore -= 20; issues.push("Title too short (< 50 chars)"); recommendations.push("Expand title to 150-200 characters with key features"); }
  if (title.length > 200) { titleScore -= 15; issues.push("Title exceeds 200 chars — may be truncated"); }
  if (!title.match(/[0-9]/)) { titleScore -= 10; recommendations.push("Add size/count/quantity to title for relevance"); }
  if (title === title.toLowerCase()) { titleScore -= 15; issues.push("Title not properly capitalized"); }
  if (!title.includes("|") && !title.includes(",") && !title.includes("-")) {
    recommendations.push("Use separators (|, -) to break up title features for readability");
  }

  // Bullets analysis (5 bullets, 200 chars each)
  let bulletsScore = 100;
  if (bullets.length < 5) { bulletsScore -= 25; issues.push(`Only ${bullets.length}/5 bullet points used`); recommendations.push("Add all 5 bullet points — each is a keyword opportunity"); }
  if (bullets.some(b => b.length < 50)) { bulletsScore -= 10; recommendations.push("Expand short bullets — each should be 100-200 characters with features and benefits"); }
  if (!bullets.some(b => /guarantee|warrant|return|satisf/i.test(b))) {
    bulletsScore -= 5;
    recommendations.push("Add satisfaction guarantee in bullets — reduces buyer hesitation");
  }

  // Description analysis
  let descriptionScore = 100;
  if (description.length < 200) { descriptionScore -= 30; issues.push("Description too short"); recommendations.push("Write a 500+ character description with brand story and use cases"); }

  // Backend keywords (estimated)
  const backendKeywordsScore = 70; // Unknown without actual listing access
  recommendations.push("Ensure 250 bytes of backend keywords with synonyms, misspellings, and related terms");

  // Image score (estimated — 7 images recommended)
  const imageScore = 70;
  recommendations.push("Ensure 7 images: hero white bg, lifestyle, infographic, size chart, comparison, close-up, video");

  const overallScore = Math.round((titleScore + bulletsScore + descriptionScore + backendKeywordsScore + imageScore) / 5);

  // Generate optimized title
  const category = product.category ?? "product";
  const optimizedTitle = title || `Premium ${category} — [Key Feature 1] | [Key Feature 2] | [Quantity/Size] — [Brand Promise] for [Use Case]`;

  return {
    asin: product.asin,
    title,
    titleScore: Math.max(0, titleScore),
    bulletsScore: Math.max(0, bulletsScore),
    descriptionScore: Math.max(0, descriptionScore),
    backendKeywordsScore: Math.max(0, backendKeywordsScore),
    imageScore: Math.max(0, imageScore),
    overallScore: Math.max(0, overallScore),
    issues,
    recommendations,
    optimizedTitle,
    optimizedBullets: [
      "[KEY BENEFIT 1]: [Feature] that [advantage] so you can [outcome]. Perfect for [use case].",
      "[KEY BENEFIT 2]: [Feature] with [spec] — [why it matters] for [target customer].",
      "[KEY BENEFIT 3]: [Durability/Quality claim]. [How tested/certified]. [Result for customer].",
      "[WHAT'S INCLUDED]: [Complete package contents]. [Setup time]. [Compatibility notes].",
      "YAMARI GROUP GUARANTEE: [Satisfaction policy]. Contact us anytime — we respond within 24h.",
    ],
  };
}

// Find keyword opportunities for a product
export async function findKeywordOpportunities(
  productTitle: string,
  category: string,
  asin?: string
): Promise<KeywordOpportunity[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-beta": "web-search-2025-03-05",
        },
        body: JSON.stringify({
          model: "claude-fable-5",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }],
          messages: [{
            role: "user",
            content: `I'm an Amazon seller with this product: "${productTitle}" in category: "${category}".
Search for the best Amazon keywords for this product. Look for:
1. High-volume keywords (search for "amazon search volume ${category} keywords")
2. Long-tail keywords with less competition
3. Competitor product keywords

Return JSON array of 10 keyword opportunities:
[{
  "keyword": "exact keyword phrase",
  "searchVolumeEstimate": 5000,
  "competitionScore": 0.65,
  "opportunityScore": 78,
  "relevanceScore": 0.9,
  "monthlyRevenuePotential": 15000,
  "recommendedBid": 1.25
}]

competitionScore: 0-1 (0=low competition, 1=high)
opportunityScore: 0-100 (higher is better)`,
          }],
        }),
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        let text = "";
        for (const block of (data.content ?? [])) {
          if (block.type === "text") text += block.text;
        }
        const match = text.match(/\[[\s\S]*?\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) {
            // Save to DB
            for (const kw of parsed) {
              try {
                db.prepare(`INSERT INTO keyword_rankings (id, asin, keyword, search_volume_estimate, competition_score, opportunity_score, relevance_score, source)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'seo_engine')`)
                  .run(newId(), asin ?? null, kw.keyword, kw.searchVolumeEstimate, kw.competitionScore, kw.opportunityScore, kw.relevanceScore);
              } catch { /* continue */ }
            }
            return parsed as KeywordOpportunity[];
          }
        }
      }
    } catch { /* fall through to mock */ }
  }

  // Mock keywords based on category
  const baseWords = productTitle.toLowerCase().split(" ").filter(w => w.length > 3).slice(0, 3);
  return [
    { keyword: `${baseWords[0] ?? category.toLowerCase()} for home`, searchVolumeEstimate: 8500, competitionScore: 0.45, opportunityScore: 85, relevanceScore: 0.95, monthlyRevenuePotential: 25000, recommendedBid: 1.10 },
    { keyword: `best ${baseWords[0] ?? "product"} 2025`, searchVolumeEstimate: 3200, competitionScore: 0.35, opportunityScore: 88, relevanceScore: 0.85, monthlyRevenuePotential: 9600, recommendedBid: 0.85 },
    { keyword: `${category.toLowerCase()} gifts`, searchVolumeEstimate: 12000, competitionScore: 0.72, opportunityScore: 62, relevanceScore: 0.70, monthlyRevenuePotential: 36000, recommendedBid: 1.45 },
    { keyword: `${baseWords[0] ?? "premium"} premium quality`, searchVolumeEstimate: 1800, competitionScore: 0.28, opportunityScore: 91, relevanceScore: 0.90, monthlyRevenuePotential: 5400, recommendedBid: 0.75 },
    { keyword: `${category.toLowerCase()} amazon`, searchVolumeEstimate: 22000, competitionScore: 0.88, opportunityScore: 45, relevanceScore: 0.80, monthlyRevenuePotential: 66000, recommendedBid: 2.10 },
  ];
}

// Generate full SEO report for a product
export async function generateSEOReport(product: {
  id?: string;
  asin?: string;
  title?: string;
  category?: string;
  bullets?: string[];
  description?: string;
  reviewCount?: number;
}): Promise<SEOReport> {
  const [audit, keywords] = await Promise.all([
    Promise.resolve(auditListing(product)),
    findKeywordOpportunities(product.title ?? "", product.category ?? "General", product.asin),
  ]);

  const competitorGaps = [
    "Competitor A ranks for 'gift for mom' — add to backend keywords",
    "Top sellers use 'premium quality' + 'lifetime warranty' in title",
    "Missing: holiday season keywords (add October-November)",
  ];

  const actionPlan = [
    `1. Fix title: ${audit.titleScore < 80 ? "URGENT" : "minor update"} — ${audit.recommendations[0] ?? "looks good"}`,
    `2. Add ${5 - (product.bullets?.length ?? 0)} missing bullet points with keywords`,
    `3. Target keyword: "${keywords[0]?.keyword ?? "top keyword"}" (${keywords[0]?.opportunityScore ?? 80}/100 opportunity)`,
    "4. Add Yamari Group brand story to description for trust signals",
    "5. Request 5-star reviews via Buyer-Seller Messaging at 4-day post-delivery",
  ];

  // Save audit to DB
  try {
    db.prepare(`INSERT INTO seo_audits (id, product_id, asin, title_score, bullets_score, description_score, backend_keywords_score, image_score, overall_score, issues, recommendations, optimized_title, optimized_bullets)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        newId(), product.id ?? null, product.asin ?? null,
        audit.titleScore, audit.bulletsScore, audit.descriptionScore,
        audit.backendKeywordsScore, audit.imageScore, audit.overallScore,
        JSON.stringify(audit.issues), JSON.stringify(audit.recommendations),
        audit.optimizedTitle, JSON.stringify(audit.optimizedBullets),
      );
  } catch { /* continue */ }

  return {
    productId: product.id,
    asin: product.asin,
    keywords,
    audit,
    competitorGaps,
    actionPlan,
    estimatedTrafficLift: `${audit.overallScore < 60 ? "150-300%" : audit.overallScore < 80 ? "40-80%" : "15-30%"} traffic increase from full optimization`,
  };
}

// Monitor Yamarigroup.com
export async function monitorYamariGroup(): Promise<{
  brandMentions: number;
  topKeywords: string[];
  seoOpportunities: string[];
  contentIdeas: string[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-beta": "web-search-2025-03-05",
        },
        body: JSON.stringify({
          model: "claude-fable-5",
          max_tokens: 1500,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }],
          messages: [{
            role: "user",
            content: `Search for "yamarigroup.com" and "Yamari Group" online. Find:
1. Any mentions, reviews, or references to yamarigroup.com
2. Amazon seller keywords that would benefit yamarigroup.com SEO
3. Content opportunities for an Amazon seller brand

Return JSON: { "brandMentions": 5, "topKeywords": ["amazon seller", "fba products"], "seoOpportunities": ["..."], "contentIdeas": ["..."] }`,
          }],
        }),
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        let text = "";
        for (const block of (data.content ?? [])) {
          if (block.type === "text") text += block.text;
        }
        const match = text.match(/\{[\s\S]*?\}/);
        if (match) {
          try { return JSON.parse(match[0]); } catch { /* fall through */ }
        }
      }
    } catch { /* fall through */ }
  }

  return {
    brandMentions: 0,
    topKeywords: ["yamari group amazon", "yamarigroup products", "amazon fba seller yamari"],
    seoOpportunities: [
      "Create 'About Yamari Group' page optimized for 'amazon private label seller'",
      "Add product catalog page linking to Amazon listings",
      "Blog: 'How Yamari Group sources quality products'",
      "Add schema markup: Organization + Product structured data",
    ],
    contentIdeas: [
      "Blog: Top 10 Home Organization Products by Yamari Group",
      "Blog: How We Source Quality Products from Global Suppliers",
      "Case Study: From Amazon FBA to Walmart Marketplace Expansion",
      "Guide: Yamari Group's Quality Control Process",
    ],
  };
}

export function getSEOHistory(asin?: string, limit = 20): any[] {
  if (asin) {
    return db.prepare("SELECT * FROM seo_audits WHERE asin = ? ORDER BY audited_at DESC LIMIT ?").all(asin, limit);
  }
  return db.prepare("SELECT * FROM seo_audits ORDER BY audited_at DESC LIMIT ?").all(limit);
}
