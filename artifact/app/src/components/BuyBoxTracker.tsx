import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";
import type { Dashboard } from "../lib/types";

/* ── Mock Buy Box data ───────────────────────────────────── */
const MOCK_BB: Array<{
  asin: string; name: string; status: "winning" | "losing-fba" | "losing-fbm" | "sole";
  winPct: number; yourPrice: number; bbPrice: number; competitors: number;
  action: string; priority: "HIGH" | "MED" | "LOW"; monthlySales: number;
}> = [
  { asin: "B08X3Y4Z",  name: "Bamboo Cutting Board Set",     status: "winning",    winPct: 91, yourPrice: 34.99, bbPrice: 34.99, competitors: 2, action: "Stable — hold price",       priority: "LOW",  monthlySales: 420 },
  { asin: "B09K7M2N",  name: "Stainless Hooks 6pk",          status: "losing-fba", winPct: 38, yourPrice: 18.99, bbPrice: 17.49, competitors: 5, action: "Lower $1.50 to win BB",    priority: "HIGH", monthlySales: 380 },
  { asin: "B07QW9R1",  name: "Silicone Baking Mat 3pk",      status: "winning",    winPct: 78, yourPrice: 22.49, bbPrice: 22.49, competitors: 3, action: "Stable — monitor",          priority: "LOW",  monthlySales: 290 },
  { asin: "B0BX4T5P",  name: "Wall-Mount Spice Rack",        status: "losing-fba", winPct: 45, yourPrice: 27.99, bbPrice: 26.49, competitors: 4, action: "Lower $1.50 to tie BB",    priority: "HIGH", monthlySales: 260 },
  { asin: "B09YH3F8",  name: "Vacuum Storage Bags 8pk",      status: "winning",    winPct: 83, yourPrice: 19.99, bbPrice: 19.99, competitors: 6, action: "Stable",                    priority: "LOW",  monthlySales: 340 },
  { asin: "B08N2C4D",  name: "Drawer Organizer Set",         status: "losing-fbm", winPct: 22, yourPrice: 15.99, bbPrice: 14.99, competitors: 7, action: "Lower $1.00 or match",     priority: "MED",  monthlySales: 180 },
  { asin: "B0CX8M1K",  name: "Magnetic Knife Strip 16in",    status: "sole",       winPct: 100, yourPrice: 31.99, bbPrice: 31.99, competitors: 0, action: "Sole seller — test +$2",  priority: "MED",  monthlySales: 145 },
  { asin: "B07TR6N2",  name: "Pantry Storage Bins 6pk",      status: "winning",    winPct: 69, yourPrice: 24.99, bbPrice: 24.99, competitors: 4, action: "Stable",                    priority: "LOW",  monthlySales: 430 },
  { asin: "B09QP4H7",  name: "Cable Organizer Velcro 20pk",  status: "losing-fba", winPct: 31, yourPrice: 12.99, bbPrice: 11.49, competitors: 9, action: "Lower $1.50 — margin ok", priority: "HIGH", monthlySales: 510 },
  { asin: "B08Y5Z3W",  name: "Stackable Shoe Boxes 6pk",     status: "winning",    winPct: 74, yourPrice: 28.49, bbPrice: 28.49, competitors: 3, action: "Stable",                    priority: "LOW",  monthlySales: 195 },
  { asin: "B0BW9N3T",  name: "Pot Lid Organizer",            status: "losing-fbm", winPct: 44, yourPrice: 16.49, bbPrice: 15.99, competitors: 5, action: "Lower $0.50 to compete",   priority: "MED",  monthlySales: 220 },
  { asin: "B08QR2M5",  name: "Plastic Drawer Cabinet",       status: "winning",    winPct: 88, yourPrice: 42.99, bbPrice: 42.99, competitors: 2, action: "Stable",                    priority: "LOW",  monthlySales: 110 },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  "winning":    { label: "Winning",    color: "var(--p-green)", bg: "rgba(34,197,94,0.12)"   },
  "losing-fba": { label: "Lost (FBA)", color: "#f59e0b",        bg: "rgba(245,158,11,0.12)"  },
  "losing-fbm": { label: "Lost (FBM)", color: "var(--p-red)",   bg: "rgba(244,63,94,0.12)"   },
  "sole":       { label: "Sole",       color: "var(--p-blue)",  bg: "rgba(79,142,247,0.12)"  },
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  HIGH: { color: "var(--p-red)",   bg: "rgba(244,63,94,0.12)"  },
  MED:  { color: "#f59e0b",        bg: "rgba(245,158,11,0.12)" },
  LOW:  { color: "var(--p-green)", bg: "rgba(34,197,94,0.10)"  },
};

/* ── Sparkline history (mock 14d) ────────────────────────── */
const SPARK_HISTORY: Record<string, number[]> = {
  "B08X3Y4Z": [88,91,94,89,91,93,91,90,92,91,88,93,91,91],
  "B09K7M2N": [52,45,41,38,42,36,38,41,37,38,35,40,38,38],
  "B07QW9R1": [72,75,79,76,78,74,78,80,77,78,76,78,80,78],
};

