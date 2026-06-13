import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";

/* ── Health metrics ──────────────────────────────────────── */
const METRICS = [
  { key: "odr",  label: "Order Defect Rate",      val: 0.52,  limit: 1.0,  unit: "%", good: "low",  target: "< 1%"   },
  { key: "lsr",  label: "Late Shipment Rate",      val: 1.8,   limit: 4.0,  unit: "%", good: "low",  target: "< 4%"   },
  { key: "vtr",  label: "Valid Tracking Rate",     val: 97.4,  limit: 95.0, unit: "%", good: "high", target: "> 95%"  },
  { key: "cr",   label: "Cancellation Rate",       val: 0.31,  limit: 0.5,  unit: "%", good: "low",  target: "< 0.5%" },
  { key: "rdr",  label: "Return Dissatisfaction",  val: 4.1,   limit: 10.0, unit: "%", good: "low",  target: "< 10%"  },
  { key: "msg",  label: "Message Response <24hr",  val: 94.2,  limit: 90.0, unit: "%", good: "high", target: "> 90%"  },
];

function metricStatus(m: typeof METRICS[0]) {
  const ratio = m.good === "low" ? m.val / m.limit : m.limit / m.val;
  if (ratio < 0.55) return { color: "var(--p-green)", bg: "rgba(34,197,94,0.10)",  label: "Healthy"  };
  if (ratio < 0.85) return { color: "#f59e0b",        bg: "rgba(245,158,11,0.10)", label: "Watch"    };
  return              { color: "var(--p-red)",         bg: "rgba(244,63,94,0.10)",  label: "At Risk"  };
}

