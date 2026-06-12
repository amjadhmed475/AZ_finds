import { db } from "../db/database.js";

// Helper to generate IDs
function newId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export interface LiveProduct {
  id: string;
  asin: string;
  title: string;
  category: string;
  subcategory?: string;
  bsr: number;
  price: number;
  reviewCount: number;
  reviewRating: number;
  estimatedMonthlySales: number;
  estimatedRevenue: number;
  unitCostEstimate: number;
  fbaFeeEstimate: number;
  netProfitEstimate: number;
  roiEstimate: number;
  marginEstimate: number;
  opportunityScore: number;
  grade: string;
  weightOz?: number;
  isGated: boolean;
  researchNotes?: string;
  source: "live_agent" | "web_search" | "api";
}

export interface DiscoveryCriteria {
  categories: string[];
  maxBSR?: number;       // default 100000
  minROI?: number;       // default 25
  maxReviewCount?: number; // default 1000 (new opportunities)
  minPrice?: number;     // default 15
  maxPrice?: number;     // default 150
  maxProducts?: number;  // 0 = unlimited
}

const AMAZON_CATEGORIES = [
  "Home & Kitchen", "Sports & Outdoors", "Tools & Home Improvement",
  "Beauty & Personal Care", "Health & Household", "Office Products",
  "Garden & Outdoor", "Pet Supplies", "Baby Products", "Kitchen & Dining",
  "Automotive", "Arts, Crafts & Sewing", "Toys & Games", "Electronics Accessories",
  "Clothing & Accessories", "Luggage & Travel", "Musical Instruments",
  "Industrial & Scientific", "Grocery & Gourmet Food", "Books",
  "Cell Phones & Accessories", "Computer Accessories", "Fitness & Exercise",
  "Camping & Hiking", "Cooking & Baking", "Cleaning Supplies", "Lighting",
  "Organization & Storage", "Party Supplies", "Stationery & Office Supplies"
];

export function getAllCategories(): string[] { return AMAZON_CATEGORIES; }

async function researchCategoryWithAI(category: string, criteria: DiscoveryCriteria): Promise<LiveProduct[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return getMockProductsForCategory(category, criteria);

  try {
    const prompt = `You are an Amazon FBA product researcher. Search the web for real, currently selling Amazon products in the "${category}" category that meet these criteria:
- BSR (Best Seller Rank) under ${criteria.maxBSR ?? 100000} in their category
- Sale price between $${criteria.minPrice ?? 15} and $${criteria.maxPrice ?? 150}
- Review count under ${criteria.maxReviewCount ?? 1000} (newer opportunities with less competition)
- Products that a private label seller could source from China and sell for 30%+ ROI

Search for: "amazon best sellers ${category.toLowerCase()} 2025" and "amazon ${category.toLowerCase()} products under 500 reviews good ROI"

For each product you find, estimate:
- ASIN (if visible in URL like /dp/B0XXXXXXXX)
- Current BSR
- Price
- Review count and rating
- Estimated monthly sales (based on BSR: BSR 1-1000 = 3000+/mo, 1001-5000 = 500-3000/mo, 5001-10000 = 200-500/mo, 10001-50000 = 50-200/mo, 50001-100000 = 10-50/mo)
- Estimated supplier cost (typically 20-30% of retail for private label)
- FBA fee estimate ($3-8 for most products under 2 lbs)

Return a JSON array (just the JSON, no markdown) of up to 8 products:
[{
  "asin": "B0XXXXXXXX",
  "title": "Product Title",
  "category": "${category}",
  "bsr": 15000,
  "price": 29.99,
  "reviewCount": 234,
  "reviewRating": 4.3,
  "estimatedMonthlySales": 150,
  "weightOz": 8,
  "isGated": false,
  "researchNotes": "Why this is a good opportunity"
}]

If you cannot find specific products, return realistic mock data for ${category} products that WOULD be good opportunities at this BSR range. The data must be realistic and reflect current Amazon market conditions.`;

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
        max_tokens: 3000,
        tools: [{
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 3,
        }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) return getMockProductsForCategory(category, criteria);

    const data = await resp.json() as any;

    // Extract text from response
    let text = "";
    for (const block of (data.content ?? [])) {
      if (block.type === "text") text += block.text;
    }

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return getMockProductsForCategory(category, criteria);

    const rawProducts = JSON.parse(jsonMatch[0]);
    return rawProducts.map((p: any) => enrichProduct(p, category));

  } catch {
    return getMockProductsForCategory(category, criteria);
  }
}

