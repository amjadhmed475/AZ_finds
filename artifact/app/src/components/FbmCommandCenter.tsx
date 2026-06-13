import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from "recharts";
import type { Dashboard } from "../lib/types";
import { money, CHART_COLORS } from "../lib/formatters";

const GRID = "var(--line)";
const TARGET = 50_000;

/* ── FBM cost model ──────────────────────────────────────── */
function fbmCalc(p: Dashboard["products"][0]) {
  const oz = p.weight_oz ?? 12;
  const ship = oz <= 13 ? 4.50 : oz <= 32 ? 6.80 : oz <= 70 ? 9.20 : 14.50;
  const fulfill = ship + 0.65 + 0.90; // ship + packaging + labor
  const price = p.estimatedSalePrice;
  const net = price - p.profitability.unitCost - p.profitability.referralFee - fulfill;
  const margin = price > 0 ? (net / price) * 100 : 0;
  const roi = p.profitability.unitCost > 0 ? (net / p.profitability.unitCost) * 100 : 0;
  return { fulfill, net, margin, roi, ship };
}

/* ── Goal progress bar ───────────────────────────────────── */
function GoalTracker({ products }: { products: Dashboard["products"] }) {
  const dayOfMonth  = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const totalRevEst = useMemo(
    () => products.reduce((s, p) => s + (p.estimatedRevenue ?? 0), 0) * 0.62,
    [products]
  );

  const runRate   = dayOfMonth > 0 ? (totalRevEst / dayOfMonth) * daysInMonth : 0;
  const pct       = Math.min((totalRevEst / TARGET) * 100, 100);
  const gap       = Math.max(TARGET - totalRevEst, 0);
  const dailyNeed = gap > 0 ? gap / (daysInMonth - dayOfMonth + 1) : 0;
  const barColor  = pct >= 80 ? "var(--p-green)" : pct >= 50 ? "#f59e0b" : "var(--p-red)";

  return (
    <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--p-t3)", marginBottom: 4 }}>
            Monthly Revenue Goal
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--p-t1)", letterSpacing: "-0.03em" }}>{money(totalRevEst)}</span>
            <span style={{ fontSize: 15, color: "var(--p-t3)" }}>of {money(TARGET)} target</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: pct >= 80 ? "var(--p-green)" : pct >= 50 ? "#f59e0b" : "var(--p-red)" }}>
            {pct.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: "var(--p-t3)" }}>Day {dayOfMonth} of {daysInMonth}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 10, background: "var(--p-b2)", borderRadius: 6, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 6, transition: "width 1s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 10px ${barColor}55` }} />
      </div>

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 24 }}>
        {[
          ["Run Rate", money(runRate) + "/mo"],
          ["Daily Target", money(1_666.67)],
          ["Gap to $50k", gap > 0 ? money(gap) : "✓ Hit!"],
          ["Need/Day", gap > 0 ? money(dailyNeed) : "—"],
          ["Products", String(products.length)],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: "var(--p-t3)", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FBM vs FBA comparison table ────────────────────────── */
function MarginComparison({ products }: { products: Dashboard["products"] }) {
  const rows = useMemo(() =>
    [...products]
      .map(p => {
        const fbm = fbmCalc(p);
        const fbaDelta = fbm.net - p.profitability.netProfit;
        return { p, fbm, fbaDelta };
      })
      .sort((a, b) => b.fbm.net - a.fbm.net)
      .slice(0, 8),
    [products]
  );

  return (
    <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20, flex: 1 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>FBM vs FBA Margin</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)" }}>Net profit per unit under each model</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--p-b1)" }}>
              {["Product", "FBA Net", "FBM Net", "Delta", "Winner"].map(h => (
                <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--p-t3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, fbm, fbaDelta }, i) => {
              const fbmWins = fbaDelta > 0;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "8px 8px", color: "var(--p-t2)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name.length > 22 ? p.name.slice(0, 21) + "…" : p.name}
                  </td>
                  <td style={{ padding: "8px 8px", color: p.profitability.netProfit >= 0 ? "var(--p-green)" : "var(--p-red)", fontWeight: 600 }}>
                    {money(p.profitability.netProfit)}
                  </td>
                  <td style={{ padding: "8px 8px", color: fbm.net >= 0 ? "var(--p-green)" : "var(--p-red)", fontWeight: 600 }}>
                    {money(fbm.net)}
                  </td>
                  <td style={{ padding: "8px 8px", fontWeight: 600, color: fbmWins ? "var(--p-green)" : "var(--p-red)" }}>
                    {fbmWins ? "+" : ""}{money(fbaDelta)}
                  </td>
                  <td style={{ padding: "8px 8px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: fbmWins ? "rgba(34,197,94,0.12)" : "rgba(79,142,247,0.12)", color: fbmWins ? "var(--p-green)" : "var(--p-blue)" }}>
                      {fbmWins ? "FBM" : "FBA"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Buy Box pulse ───────────────────────────────────────── */
const BB_TREND = [
  { day: "Mon", win: 71 }, { day: "Tue", win: 68 }, { day: "Wed", win: 74 },
  { day: "Thu", win: 62 }, { day: "Fri", win: 69 }, { day: "Sat", win: 73 }, { day: "Sun", win: 66 },
];

function BuyBoxPulse() {
  return (
    <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>Buy Box Pulse</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)" }}>7-day win rate across all ASINs</div>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
        {[
          { label: "BB Win Rate", val: "68%", color: "var(--p-green)" },
          { label: "Lost to FBA", val: "24%", color: "#f59e0b" },
          { label: "Lost FBM", val: "8%", color: "var(--p-red)" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "var(--p-raised)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "var(--p-t3)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 110 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={BB_TREND} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--p-green)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="var(--p-green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [`${v}%`, "Win Rate"]} />
            <ReferenceLine y={70} stroke="var(--p-gold)" strokeDasharray="4 3" strokeWidth={1} label={{ value: "target", fontSize: 9, fill: "var(--p-gold)" }} />
            <Area type="monotone" dataKey="win" stroke="var(--p-green)" strokeWidth={2} fill="url(#bbGrad)" dot={{ r: 2.5, fill: "var(--p-green)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
        4 repricing opportunities — avg $0.45 drop wins Buy Box
      </div>
    </div>
  );
}

/* ── Account health scorecard ────────────────────────────── */
const HEALTH = [
  { label: "Order Defect Rate",     val: 0.52, limit: 1.0,   unit: "%", good: "low"  },
  { label: "Late Shipment Rate",    val: 1.8,  limit: 4.0,   unit: "%", good: "low"  },
  { label: "Valid Tracking Rate",   val: 97.4, limit: 95.0,  unit: "%", good: "high" },
  { label: "Cancellation Rate",     val: 0.31, limit: 0.50,  unit: "%", good: "low"  },
  { label: "Return Dissatisfaction",val: 4.1,  limit: 10.0,  unit: "%", good: "low"  },
  { label: "Invoice Defect Rate",   val: 0.0,  limit: 5.0,   unit: "%", good: "low"  },
];

function healthStatus(h: typeof HEALTH[0]) {
  if (h.good === "low") {
    const ratio = h.val / h.limit;
    if (ratio < 0.50) return { color: "var(--p-green)", label: "Healthy" };
    if (ratio < 0.80) return { color: "#f59e0b",        label: "Watch"   };
    return { color: "var(--p-red)", label: "At Risk" };
  } else {
    const ratio = h.val / h.limit;
    if (ratio >= 1.02) return { color: "var(--p-green)", label: "Healthy" };
    if (ratio >= 0.98) return { color: "#f59e0b",        label: "Watch"   };
    return { color: "var(--p-red)", label: "At Risk" };
  }
}

function AccountHealth() {
  return (
    <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>Account Health</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)" }}>Amazon seller performance metrics</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {HEALTH.map(h => {
          const { color, label } = healthStatus(h);
          return (
            <div key={h.label} style={{ background: "var(--p-raised)", borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--p-t3)", marginBottom: 3 }}>{h.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color }}>
                  {h.val.toFixed(h.val < 10 ? 2 : 1)}{h.unit}
                </div>
                <div style={{ fontSize: 9, color: "var(--p-t3)", marginTop: 2 }}>limit {h.limit}{h.unit}</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4, background: `${color}18`, color }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Shipping zone chart ─────────────────────────────────── */
const ZONE_DATA = [
  { zone: "Z1-2", cost: 4.50 }, { zone: "Z3-4", cost: 5.80 },
  { zone: "Z5-6", cost: 7.20 }, { zone: "Z7-8", cost: 9.40 },
];

function ShippingZones() {
  return (
    <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>Avg Shipping Cost by Zone</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)" }}>USPS/UPS blended rate — typical ≤1 lb order</div>
      </div>
      <div style={{ height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ZONE_DATA} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
            <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Avg Cost"]} />
            <Bar dataKey="cost" radius={[5, 5, 0, 0]} barSize={36}>
              {ZONE_DATA.map((_, i) => (
                <Cell key={i} fill={i < 2 ? "var(--p-green)" : i < 3 ? "#f59e0b" : "var(--p-red)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 11, color: "var(--p-t3)" }}>
        <span>Avg zone: <b style={{ color: "var(--p-t1)" }}>4.2</b></span>
        <span>Avg cost: <b style={{ color: "var(--p-t1)" }}>$6.45/order</b></span>
        <span style={{ color: "#f59e0b" }}>Heavy items → consider FBA for Z6+</span>
      </div>
    </div>
  );
}

/* ── Top FBM products table ──────────────────────────────── */
function TopFbmProducts({ products }: { products: Dashboard["products"] }) {
  const rows = useMemo(() =>
    [...products]
      .map(p => ({ p, fbm: fbmCalc(p) }))
      .sort((a, b) => b.fbm.net - a.fbm.net)
      .slice(0, 8),
    [products]
  );

  const rowColor = (margin: number) =>
    margin >= 25 ? "rgba(34,197,94,0.08)" : margin >= 15 ? "rgba(245,158,11,0.06)" : "rgba(244,63,94,0.06)";

  return (
    <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20, flex: 1 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>Top Products — FBM Ranking</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)" }}>Ranked by FBM net profit per unit</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--p-b1)" }}>
              {["#", "Product", "Wt", "FBM Margin", "FBM Profit", "Units/mo", "Mo. Profit", "Mode"].map(h => (
                <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--p-t3)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, fbm }, i) => {
              const fbmWins = fbm.net > p.profitability.netProfit;
              const units   = Math.round(p.estimatedMonthlySales ?? 0);
              const moPft   = fbm.net * units;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: rowColor(fbm.margin) }}>
                  <td style={{ padding: "7px 8px", color: "var(--p-t3)", fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: "7px 8px", color: "var(--p-t2)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name.length > 20 ? p.name.slice(0, 19) + "…" : p.name}
                  </td>
                  <td style={{ padding: "7px 8px", color: "var(--p-t3)" }}>{p.weight_oz ?? "?"}oz</td>
                  <td style={{ padding: "7px 8px", fontWeight: 700, color: fbm.margin >= 25 ? "var(--p-green)" : fbm.margin >= 15 ? "#f59e0b" : "var(--p-red)" }}>
                    {fbm.margin.toFixed(1)}%
                  </td>
                  <td style={{ padding: "7px 8px", fontWeight: 700, color: fbm.net >= 0 ? "var(--p-green)" : "var(--p-red)" }}>
                    {money(fbm.net)}
                  </td>
                  <td style={{ padding: "7px 8px", color: "var(--p-t2)" }}>{units.toLocaleString()}</td>
                  <td style={{ padding: "7px 8px", fontWeight: 600, color: moPft >= 0 ? "var(--p-t1)" : "var(--p-red)" }}>
                    {money(moPft)}
                  </td>
                  <td style={{ padding: "7px 8px" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: fbmWins ? "rgba(34,197,94,0.12)" : "rgba(79,142,247,0.12)", color: fbmWins ? "var(--p-green)" : "var(--p-blue)" }}>
                      {fbmWins ? "FBM ▲" : "FBA ▲"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function FbmCommandCenter({ data }: { data: Dashboard }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Goal tracker — full width */}
      <GoalTracker products={data.products} />

      {/* Row: Buy Box + Account Health + Shipping */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <BuyBoxPulse />
        <AccountHealth />
        <ShippingZones />
      </div>

      {/* Row: FBM vs FBA + Top products */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16 }}>
        <MarginComparison products={data.products} />
        <TopFbmProducts   products={data.products} />
      </div>
    </div>
  );
}
