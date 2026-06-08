import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  PieChart, Pie, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";
import type { Dashboard } from "../lib/types";
import { CHART_COLORS, scoreColor, money } from "../lib/formatters";
import { gradeColor } from "../lib/grade";

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="chart-panel">
      <h3 className="chart-title">{title}</h3>
      {sub && <p className="chart-sub">{sub}</p>}
      <div style={{ width: "100%", height: 260 }}>{children}</div>
    </div>
  );
}

const short = (n: string) => (n.length > 24 ? n.slice(0, 23) + "…" : n);
const GRID = "var(--line)";

export function ChartsGrid({ d }: { d: Dashboard }) {
  // one clean per-product table, then sort per chart — names always visible
  const P = d.products.map((p) => ({
    name: short(p.name),
    score: p.opportunity_score,
    roi: Math.round(p.profitability.roi),
    margin: Math.round(p.profitability.margin),
    profit: Math.round(p.profitability.netProfit * 100) / 100,
  }));
  const topBy = (key: "score" | "roi" | "profit", n = 10) => [...P].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, n);

  const grades = d.gradeDistribution ?? [];
  const risk = d.charts.riskChart ?? [];
  const cats = d.charts.categoryDistribution ?? [];
  const scatter = (d.charts.demandCompetitionScatter ?? []).map((s) => ({ x: s.competition, y: s.demand, z: s.score, name: s.name }));

  const HBar = (data: any[], dataKey: string, color: (v: any) => string, fmt?: (v: number) => string) => (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 18, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
        <XAxis type="number" tickFormatter={fmt as any} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => (fmt ? fmt(v) : v)} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey={dataKey} radius={[0, 5, 5, 0]} barSize={15}>
          {data.map((row, i) => <Cell key={i} fill={color(row)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="charts-grid">
      <Panel title="Grade distribution" sub="How many products earned each grade (A5 best → D1 worst). In estimate mode grades cap at B3 until you connect live data.">
        <ResponsiveContainer>
          <BarChart data={grades} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={34}>
              {grades.map((g, i) => <Cell key={i} fill={gradeColor(g.grade)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Top 10 by opportunity score" sub="Your best-ranked products overall (0–100), combining demand, profit, supplier, gating, risk and trend.">
        {HBar(topBy("score"), "score", (r) => scoreColor(r.score))}
      </Panel>

      <Panel title="Top 10 by ROI" sub="Return on each dollar of landed cost. Higher = more profit per dollar you put in.">
        {HBar(topBy("roi"), "roi", () => "#34d399", (v) => `${v}%`)}
      </Panel>

      <Panel title="Top 10 by net profit / unit" sub="Estimated profit per unit after Amazon fees, ads and returns.">
        {HBar(topBy("profit"), "profit", (r) => (r.profit >= 0 ? "#5b8cf5" : "#fb7185"), (v) => money(v))}
      </Panel>

      <Panel title="Risk spread" sub="How many products fall into each risk level. Fewer high-risk is better.">
        <ResponsiveContainer>
          <BarChart data={risk} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={48}>
              {risk.map((e, i) => <Cell key={i} fill={e.name === "low" ? "#34d399" : e.name === "medium" ? "#fbbf24" : "#fb7185"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Category mix" sub="Which product categories your batch is weighted toward.">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={cats} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={2}>
              {cats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Demand vs competition" sub="Each dot is a product. Bubble size = score. Top-left (high demand, few sellers) is the sweet spot.">
        <ResponsiveContainer>
          <ScatterChart margin={{ left: 4, right: 12, top: 8, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis type="number" dataKey="x" name="Sellers" tick={{ fontSize: 11 }} label={{ value: "Sellers (competition) →", position: "insideBottom", offset: -8, fontSize: 11, fill: "var(--dim)" }} />
            <YAxis type="number" dataKey="y" name="Monthly sales" tick={{ fontSize: 11 }} />
            <ZAxis type="number" dataKey="z" range={[50, 360]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v: number, n: string) => [v, n === "x" ? "Sellers" : n === "y" ? "Monthly sales" : "Score"]} />
            <Scatter data={scatter} fill="#f5a524" fillOpacity={0.78} />
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
