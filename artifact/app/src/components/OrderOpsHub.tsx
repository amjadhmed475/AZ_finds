import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine,
} from "recharts";

/* ── Mock order queue ────────────────────────────────────── */
interface MockOrder {
  id: string; product: string; asin: string; qty: number; state: string;
  shipBy: string; minsLeft: number; carrier: string; weight: number;
}

const ORDERS: MockOrder[] = [
  { id: "114-8823411-1", product: "Bamboo Cutting Board Set",    asin: "B08X3Y4Z", qty: 1, state: "TX", shipBy: "Today 5pm",  minsLeft: 87,  carrier: "USPS Priority", weight: 28 },
  { id: "114-9934721-3", product: "Stainless Hooks 6pk",         asin: "B09K7M2N", qty: 2, state: "CA", shipBy: "Today 5pm",  minsLeft: 87,  carrier: "USPS Priority", weight: 14 },
  { id: "112-3341290-7", product: "Vacuum Storage Bags 8pk",     asin: "B09YH3F8", qty: 1, state: "FL", shipBy: "Today 5pm",  minsLeft: 87,  carrier: "UPS Ground",    weight: 42 },
  { id: "114-2210882-9", product: "Pantry Storage Bins 6pk",     asin: "B07TR6N2", qty: 1, state: "NY", shipBy: "Today 5pm",  minsLeft: 87,  carrier: "USPS Priority", weight: 32 },
  { id: "113-7734521-4", product: "Silicone Baking Mat 3pk",     asin: "B07QW9R1", qty: 1, state: "IL", shipBy: "Today 9pm",  minsLeft: 327, carrier: "USPS Priority", weight: 18 },
  { id: "112-8821933-5", product: "Wall-Mount Spice Rack",        asin: "B0BX4T5P", qty: 1, state: "WA", shipBy: "Today 9pm",  minsLeft: 327, carrier: "UPS Ground",    weight: 38 },
  { id: "114-4412880-2", product: "Stackable Shoe Boxes 6pk",    asin: "B08Y5Z3W", qty: 2, state: "GA", shipBy: "Tmrw 12pm", minsLeft: 960, carrier: "UPS Ground",    weight: 54 },
  { id: "113-9923450-6", product: "Magnetic Knife Strip 16in",   asin: "B0CX8M1K", qty: 1, state: "OH", shipBy: "Tmrw 12pm", minsLeft: 960, carrier: "USPS Priority", weight: 20 },
];

/* ── SLA countdown timer ─────────────────────────────────── */
function SlaTimer({ minsLeft }: { minsLeft: number }) {
  const [mins, setMins] = useState(minsLeft);
  useEffect(() => {
    const iv = setInterval(() => setMins(m => Math.max(0, m - 1)), 60_000);
    return () => clearInterval(iv);
  }, []);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const color = mins < 120 ? "var(--p-red)" : mins < 360 ? "#f59e0b" : "var(--p-green)";
  return (
    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color }}>
      {h}h {String(m).padStart(2, "0")}m
    </span>
  );
}

/* ── Carrier rate table ──────────────────────────────────── */
const RATES = [
  { carrier: "USPS First Class",  service: "2–5 Day",   cost: 4.50,  transit: "2–5d", tracking: true, note: "≤ 15.9 oz",   best: false },
  { carrier: "USPS Priority",     service: "2–3 Day",   cost: 7.16,  transit: "2–3d", tracking: true, note: "Recommended", best: true  },
  { carrier: "FedEx Ground",      service: "3–5 Day",   cost: 8.23,  transit: "3–5d", tracking: true, note: "",            best: false },
  { carrier: "UPS Ground",        service: "3–5 Day",   cost: 8.45,  transit: "3–5d", tracking: true, note: "",            best: false },
];

/* ── 7-day volume chart ──────────────────────────────────── */
const VOLUME = [
  { day: "Mon", orders: 38 }, { day: "Tue", orders: 52 }, { day: "Wed", orders: 41 },
  { day: "Thu", orders: 47 }, { day: "Fri", orders: 63 }, { day: "Sat", orders: 29 }, { day: "Sun", orders: 47 },
];

/* ── Return requests ─────────────────────────────────────── */
const RETURNS = [
  { order: "114-3341892-1", product: "Stainless Hooks 6pk",   reason: "Item not as described", days: 2, refund: "Pending",   cost: 8.45  },
  { order: "113-7821044-5", product: "Bamboo Cutting Board",  reason: "Defective / damaged",   days: 4, refund: "Issued",    cost: 34.99 },
  { order: "112-9910023-8", product: "Vacuum Storage Bags",   reason: "Changed mind",           days: 1, refund: "Pending",   cost: 19.99 },
];

