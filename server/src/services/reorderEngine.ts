import { db } from "../db/database.js";

export interface ReorderRec {
  asin: string;
  product_name: string;
  days_of_supply: number;
  recommended_qty: number;
  urgency: "critical" | "soon" | "plan";
  best_supplier?: { id: string; name: string; unit_cost: number; lead_time: number };
  estimated_cost: number;
}

const MOCK_INVENTORY = [
  { asin: "B0DEMO005", product_name: "Under-Sink Caddy", days_of_supply: 8, daily_velocity: 12 },
  { asin: "B0DEMO003", product_name: "Garage Wall Storage", days_of_supply: 21, daily_velocity: 6 },
  { asin: "B0DEMO002", product_name: "Hanging Closet Organizer", days_of_supply: 28, daily_velocity: 9 },
];

export function getReorderRecommendations(): ReorderRec[] {
  return MOCK_INVENTORY
    .filter(p => p.days_of_supply < 45)
    .map(p => {
      const targetDays = 90;
      const recommendedQty = Math.max(100, (targetDays - p.days_of_supply) * p.daily_velocity);
      const urgency: ReorderRec["urgency"] = p.days_of_supply < 14 ? "critical" : p.days_of_supply < 30 ? "soon" : "plan";

      // Try to find a matching supplier product
      const supplierProduct = (db.prepare(`
        SELECT sp.*, s.name as supplier_name, s.lead_time_days
        FROM supplier_products sp
        JOIN suppliers s ON s.id = sp.supplier_id
        WHERE sp.asin = ? AND s.active = 1
        ORDER BY sp.unit_cost_usd ASC
        LIMIT 1
      `).get(p.asin) as any);

      return {
        asin: p.asin,
        product_name: p.product_name,
        days_of_supply: p.days_of_supply,
        recommended_qty: Math.round(recommendedQty),
        urgency,
        best_supplier: supplierProduct ? {
          id: supplierProduct.supplier_id,
          name: supplierProduct.supplier_name,
          unit_cost: supplierProduct.unit_cost_usd,
          lead_time: supplierProduct.lead_time_days ?? 30,
        } : undefined,
        estimated_cost: Math.round(recommendedQty * (supplierProduct?.unit_cost_usd ?? 4.5) * 100) / 100,
      };
    })
    .sort((a, b) => a.days_of_supply - b.days_of_supply);
}
