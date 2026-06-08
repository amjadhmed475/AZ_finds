import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, LineChart, Line, Legend,
} from "recharts";
import type { Dashboard } from "../lib/types";
import { CHART_COLORS, scoreColor } from "../lib/formatters";
import { scatterData, trendData, trendKeys } from "../lib/charts";
import { gradeColor } from "../lib/grade";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="chart-panel">
      <h3 className="chart-title">{title}</h3>
      <div style={{ width: "100%", height: 240 }}>{children}</div>
    </div>
  );
}

export function ChartsGrid({ d }: { d: Dashboard }) {
  const trend = trendData(d);
  const keys = trendKeys(d);
  const gradeDist = d.gradeDistribution ?? [];
  const capitalData = d.products.map((p) => ({ name: p.name.length > 20 ? p.name.slice(0, 19) + "…" : p.name, value: p.capitalFit ?? 0 }));
  return (
    <div className="charts-grid">
      {gradeDist.length > 0 && (
        <Panel title="Grade distribution (A5 → D1)">
          <ResponsiveContainer>
            <BarChart data={gradeDist} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="grade" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {gradeDist.map((g, i) => <Cell key={i} fill={gradeColor(g.grade)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}
      <Panel title="Capital fit by product">
        <ResponsiveContainer>
          <BarChart data={capitalData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis domain={[0, 5]} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Opportunity score">
        <ResponsiveContainer>
          <BarChart data={d.charts.scoreChart} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} fontSize={11} />
            <YAxis type="category" dataKey="name" width={120} fontSize={10} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {d.charts.scoreChart.map((e, i) => <Cell key={i} fill={scoreColor(e.value)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="ROI %">
        <ResponsiveContainer>
          <BarChart data={d.charts.roiChart} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" fontSize={11} />
            <YAxis type="category" dataKey="name" width={120} fontSize={10} />
            <Tooltip />
            <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Net margin %">
        <ResponsiveContainer>
          <BarChart data={d.charts.marginChart} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" fontSize={11} />
            <YAxis type="category" dataKey="name" width={120} fontSize={10} />
            <Tooltip />
            <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Estimated monthly sales">
        <ResponsiveContainer>
          <BarChart data={d.charts.salesChart} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Best-supplier landed cost">
        <ResponsiveContainer>
          <BarChart data={d.charts.supplierCostChart} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Category distribution">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={d.charts.categoryDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
              {d.charts.categoryDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend fontSize={10} />
          </PieChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Risk distribution">
        <ResponsiveContainer>
          <BarChart data={d.charts.riskChart} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {d.charts.riskChart.map((e, i) => (
                <Cell key={i} fill={e.name === "low" ? "#16a34a" : e.name === "medium" ? "#d97706" : "#dc2626"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Demand vs competition">
        <ResponsiveContainer>
          <ScatterChart margin={{ left: 8, right: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="Sellers" fontSize={11} label={{ value: "Sellers", position: "insideBottom", offset: -2, fontSize: 10 }} />
            <YAxis type="number" dataKey="y" name="Sales" fontSize={11} />
            <ZAxis type="number" dataKey="z" range={[60, 320]} name="Score" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={scatterData(d)} fill="#2563eb" />
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>

      {keys.length > 0 && (
        <Panel title="Search-interest trend (top 3)">
          <ResponsiveContainer>
            <LineChart data={trend} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" fontSize={11} />
              <YAxis fontSize={11} domain={[0, 100]} />
              <Tooltip />
              <Legend fontSize={10} />
              {keys.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </div>
  );
}