/* ── SVG arc gauge ───────────────────────────────────────── */
function ArcGauge({ m }: { m: typeof METRICS[0] }) {
  const { color } = metricStatus(m);
  // For "low-is-good": how used up the limit is (0→100%). For "high-is-good": how far above threshold.
  let fill: number;
  if (m.good === "low") {
    fill = Math.min(m.val / m.limit, 1);
  } else {
    // val=97.4, limit=95 → fill = (val - limit) / limit capped at 1, plus base
    fill = Math.min(m.val / 100, 1);
  }

  const RADIUS = 42;
  const STROKE = 6;
  const SIZE   = (RADIUS + STROKE) * 2;
  const C      = RADIUS + STROKE;
  const circumference = Math.PI * RADIUS; // half circle (180°)
  const dash   = fill * circumference;
  const gap    = circumference - dash;

  // danger zone fill (always full arc in faint red for "low" metrics, full green for "high")
  const bgColor = m.good === "low" ? "rgba(244,63,94,0.12)" : "rgba(34,197,94,0.10)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={SIZE} height={RADIUS + STROKE + 10} viewBox={`0 0 ${SIZE} ${RADIUS + STROKE + 10}`} overflow="visible">
        {/* Background arc */}
        <path
          d={`M ${STROKE} ${C} A ${RADIUS} ${RADIUS} 0 0 1 ${SIZE - STROKE} ${C}`}
          fill="none" stroke={bgColor} strokeWidth={STROKE} strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${STROKE} ${C} A ${RADIUS} ${RADIUS} 0 0 1 ${SIZE - STROKE} ${C}`}
          fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={`${dash} ${gap + circumference}`}
        />
        {/* Center value */}
        <text x={C} y={C - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
          {m.val.toFixed(m.val < 10 ? 2 : 1)}{m.unit}
        </text>
        <text x={C} y={C + 10} textAnchor="middle" fontSize="8" fill="var(--p-t3)">
          {m.target}
        </text>
      </svg>
      <div style={{ fontSize: 10, color: "var(--p-t3)", textAlign: "center", marginTop: 4, maxWidth: 90 }}>{m.label}</div>
    </div>
  );
}

/* ── 30-day performance history ──────────────────────────── */
const HISTORY = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  score: Math.round(88 + Math.sin(i * 0.4) * 3 + Math.cos(i * 0.7) * 2 + (i > 10 ? 1.5 : 0)),
}));
// Inject a couple of dips
HISTORY[5].score  = 89;
HISTORY[6].score  = 87;
HISTORY[18].score = 90;

/* ── SFP compliance ──────────────────────────────────────── */
const SFP = [
  { label: "On-Time Delivery",    current: 97.4,  required: 98.5, unit: "%" },
  { label: "Valid Tracking",      current: 97.4,  required: 99.0, unit: "%" },
  { label: "Cancellation Rate",   current: 0.31,  required: 0.5,  unit: "%", low: true },
  { label: "Carrier Compliance",  current: 100,   required: 100,  unit: "%", label2: "Approved labels" },
];

/* ── Alerts ──────────────────────────────────────────────── */
const ALERTS = [
  { level: "MED",  text: "Valid Tracking Rate down 2.1% this week. Confirm tracking on all shipments.", action: "Review shipments" },
  { level: "MED",  text: "ASIN B08X3Y4Z — 3 negative feedbacks this month. Audit listing accuracy.",     action: "View ASIN"       },
  { level: "LOW",  text: "4 buyer messages over 18hr old. Respond now to protect response rate metric.",  action: "Open messages"   },
];

/* ── Main component ──────────────────────────────────────── */
export function AccountHealthMonitor() {
  const overallScore = 94;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header score */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: "var(--p-green)", letterSpacing: "-0.04em", lineHeight: 1 }}>{overallScore}</div>
          <div style={{ fontSize: 11, color: "var(--p-t3)", marginTop: 4 }}>Account Health Score</div>
        </div>
        <div style={{ width: 1, height: 60, background: "var(--p-b1)" }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--p-green)" }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--p-green)" }}>Good Standing</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--p-t3)", lineHeight: 1.6 }}>
            All metrics within Amazon thresholds.<br />
            No active violations or warnings.
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
          {[
            { label: "Violations",       val: "0",   color: "var(--p-green)" },
            { label: "Warnings",         val: "3",   color: "#f59e0b"        },
            { label: "Last Incident",    val: "18d", color: "var(--p-t2)"    },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "var(--p-t3)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gauge grid */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)", marginBottom: 4 }}>Performance Metrics</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)", marginBottom: 20 }}>Live account health gauges — thresholds set by Amazon</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {METRICS.map(m => <ArcGauge key={m.key} m={m} />)}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--p-b1)" }}>
          {[
            { color: "var(--p-green)", label: "Healthy (< 55% of limit)" },
            { color: "#f59e0b",        label: "Watch (55–85% of limit)"  },
            { color: "var(--p-red)",   label: "At Risk (> 85% of limit)" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--p-t3)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block" }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* 30-day history + Alerts in 2 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>

        {/* History chart */}
        <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)", marginBottom: 4 }}>30-Day Health Score Trend</div>
          <div style={{ fontSize: 11, color: "var(--p-t3)", marginBottom: 16 }}>Last incident: 18 days ago — 2 late shipments</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HISTORY} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--p-green)" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="var(--p-green)" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: "Days ago", position: "insideBottom", fontSize: 9, fill: "var(--p-t3)" }} />
                <YAxis domain={[84, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [v, "Health Score"]} />
                <ReferenceLine y={85} stroke="var(--p-red)" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Min", fontSize: 9, fill: "var(--p-red)" }} />
                <Area type="monotone" dataKey="score" stroke="var(--p-green)" strokeWidth={2} fill="url(#scoreGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)", marginBottom: 4 }}>Watch Items</div>
          <div style={{ fontSize: 11, color: "var(--p-t3)", marginBottom: 14 }}>Proactive alerts before thresholds breach</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ALERTS.map((a, i) => {
              const c = a.level === "HIGH" ? "var(--p-red)" : a.level === "MED" ? "#f59e0b" : "var(--p-green)";
              return (
                <div key={i} style={{ background: "var(--p-raised)", borderRadius: 8, padding: "11px 13px", borderLeft: `3px solid ${c}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: c }}>{a.level}</span>
                    <span style={{ fontSize: 10, color: "var(--p-blue)", cursor: "pointer" }}>{a.action} →</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--p-t2)", lineHeight: 1.5 }}>{a.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SFP compliance */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)", marginBottom: 4 }}>Seller Fulfilled Prime (SFP) Readiness</div>
        <div style={{ fontSize: 11, color: "var(--p-t3)", marginBottom: 14 }}>Requirements to earn the Prime badge on FBM listings</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {SFP.map(s => {
            const ok = s.low
              ? s.current <= s.required
              : s.current >= s.required;
            const color = ok ? "var(--p-green)" : "#f59e0b";
            return (
              <div key={s.label} style={{ background: "var(--p-raised)", borderRadius: 9, padding: "14px 14px" }}>
                <div style={{ fontSize: 10, color: "var(--p-t3)", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>
                  {s.current.toFixed(s.current < 10 ? 2 : 1)}{s.unit}
                </div>
                <div style={{ fontSize: 10, color: "var(--p-t3)", marginTop: 4 }}>Required: {s.required}{s.unit}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: ok ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)", color }}>{ok ? "✓ Met" : "Needs work"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