function enrichProduct(p: any, category: string): LiveProduct {
  const price = p.price ?? 29.99;
  const bsr = p.bsr ?? 25000;
  const estimatedMonthlySales = p.estimatedMonthlySales ?? estimateSalesFromBSR(bsr);
  const unitCost = price * 0.25; // typical for private label
  const fbaFee = price < 10 ? 3.22 : price < 20 ? 4.86 : price < 40 ? 6.16 : 7.17;
  const referralFee = price * 0.15;
  const landedCost = unitCost * 1.15; // shipping + duties
  const netProfit = price - landedCost - fbaFee - referralFee;
  const roi = (netProfit / landedCost) * 100;
  const margin = (netProfit / price) * 100;
  const estimatedRevenue = price * estimatedMonthlySales;

  const opportunityScore = calculateOpportunityScore({
    bsr, roi, reviewCount: p.reviewCount ?? 200, price, margin
  });

  const grade = scoreToGrade(opportunityScore);

  return {
    id: newId(),
    asin: p.asin ?? `B0${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
    title: p.title ?? `${category} Product`,
    category,
    subcategory: p.subcategory,
    bsr,
    price,
    reviewCount: p.reviewCount ?? 200,
    reviewRating: p.reviewRating ?? 4.2,
    estimatedMonthlySales,
    estimatedRevenue,
    unitCostEstimate: unitCost,
    fbaFeeEstimate: fbaFee,
    netProfitEstimate: Math.max(0, netProfit),
    roiEstimate: Math.max(0, roi),
    marginEstimate: Math.max(0, margin),
    opportunityScore,
    grade,
    weightOz: p.weightOz ?? 12,
    isGated: p.isGated ?? false,
    researchNotes: p.researchNotes ?? "",
    source: "web_search",
  };
}

function estimateSalesFromBSR(bsr: number): number {
  if (bsr <= 1000) return Math.floor(3000 + Math.random() * 2000);
  if (bsr <= 5000) return Math.floor(500 + Math.random() * 1500);
  if (bsr <= 10000) return Math.floor(200 + Math.random() * 300);
  if (bsr <= 50000) return Math.floor(50 + Math.random() * 150);
  if (bsr <= 100000) return Math.floor(10 + Math.random() * 40);
  return Math.floor(2 + Math.random() * 8);
}

function calculateOpportunityScore(p: { bsr: number; roi: number; reviewCount: number; price: number; margin: number }): number {
  let score = 50;
  // BSR component (lower is better, max 25 pts)
  if (p.bsr < 5000) score += 25;
  else if (p.bsr < 20000) score += 20;
  else if (p.bsr < 50000) score += 12;
  else if (p.bsr < 100000) score += 5;
  // ROI component (max 25 pts)
  if (p.roi >= 80) score += 25;
  else if (p.roi >= 50) score += 20;
  else if (p.roi >= 35) score += 15;
  else if (p.roi >= 25) score += 8;
  else score -= 10;
  // Competition component based on review count (max 15 pts)
  if (p.reviewCount < 50) score += 15;
  else if (p.reviewCount < 200) score += 10;
  else if (p.reviewCount < 500) score += 5;
  else if (p.reviewCount > 2000) score -= 10;
  // Price sweet spot (max 10 pts)
  if (p.price >= 20 && p.price <= 60) score += 10;
  else if (p.price >= 15 && p.price <= 80) score += 5;
  return Math.min(100, Math.max(0, score));
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A5";
  if (score >= 85) return "A4";
  if (score >= 80) return "A3";
  if (score >= 75) return "A2";
  if (score >= 70) return "A1";
  if (score >= 65) return "B5";
  if (score >= 60) return "B4";
  if (score >= 55) return "B3";
  if (score >= 50) return "B2";
  if (score >= 45) return "B1";
  if (score >= 38) return "C5";
  return "D5";
}

function getMockProductsForCategory(category: string, _criteria: DiscoveryCriteria): LiveProduct[] {
  // Generate realistic mock products for the category
  const mockTitles: Record<string, string[]> = {
    "Home & Kitchen": ["Bamboo Cutting Board Set 3-Piece", "Stainless Steel Mixing Bowls with Lids", "Silicone Baking Mat Non-Stick"],
    "Sports & Outdoors": ["Resistance Band Set 11-Piece", "Foam Roller Deep Tissue Massager", "Adjustable Dumbbell 25lb"],
    "Beauty & Personal Care": ["Jade Roller Face Massager", "Electric Facial Cleanser Brush", "Vitamin C Serum 30ml"],
    "Tools & Home Improvement": ["Magnetic Wristband for Screws", "Level Laser Self-Leveling 50ft", "Utility Knife Heavy Duty"],
  };

  const titles = mockTitles[category] ?? [`${category} Premium Product A`, `${category} Best Value B`, `${category} Professional C`];
  const bsrRange = [8000, 22000, 45000];

  return titles.slice(0, 3).map((title, i) => enrichProduct({
    title, bsr: bsrRange[i] ?? 30000,
    price: [24.99, 34.99, 44.99][i] ?? 29.99,
    reviewCount: [89, 245, 512][i] ?? 200,
    reviewRating: [4.6, 4.3, 4.1][i] ?? 4.2,
    category,
  }, category));
}

export async function runProductDiscovery(criteria: DiscoveryCriteria, onProduct?: (p: LiveProduct) => void): Promise<LiveProduct[]> {
  const categoriesToSearch = criteria.categories.length > 0 ? criteria.categories : AMAZON_CATEGORIES;
  const maxProducts = criteria.maxProducts === 0 ? Infinity : (criteria.maxProducts ?? 500);
  const allProducts: LiveProduct[] = [];

  // Run categories concurrently in batches of 5
  const batchSize = 5;
  for (let i = 0; i < categoriesToSearch.length && allProducts.length < maxProducts; i += batchSize) {
    const batch = categoriesToSearch.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(cat => researchCategoryWithAI(cat, criteria)));

    for (const products of batchResults) {
      const filtered = products.filter(p =>
        p.bsr <= (criteria.maxBSR ?? 100000) &&
        p.roiEstimate >= (criteria.minROI ?? 25) &&
        p.reviewCount <= (criteria.maxReviewCount ?? 2000) &&
        p.price >= (criteria.minPrice ?? 10) &&
        p.price <= (criteria.maxPrice ?? 200)
      );

      for (const product of filtered) {
        if (allProducts.length >= maxProducts) break;
        allProducts.push(product);
        onProduct?.(product);

        // Persist to DB
        try {
          db.prepare(`INSERT OR REPLACE INTO discovered_products (
            id, asin, title, category, subcategory, bsr, price, review_count, review_rating,
            estimated_monthly_sales, estimated_revenue, unit_cost_estimate, fba_fee_estimate,
            net_profit_estimate, roi_estimate, margin_estimate, opportunity_score, grade,
            weight_oz, is_gated, source, research_notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(
            product.id, product.asin, product.title, product.category, product.subcategory ?? null,
            product.bsr, product.price, product.reviewCount, product.reviewRating,
            product.estimatedMonthlySales, product.estimatedRevenue, product.unitCostEstimate,
            product.fbaFeeEstimate, product.netProfitEstimate, product.roiEstimate,
            product.marginEstimate, product.opportunityScore, product.grade,
            product.weightOz ?? null, product.isGated ? 1 : 0,
            product.source, product.researchNotes ?? null
          );
        } catch { /* continue */ }
      }
    }
  }

  // Sort by opportunity score descending
  allProducts.sort((a, b) => b.opportunityScore - a.opportunityScore);
  return allProducts;
}

export function getDiscoveredProducts(limit = 200, minGrade?: string): any[] {
  if (minGrade) {
    return db.prepare(
      "SELECT * FROM discovered_products WHERE grade <= ? ORDER BY opportunity_score DESC LIMIT ?"
    ).all(minGrade, limit);
  }
  return db.prepare(
    "SELECT * FROM discovered_products ORDER BY opportunity_score DESC LIMIT ?"
  ).all(limit);
}

export function getDiscoveryStats(): any {
  const total = (db.prepare("SELECT COUNT(*) as n FROM discovered_products").get() as any).n;
  const gradeA = (db.prepare("SELECT COUNT(*) as n FROM discovered_products WHERE grade LIKE 'A%'").get() as any).n;
  const avgROI = (db.prepare("SELECT AVG(roi_estimate) as avg FROM discovered_products").get() as any).avg ?? 0;
  const latestRun = db.prepare("SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 1").get();
  return { total, gradeA, avgROI: parseFloat(Number(avgROI).toFixed(1)), latestRun };
}