function PriceSpark({ asin }: { asin: string }) {
  const d = (SPARK_HISTORY[asin] ?? Array.from({ length: 14 }, (_, i) => 60 + Math.sin(i) * 10)).map(
    (win, i) => ({ day: i + 1, win })
  );
  const color = d[d.length - 1].win >= 70 ? "var(--p-green)" : d[d.length - 1].win >= 50 ? "#f59e0b" : "var(--p-red)";
  return (
    <div style={{ background: "var(--p-raised)", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--p-t2)", marginBottom: 8 }}>
        {MOCK_BB.find(b => b.asin === asin)?.name ?? asin}
        <span style={{ fontSize: 10, color, marginLeft: 8 }}>{d[d.length - 1].win}% win rate</span>
      </div>
      <div style={{ height: 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={d} margin={{ left: -30, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="day" tick={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
            <Tooltip formatter={(v: number) => [`${v}%`, "Win Rate"]} />
            <Line type="monotone" dataKey="win" stroke={color} strokeWidth={1.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Repricing rules ─────────────────────────────────────── */
const RULES = [
  { name: "Match FBA Buy Box",       desc: "Stay $0.25 above FBA to maintain parity",             active: true,  asins: 4, impact: "+$420/mo" },
  { name: "Beat lowest FBM seller",  desc: "Price $0.10 below lowest competing FBM seller",        active: true,  asins: 3, impact: "+$180/mo" },
  { name: "Floor price protection",  desc: "Never drop below unit cost + 15% margin",              active: true,  asins: 12, impact: "Risk shield" },
];

/* ── Main component ──────────────────────────────────────── */
export function BuyBoxTracker({ data: _data }: { data: Dashboard }) {
  const [search, setSearch] = useState("");

  const filtered = MOCK_BB.filter(r =>
    search === "" || r.name.toLowerCase().includes(search.toLowerCase()) || r.asin.includes(search)
  );

  const winning  = MOCK_BB.filter(b => b.status === "winning" || b.status === "sole").length;
  const reprice  = MOCK_BB.filter(b => b.priority === "HIGH").length;
  const avgWin   = Math.round(MOCK_BB.reduce((s, b) => s + b.winPct, 0) / MOCK_BB.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Active ASINs",     val: String(MOCK_BB.length), color: "var(--p-t1)"    },
          { label: "Winning BB",       val: `${winning}/${MOCK_BB.length}`,  color: "var(--p-green)" },
          { label: "Avg Win Rate",     val: `${avgWin}%`,           color: "var(--p-gold)"  },
          { label: "Reprice Alerts",   val: String(reprice),        color: "var(--p-red)"   },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: "var(--p-t3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Buy Box table */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>Buy Box Status — All ASINs</div>
            <div style={{ fontSize: 11, color: "var(--p-t3)" }}>Real-time ownership and competitor pricing</div>
          </div>
          <input
            type="text"
            placeholder="Search ASIN or product…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--p-b2)", background: "var(--p-raised)", color: "var(--p-t1)", fontSize: 12, outline: "none", width: 200 }}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--p-b1)" }}>
                {["ASIN", "Product", "Status", "Win %", "Your $", "BB $", "Delta", "Comps", "Action", "Priority"].map(h => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--p-t3)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const ss = STATUS_STYLE[row.status];
                const ps = PRIORITY_STYLE[row.priority];
                const delta = row.yourPrice - row.bbPrice;
                return (
                  <tr key={row.asin} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "8px 8px", fontFamily: "monospace", fontSize: 11, color: "var(--p-t3)" }}>{row.asin}</td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t2)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.name.length > 22 ? row.name.slice(0, 21) + "…" : row.name}
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: ss.bg, color: ss.color }}>{ss.label}</span>
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 50, height: 5, background: "var(--p-b2)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${row.winPct}%`, background: row.winPct >= 70 ? "var(--p-green)" : row.winPct >= 40 ? "#f59e0b" : "var(--p-red)", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: row.winPct >= 70 ? "var(--p-green)" : row.winPct >= 40 ? "#f59e0b" : "var(--p-red)" }}>{row.winPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t2)" }}>${row.yourPrice.toFixed(2)}</td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t1)", fontWeight: 600 }}>${row.bbPrice.toFixed(2)}</td>
                    <td style={{ padding: "8px 8px", fontWeight: 600, color: delta <= 0 ? "var(--p-green)" : "var(--p-red)" }}>
                      {delta > 0 ? "+" : ""}{delta.toFixed(2)}
                    </td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t3)", textAlign: "center" }}>{row.competitors}</td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t3)", fontSize: 11, whiteSpace: "nowrap" }}>{row.action}</td>
                    <td style={{ padding: "8px 8px" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: ps.bg, color: ps.color }}>{row.priority}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price history sparklines */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)", marginBottom: 4 }}>14-Day Win Rate History</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)", marginBottom: 14 }}>Top 3 ASINs by monthly sales volume</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {Object.keys(SPARK_HISTORY).map(asin => (
            <PriceSpark key={asin} asin={asin} />
          ))}
        </div>
      </div>

      {/* Repricing rules */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)", marginBottom: 4 }}>Repricing Rules</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)", marginBottom: 14 }}>Active automation rules — adjust pricing to stay competitive</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RULES.map(rule => (
            <div key={rule.name} style={{ background: "var(--p-raised)", borderRadius: 9, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 20, background: rule.active ? "var(--p-green)" : "var(--p-b2)", borderRadius: 10, position: "relative", flexShrink: 0, cursor: "pointer" }}>
                <div style={{ position: "absolute", top: 3, left: rule.active ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--p-t1)" }}>{rule.name}</div>
                <div style={{ fontSize: 11, color: "var(--p-t3)", marginTop: 2 }}>{rule.desc}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "var(--p-green)", fontWeight: 600 }}>{rule.impact}</div>
                <div style={{ fontSize: 10, color: "var(--p-t3)" }}>{rule.asins} ASINs</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
