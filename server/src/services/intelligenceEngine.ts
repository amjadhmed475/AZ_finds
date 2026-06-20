import { db, newId } from "../db/database.js";

export interface IntelAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "inventory" | "ppc" | "competitor" | "listing" | "opportunity";
  title: string;
  body: string;
  recommendation: string;
  asin?: string;
  data?: Record<string, unknown>;
  created_at: string;
  read: boolean;
}

// Seed some realistic alerts on startup
function seedAlerts() {
  const existing = db.prepare("SELECT COUNT(*) as c FROM intelligence_alerts").get() as { c: number };
  if (existing.c > 0) return;

  const alerts: Omit<IntelAlert, "id" | "created_at">[] = [
    {
      severity: "critical",
      category: "inventory",
      title: "Stockout Risk: Under-Sink Caddy",
      body: "Current inventory: 8 days of supply remaining at current velocity. Stockout projected before next reorder arrives.",
      recommendation: "Reorder 200 units immediately from your primary supplier. At 30-day lead time, order must be placed today.",
      asin: "B0DEMO005",
      data: { days_of_supply: 8, daily_velocity: 12 },
      read: false,
    },
    {
      severity: "warning",
      category: "ppc",
      title: "ACOS Spike: Hanging Closet Organizer",
      body: "ACOS increased from 14.2% to 31.8% over the past 5 days. Spend: $284. Revenue from ads: $893.",
      recommendation: "Pause low-converting keywords. Reduce bids on broad match terms by 25%. Focus budget on exact match converting terms.",
      asin: "B0DEMO002",
      data: { acos_now: 31.8, acos_prev: 14.2, spend: 284 },
      read: false,
    },
    {
      severity: "warning",
      category: "inventory",
      title: "Reorder Soon: Garage Wall Storage",
      body: "21 days of supply remaining. Standard lead time is 30 days. Reorder window opens in 9 days.",
      recommendation: "Plan reorder of 300 units within the next 7-9 days to maintain continuous supply.",
      asin: "B0DEMO003",
      data: { days_of_supply: 21, lead_time: 30 },
      read: false,
    },
    {
      severity: "info",
      category: "opportunity",
      title: "New Opportunity: Cable Management Box A5+",
      body: "MAXIMUS Scout identified a cable management category gap. Search volume 45k/mo, 3 sellers under 200 reviews, estimated margin 31%.",
      recommendation: "Add to watchlist and source samples from 3 suppliers. Target price point: $18.99-$22.99.",
      data: { search_volume: 45000, avg_reviews: 180, est_margin: 31 },
      read: false,
    },
    {
      severity: "info",
      category: "opportunity",
      title: "Morning Brief Ready",
      body: "Today's intelligence summary: Revenue tracking 8% ahead of last week. Under-Sink Caddy needs immediate attention. PPC efficiency down on 2 campaigns.",
      recommendation: "Review stockout alert first, then adjust PPC bids for Hanging Closet Organizer.",
      data: {},
      read: false,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO intelligence_alerts (id, severity, category, title, body, recommendation, asin, data, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' minutes'))
  `);

  alerts.forEach((a, i) => {
    insert.run(newId(), a.severity, a.category, a.title, a.body, a.recommendation, a.asin ?? null, JSON.stringify(a.data ?? {}), a.read ? 1 : 0, String(i * 15));
  });
}

seedAlerts();

export function getAlerts(limit = 50): IntelAlert[] {
  return (db.prepare(`SELECT * FROM intelligence_alerts ORDER BY created_at DESC LIMIT ?`).all(limit) as any[]).map(r => ({
    ...r, read: r.read === 1, data: r.data ? JSON.parse(r.data) : {},
  }));
}

export function getUnreadCount(): number {
  return ((db.prepare("SELECT COUNT(*) as c FROM intelligence_alerts WHERE read = 0").get() as any).c);
}

export function markRead(id: string) {
  db.prepare("UPDATE intelligence_alerts SET read = 1 WHERE id = ?").run(id);
}

export function markAllRead() {
  db.prepare("UPDATE intelligence_alerts SET read = 1").run();
}

export function addAlert(alert: Omit<IntelAlert, "id" | "created_at">) {
  db.prepare(`
    INSERT INTO intelligence_alerts (id, severity, category, title, body, recommendation, asin, data, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `).run(newId(), alert.severity, alert.category, alert.title, alert.body, alert.recommendation, alert.asin ?? null, JSON.stringify(alert.data ?? {}));
}
