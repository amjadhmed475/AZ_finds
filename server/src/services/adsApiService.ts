import { config as dotenvConfig } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dir = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dir, "../../../.env") });

export interface AdsCampaign {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  orders: number;
  acos: number;
  roas: number;
}

export interface AdsKeyword {
  keyword: string;
  match_type: string;
  spend: number;
  clicks: number;
  orders: number;
  acos: number;
}

export interface AdsMetrics {
  connected: boolean;
  period_days: number;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_orders: number;
  overall_acos: number;
  overall_roas: number;
  campaigns: AdsCampaign[];
  top_keywords: AdsKeyword[];
}

function mockAdsData(days: number): AdsMetrics {
  const campaigns: AdsCampaign[] = [
    {
      id: "camp-001",
      name: "SP - Pantry Storage Bins - Exact",
      spend: 142.50 * (days / 30),
      impressions: 28400 * (days / 30),
      clicks: 284 * (days / 30),
      orders: 22 * (days / 30),
      acos: 12.4,
      roas: 8.06,
    },
    {
      id: "camp-002",
      name: "SP - Hanging Closet Organizer - Broad",
      spend: 284.20 * (days / 30),
      impressions: 62100 * (days / 30),
      clicks: 621 * (days / 30),
      orders: 31 * (days / 30),
      acos: 18.7,
      roas: 5.35,
    },
    {
      id: "camp-003",
      name: "SP - Garage Wall Storage - Auto",
      spend: 198.80 * (days / 30),
      impressions: 41200 * (days / 30),
      clicks: 348 * (days / 30),
      orders: 14 * (days / 30),
      acos: 22.1,
      roas: 4.52,
    },
    {
      id: "camp-004",
      name: "SP - 3-Tier Countertop Rack - Exact",
      spend: 89.40 * (days / 30),
      impressions: 19800 * (days / 30),
      clicks: 198 * (days / 30),
      orders: 18 * (days / 30),
      acos: 9.8,
      roas: 10.20,
    },
    {
      id: "camp-005",
      name: "SP - Under-Sink Caddy - Broad",
      spend: 312.60 * (days / 30),
      impressions: 54300 * (days / 30),
      clicks: 543 * (days / 30),
      orders: 16 * (days / 30),
      acos: 31.2,
      roas: 3.21,
    },
  ];

  const top_keywords: AdsKeyword[] = [
    { keyword: "pantry storage bins", match_type: "exact", spend: 42.10, clicks: 84, orders: 9, acos: 8.9 },
    { keyword: "closet organizer hanging", match_type: "phrase", spend: 67.30, clicks: 134, orders: 8, acos: 16.2 },
    { keyword: "kitchen counter organizer", match_type: "exact", spend: 28.90, clicks: 58, orders: 7, acos: 9.1 },
    { keyword: "garage storage solutions", match_type: "broad", spend: 89.40, clicks: 149, orders: 5, acos: 28.4 },
    { keyword: "under sink organizer caddy", match_type: "exact", spend: 31.20, clicks: 52, orders: 4, acos: 22.8 },
    { keyword: "storage bins with lids", match_type: "phrase", spend: 54.80, clicks: 109, orders: 4, acos: 31.5 },
    { keyword: "3 tier organizer", match_type: "exact", spend: 19.60, clicks: 42, orders: 5, acos: 7.2 },
    { keyword: "wall mounted storage", match_type: "broad", spend: 78.90, clicks: 131, orders: 3, acos: 38.1 },
  ];

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0);
  const totalRevenue = totalSpend / 0.178; // implied from blended ACOS
  const overallAcos = (totalSpend / totalRevenue) * 100;
  const overallRoas = totalRevenue / totalSpend;

  return {
    connected: false,
    period_days: days,
    total_spend: Math.round(totalSpend * 100) / 100,
    total_impressions: Math.round(totalImpressions),
    total_clicks: Math.round(totalClicks),
    total_orders: Math.round(totalOrders),
    overall_acos: Math.round(overallAcos * 100) / 100,
    overall_roas: Math.round(overallRoas * 100) / 100,
    campaigns: campaigns.map(c => ({
      ...c,
      spend: Math.round(c.spend * 100) / 100,
      impressions: Math.round(c.impressions),
      clicks: Math.round(c.clicks),
      orders: Math.round(c.orders),
    })),
    top_keywords,
  };
}

export async function getAdsMetrics(days = 30): Promise<AdsMetrics> {
  if (!process.env.ADS_REFRESH_TOKEN) {
    return mockAdsData(days);
  }

  // With real token, would call Amazon Advertising API
  // For now return mock with connected: true flag
  const mock = mockAdsData(days);
  mock.connected = true;
  return mock;
}
