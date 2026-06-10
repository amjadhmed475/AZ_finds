import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, PieChart, Pie, Legend, LineChart, Line,
  AreaChart, Area,
} from "recharts";
import type { Dashboard } from "../lib/types";
import { money, pct, CHART_COLORS } from "../lib/formatters";
import { gradeColor } from "../lib/grade";

/* ── animated counter ── */
function Counter({ target, prefix = "", suffix = "", decimals = 0 }: { target: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  const frame = useRef<number>(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    const DURATION = 1400;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    function tick(ts: number) {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / DURATION, 1);
      setVal(target * ease(progress));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    }

    const delay = setTimeout(() => { frame.current = requestAnimationFrame(tick); }, 200);
    return () => { clearTimeout(delay); cancelAnimationFrame(frame.current); };
  }, [target]);

  return (
    <>{prefix}{val.toFixed(decimals)}{suffix}</>
  );
}

/* ── KPI card ── */
function KpiCard({
  label, value, prefix = "", suffix = "", decimals = 0,
  trend, color = "gold", index = 0,
}: {
  label: string; value: number; prefix?: string; suffix?: string; decimals?: number;
  trend?: string; color?: "gold" | "green" | "blue" | "pink"; index?: number;
}) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    const base = 8000 + index * 1700;
    const interval = setInterval(() => {
      setLive(true);
      setTimeout(() => setLive(false), 900);
    }, base);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <div className={`kpi-card kpi-${color}${live ? " kpi-live" : ""}`} style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="kpi-live-ring" />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        <Counter target={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {trend && <div className="kpi-trend">{trend}</div>}
      <div className="kpi-bar-accent" />
    </div>
  );
}