/* ── Main component ──────────────────────────────────────── */
export function OrderOpsHub() {
  const ordersToday   = 47;
  const toShip        = ORDERS.filter(o => o.minsLeft < 360).length;
  const shippedToday  = 24;
  const returnReqs    = 3;
  const urgentCount   = ORDERS.filter(o => o.minsLeft < 120).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Orders Today",    val: ordersToday,   color: "var(--p-t1)"    },
          { label: "To Ship (SLA)",   val: toShip,        color: "#f59e0b"        },
          { label: "Shipped Today",   val: shippedToday,  color: "var(--p-green)" },
          { label: "Return Requests", val: returnReqs,    color: "var(--p-red)"   },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: "var(--p-t3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* SLA countdown board */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>
              Orders Requiring Action
              {urgentCount > 0 && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, color: "var(--p-red)", background: "rgba(244,63,94,0.1)", padding: "2px 8px", borderRadius: 5 }}>⚡ {urgentCount} urgent</span>}
            </div>
            <div style={{ fontSize: 11, color: "var(--p-t3)" }}>FBM orders must ship within promised handling time</div>
          </div>
          <button style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid var(--p-gold-bd)", background: "var(--p-gold-bg)", color: "var(--p-gold)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Batch Print Labels
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--p-b1)" }}>
                {["Order #", "Product", "Qty", "Dest", "Ship By", "Time Left", "Carrier", "Weight"].map(h => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--p-t3)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDERS.map(o => {
                const rowBg = o.minsLeft < 120
                  ? "rgba(244,63,94,0.05)"
                  : o.minsLeft < 360
                  ? "rgba(245,158,11,0.04)"
                  : "transparent";
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: rowBg }}>
                    <td style={{ padding: "8px 8px", fontFamily: "monospace", fontSize: 11, color: "var(--p-t3)" }}>{o.id}</td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t2)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.product}</td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t2)", textAlign: "center" }}>{o.qty}</td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t3)" }}>{o.state}</td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t2)", whiteSpace: "nowrap" }}>{o.shipBy}</td>
                    <td style={{ padding: "8px 8px" }}><SlaTimer minsLeft={o.minsLeft} /></td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t3)", whiteSpace: "nowrap", fontSize: 11 }}>{o.carrier}</td>
                    <td style={{ padding: "8px 8px", color: "var(--p-t3)" }}>{o.weight}oz</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volume chart + Carrier rates */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>

        {/* 7-day volume */}
        <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)", marginBottom: 4 }}>7-Day Order Volume</div>
          <div style={{ fontSize: 11, color: "var(--p-t3)", marginBottom: 16 }}>Daily orders vs. $50k target pace (50 orders/day)</div>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VOLUME} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <ReferenceLine y={50} stroke="var(--p-gold)" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "target", fontSize: 9, fill: "var(--p-gold)" }} />
                <Bar dataKey="orders" radius={[5, 5, 0, 0]} barSize={28}>
                  {VOLUME.map((v, i) => (
                    <Cell key={i} fill={v.orders >= 50 ? "var(--p-green)" : v.orders >= 35 ? "#f59e0b" : "var(--p-red)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 20, fontSize: 11, color: "var(--p-t3)" }}>
            <span>7d avg: <b style={{ color: "var(--p-t1)" }}>45/day</b></span>
            <span>On-time rate: <b style={{ color: "var(--p-green)" }}>97.4%</b></span>
            <span>Return rate: <b style={{ color: "var(--p-green)" }}>2.1%</b></span>
          </div>
        </div>

        {/* Carrier rate comparison */}
        <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)", marginBottom: 4 }}>Carrier Rate Comparison</div>
          <div style={{ fontSize: 11, color: "var(--p-t3)", marginBottom: 14 }}>Typical order · 1 lb · Zone 4</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RATES.map(r => (
              <div key={r.carrier} style={{ background: r.best ? "var(--p-gold-bg)" : "var(--p-raised)", border: `1px solid ${r.best ? "var(--p-gold-bd)" : "transparent"}`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: r.best ? "var(--p-gold)" : "var(--p-t1)" }}>{r.carrier}</div>
                    <div style={{ fontSize: 10, color: "var(--p-t3)", marginTop: 2 }}>{r.service} · {r.transit} · {r.note || "Tracking included"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: r.best ? "var(--p-gold)" : "var(--p-t1)" }}>${r.cost.toFixed(2)}</div>
                    {r.best && <div style={{ fontSize: 9, color: "var(--p-gold)", fontWeight: 600 }}>BEST RATE</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(34,197,94,0.08)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.15)", fontSize: 11, color: "var(--p-green)" }}>
            💡 USPS Priority saves ~$1.29/order vs UPS Ground<br />
            <span style={{ color: "var(--p-t3)" }}>= <b style={{ color: "var(--p-green)" }}>~$730/month</b> at current 47 orders/day</span>
          </div>
        </div>
      </div>

      {/* Returns management */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>Return Requests</div>
            <div style={{ fontSize: 11, color: "var(--p-t3)" }}>Return rate 2.1% · Industry avg 5.4% · Top reason: Not as described (42%)</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--p-green)", fontWeight: 600 }}>Below average ✓</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RETURNS.map(r => (
            <div key={r.order} style={{ background: "var(--p-raised)", borderRadius: 9, padding: "13px 16px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--p-t1)" }}>{r.product}</div>
                <div style={{ fontSize: 11, color: "var(--p-t3)", marginTop: 3 }}>
                  Order {r.order} · <span style={{ color: "#f59e0b" }}>{r.reason}</span> · {r.days}d ago
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--p-t1)" }}>${r.cost.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: r.refund === "Issued" ? "var(--p-t3)" : "#f59e0b", marginTop: 2 }}>{r.refund}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {r.refund !== "Issued" && (
                  <button style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--p-b2)", background: "var(--p-card)", color: "var(--p-t2)", fontSize: 11, cursor: "pointer" }}>
                    Issue Refund
                  </button>
                )}
                <button style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--p-b2)", background: "var(--p-card)", color: "var(--p-t2)", fontSize: 11, cursor: "pointer" }}>
                  Request Photo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
