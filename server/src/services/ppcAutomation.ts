import { db } from "../db/database.js";

function newId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export interface PPCRecommendation {
  campaignId?: string;
  campaignName: string;
  keyword: string;
  matchType: string;
  currentBid: number;
  recommendedBid: number;
  currentAcos: number;
  targetAcos: number;
  action: "increase" | "decrease" | "pause" | "harvest" | "add_negative";
  rationale: string;
  estimatedImpact: string;
  priority: "urgent" | "high" | "normal";
}

export interface PPCSummary {
  totalSpend: number;
  totalSales: number;
  overallAcos: number;
  roas: number;
  campaigns: Array<{
    name: string;
    acos: number;
    spend: number;
    sales: number;
    status: "healthy" | "warning" | "critical";
  }>;
  recommendations: PPCRecommendation[];
  weeklyTrend: Array<{ date: string; acos: number; spend: number; sales: number }>;
}

// Generate PPC recommendations based on performance data
export function analyzePPC(_adsConnected = false): PPCSummary {
  // In production, this would read from Amazon Ads API via adsApiService
  // For now, generate intelligent recommendations from mock data

  const campaigns = [
    { name: "SP Auto - Home & Kitchen Launch", acos: 32.1, spend: 245.80, sales: 765.40, status: "healthy" as const },
    { name: "SP Manual - Exact Match Core Keywords", acos: 18.4, spend: 189.20, sales: 1028.30, status: "healthy" as const },
    { name: "SP Broad - Category Expansion", acos: 67.3, spend: 312.40, sales: 464.10, status: "critical" as const },
    { name: "SB Brand Defense", acos: 28.9, spend: 98.60, sales: 341.20, status: "warning" as const },
  ];

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalSales = campaigns.reduce((s, c) => s + c.sales, 0);
  const overallAcos = (totalSpend / totalSales) * 100;

  const recommendations: PPCRecommendation[] = [
    {
      campaignName: "SP Broad - Category Expansion",
      keyword: "home organization storage",
      matchType: "broad",
      currentBid: 1.45,
      recommendedBid: 0.85,
      currentAcos: 67.3,
      targetAcos: 35.0,
      action: "decrease",
      rationale: "ACoS 67.3% is nearly 2x break-even (35%). Reduce bid 41% to improve profitability while maintaining impressions.",
      estimatedImpact: "-$80/mo spend, ACoS target 35-40%",
      priority: "urgent",
    },
    {
      campaignName: "SP Manual - Exact Match Core Keywords",
      keyword: "bamboo cutting board",
      matchType: "exact",
      currentBid: 0.92,
      recommendedBid: 1.28,
      currentAcos: 18.4,
      targetAcos: 25.0,
      action: "increase",
      rationale: "ACoS 18.4% is well below target (25%). Increasing bid 39% will capture more top-of-page impressions and accelerate organic rank.",
      estimatedImpact: "+$120/mo sales, rank improvement weeks 2-4",
      priority: "high",
    },
    {
      campaignName: "SP Auto - Home & Kitchen Launch",
      keyword: "kitchen organizer set drawer",
      matchType: "auto",
      currentBid: 0,
      recommendedBid: 1.10,
      currentAcos: 32.1,
      targetAcos: 25.0,
      action: "harvest",
      rationale: "Auto campaign found this converting keyword (3.2% CVR). Move to manual exact match with aggressive bid to own this term.",
      estimatedImpact: "New exact match campaign, estimated 200+ impressions/day",
      priority: "high",
    },
    {
      campaignName: "SP Broad - Category Expansion",
      keyword: "cheap kitchen products",
      matchType: "broad",
      currentBid: 1.45,
      recommendedBid: 0,
      currentAcos: 0,
      targetAcos: 35.0,
      action: "add_negative",
      rationale: "Zero conversions in 30 days, 85 clicks spent. 'Cheap' signals price-focused buyers unlikely to convert at $34.99 price point.",
      estimatedImpact: "-$62/mo wasted spend",
      priority: "normal",
    },
  ];

  // Weekly trend (last 7 days)
  const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000);
    const variance = 0.85 + Math.random() * 0.3;
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      acos: Math.round(overallAcos * variance * 10) / 10,
      spend: Math.round(totalSpend / 7 * variance * 100) / 100,
      sales: Math.round(totalSales / 7 * variance * 100) / 100,
    };
  });

  // Save snapshot to DB
  for (const rec of recommendations) {
    try {
      db.prepare(`INSERT INTO ppc_snapshots (id, campaign_name, keyword, match_type, spend, sales, acos, roas, bid_current, bid_recommended, action_recommended)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(newId(), rec.campaignName, rec.keyword, rec.matchType, 0, 0, rec.currentAcos, rec.currentAcos > 0 ? 100 / rec.currentAcos : 0, rec.currentBid, rec.recommendedBid, rec.action);
    } catch { /* continue */ }
  }

  return { totalSpend, totalSales, overallAcos, roas: totalSales / totalSpend, campaigns, recommendations, weeklyTrend };
}

export function applyBidChange(keyword: string, newBid: number): { success: boolean; message: string } {
  // In production, this would call Amazon Ads API PUT /sp/keywords/{keywordId}
  // For now, update the DB snapshot and return success
  try {
    db.prepare("UPDATE ppc_snapshots SET bid_current = ? WHERE keyword = ?").run(newBid, keyword);
    return {
      success: true,
      message: `Bid for "${keyword}" updated to $${newBid.toFixed(2)}. Connect Amazon Ads API credentials to apply changes live.`
    };
  } catch {
    return { success: false, message: "Failed to update bid" };
  }
}

export function getPPCHistory(days = 30): any[] {
  return db.prepare("SELECT * FROM ppc_snapshots WHERE snapshot_date >= date('now', ?) ORDER BY snapshot_date DESC")
    .all(`-${days} days`);
}