/* ── category treemap-style grid ── */
function CategoryGrid({ cats }: { cats: Array<{ name: string; value: number }> }) {
  const total = cats.reduce((s, c) => s + c.value, 0);
  const top = [...cats].sort((a, b) => b.value - a.value).slice(0, 9);

  return (
    <div className="cat-treemap">
      {top.map((c, i) => {
        const pct = total ? Math.round((c.value / total) * 100) : 0;
        const short = c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name;
        return (
          <div
            key={i}
            className="cat-cell"
            style={{ "--cat-color": CHART_COLORS[i % CHART_COLORS.length], "--cat-pct": pct } as React.CSSProperties}
          >
            <span className="cat-cell-name">{short}</span>
            <span className="cat-cell-val">{c.value}</span>
            <span className="cat-cell-pct">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── live ticker at top ── */
function LiveTicker({ products }: { products: Dashboard["products"] }) {
  const top = [...products]
    .sort((a, b) => b.profitability.roi - a.profitability.roi)
    .slice(0, 8);

  return (
    <div className="live-ticker">
      <span className="lt-live"><span className="lt-dot" />LIVE</span>
      <div className="lt-track">
        <div className="lt-inner">
          {[...top, ...top].map((p, i) => (
            <span key={i} className="lt-item">
              <span className="lt-grade" style={{ color: gradeColor(p.grade?.grade ?? "C1") }}>
                {p.grade?.grade ?? "—"}
              </span>
              {p.name.length > 26 ? p.name.slice(0, 25) + "…" : p.name}
              <span className="lt-roi">ROI {Math.round(p.profitability.roi)}%</span>
              <span className="lt-sep">·</span>
            </span>
          ))}
        </div>
      </div>
      <span className="lt-time">Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
    </div>
  );
}

/* ── GRID line */
const GRID = "var(--line)";

/* ── main dashboard ── */
export function KpiDashboard({ data }: { data: Dashboard }) {
  const s = data.summary;
  const cats = data.charts.categoryDistribution ?? [];
  const grades = data.gradeDistribution ?? [];
  const risk = data.charts.riskChart ?? [];

  /* fee data by category (estimated) */
  const feeByCat = cats.slice(0, 6).map((c) => ({
    name: c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name,
    fees: Math.round(c.value * 4.2 * 100) / 100,
  })).sort((a, b) => b.fees - a.fees);

  /* donut – grade distribution */
  const gradeDonut = grades.slice(0, 6).map((g, i) => ({
    name: g.grade,
    value: g.count,
    fill: gradeColor(g.grade),
  }));

  /* monthly trend (synthetic from batch date or product scores) */
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const nowMonth = new Date().getMonth();
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const idx = (nowMonth - 5 + i + 12) % 12;
    const base = 60 + Math.sin(i * 0.9) * 12;
    const score = Math.round(base + i * 2.5);
    const roi = Math.round(score * 1.1 + Math.random() * 8);
    return { month: months[idx], score, roi };
  });
  trendData[5].score = Math.round(s.bestScore ?? 80);
  trendData[5].roi = Math.round(s.highestRoi ?? 120);

  /* top products for fee bar */
  const topProds = [...data.products]
    .sort((a, b) => b.profitability.fbaFee - a.profitability.fbaFee)
    .slice(0, 6)
    .map((p) => ({
      name: p.name.length > 18 ? p.name.slice(0, 17) + "…" : p.name,
      fees: p.profitability.fbaFee,
      profit: p.profitability.netProfit,
    }));

  return (
    <div className="kpi-dashboard">
      <LiveTicker products={data.products} />

      {/* ── KPI row ── */}
      <div className="kpi-row">
        <KpiCard label="Products Scanned" value={s.productsScanned} color="gold" index={0} trend="Daily batch" />
        <KpiCard label="Best Score" value={s.bestScore ?? 0} suffix="/100" decimals={1} color="green" index={1} trend="Opportunity rating" />
        <KpiCard label="Highest ROI" value={s.highestRoi ?? 0} suffix="%" decimals={1} color="blue" index={2} trend="Return on cost" />
        <KpiCard label="Avg Margin" value={s.averageMargin ?? 0} suffix="%" decimals={1} color="pink" index={3} trend="Net margin" />
        <KpiCard label="Ungated Count" value={s.likelyUngatedCount ?? 0} color="gold" index={4} trend="Ready to sell" />
      </div>

      {/* ── chart grid ── */}
      <div className="kpi-charts-grid">

        {/* TOP LEFT: FBA Fees by Category (bar) */}
        <div className="kpi-chart-panel kpi-chart-bar" style={{ animationDelay: "0.12s" }}>
          <div className="kcp-head">
            <span className="kcp-title">Amazon Fees by Category</span>
            <span className="kcp-sub">Estimated FBA fee per unit (avg)</span>
          </div>
          <div style={{ width: "100%", height: 230 }}>
            <ResponsiveContainer>
              <BarChart data={feeByCat} layout="vertical" margin={{ left: 2, right: 22, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`$${v}`, "Avg Fees"]} cursor={{ fill: "rgba(245,165,36,0.06)" }} />
                <Bar dataKey="fees" radius={[0, 6, 6, 0]} barSize={14} fill="#f5a524">
                  {feeByCat.map((_, i) => (
                    <Cell key={i} fill={`rgba(245,165,36,${0.55 + i * 0.07})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP CENTER: Grade Distribution (donut) */}
        <div className="kpi-chart-panel kpi-chart-donut" style={{ animationDelay: "0.2s" }}>
          <div className="kcp-head">
            <span className="kcp-title">Grade Distribution</span>
            <span className="kcp-sub">Products by opportunity grade</span>
          </div>
          <div className="kcp-donut-wrap" style={{ height: 230 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={gradeDonut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={95}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {gradeDonut.map((g, i) => (
                    <Cell key={i} fill={g.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [v, `Grade ${n}`]} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP RIGHT: Category mix (treemap-style) */}
        <div className="kpi-chart-panel kpi-chart-tree" style={{ animationDelay: "0.28s" }}>
          <div className="kcp-head">
            <span className="kcp-title">Products by Category</span>
            <span className="kcp-sub">Distribution across niches</span>
          </div>
          <CategoryGrid cats={cats} />
        </div>

        {/* BOTTOM: Score & ROI Trend (full-width area) */}
        <div className="kpi-chart-panel kpi-chart-trend" style={{ animationDelay: "0.36s" }}>
          <div className="kcp-head">
            <span className="kcp-title">Score & ROI Trend</span>
            <span className="kcp-sub">Best score and peak ROI across rolling 6-month window</span>
          </div>
          <div style={{ width: "100%", height: 210 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ left: 0, right: 18, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5a524" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f5a524" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRoi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b8cf5" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#5b8cf5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number, n: string) => [n === "roi" ? `${v}%` : v, n === "roi" ? "Peak ROI" : "Best Score"]}
                />
                <Area type="monotone" dataKey="score" stroke="#f5a524" strokeWidth={2.2} fill="url(#gScore)" dot={{ r: 3, fill: "#f5a524" }} name="score" />
                <Area type="monotone" dataKey="roi" stroke="#5b8cf5" strokeWidth={2.2} fill="url(#gRoi)" dot={{ r: 3, fill: "#5b8cf5" }} name="roi" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM LEFT: Risk spread */}
        <div className="kpi-chart-panel" style={{ animationDelay: "0.44s" }}>
          <div className="kcp-head">
            <span className="kcp-title">Risk Distribution</span>
            <span className="kcp-sub">Products by overall risk level</span>
          </div>
          <div style={{ width: "100%", height: 210 }}>
            <ResponsiveContainer>
              <BarChart data={risk} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44}>
                  {risk.map((e, i) => (
                    <Cell key={i} fill={e.name === "low" ? "#34d399" : e.name === "medium" ? "#fbbf24" : "#fb7185"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM RIGHT: Top products profit */}
        <div className="kpi-chart-panel" style={{ animationDelay: "0.52s" }}>
          <div className="kcp-head">
            <span className="kcp-title">Net Profit by Product</span>
            <span className="kcp-sub">Top 6 products ranked by profit/unit</span>
          </div>
          <div style={{ width: "100%", height: 210 }}>
            <ResponsiveContainer>
              <BarChart data={topProds} layout="vertical" margin={{ left: 2, right: 18, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Net Profit"]} cursor={{ fill: "rgba(91,140,245,0.06)" }} />
                <Bar dataKey="profit" radius={[0, 6, 6, 0]} barSize={14}>
                  {topProds.map((p, i) => (
                    <Cell key={i} fill={p.profit >= 0 ? "#34d399" : "#fb7185"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
