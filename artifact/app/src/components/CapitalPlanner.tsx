import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import type { CapitalPlan } from "../lib/types";
import { computeCapital, type CapitalInputs } from "../lib/ppc";
import { money, num, CHART_COLORS } from "../lib/formatters";

export function CapitalPlanner({ seed }: { seed?: CapitalPlan }) {
  const [v, setV] = useState<CapitalInputs>({
    total: seed?.total_available_capital ?? 10000,
    reservePct: 25,
    inventoryPct: 55,
    ppcPct: 15,
    samplePct: 3,
    shippingPct: 7,
    landedCost: seed ? Math.max(1, seed.inventory_budget / Math.max(1, seed.estimated_units_to_order)) : 3.5,
    salePrice: 18.99,
    netProfitBeforeAds: 6,
    risk: "low",
    testDays: 21,
  });
  const out = computeCapital(v);
  const set = (patch: Partial<CapitalInputs>) => setV({ ...v, ...patch });

  const fields: Array<[keyof CapitalInputs, string, number]> = [
    ["total", "Available capital ($)", 100],
    ["reservePct", "Reserve %", 1],
    ["inventoryPct", "Inventory %", 1],
    ["ppcPct", "PPC %", 1],
    ["samplePct", "Sample %", 1],
    ["shippingPct", "Shipping %", 1],
    ["landedCost", "Landed cost / unit ($)", 0.1],
    ["salePrice", "Sale price ($)", 0.5],
    ["netProfitBeforeAds", "Net profit before ads ($)", 0.5],
    ["testDays", "PPC test days", 1],
  ];

  const allocation = [
    { name: "Inventory", value: out.inventory },
    { name: "PPC", value: out.ppc },
    { name: "Reserve", value: out.reserve },
    { name: "Sample", value: out.sample },
    { name: "Shipping", value: out.shipping },
  ];

  return (
    <section>
      <div className="info-note">
        Capital math updates live as you type. Inventory ties up cash for weeks, so size your PPC test to your risk tolerance.
      </div>
      <div className="planner-layout">
        <div className="ppc-card">
          <h3>Inputs</h3>
          <div className="calc-inputs">
            {fields.map(([key, label, step]) => (
              <label className="calc-field" key={key}>
                <span>{label}</span>
                <input type="number" step={step} value={v[key] as number} onChange={(e) => set({ [key]: parseFloat(e.target.value) || 0 } as Partial<CapitalInputs>)} />
              </label>
            ))}
            <label className="calc-field">
              <span>Risk tolerance</span>
              <select value={v.risk} onChange={(e) => set({ risk: e.target.value as CapitalInputs["risk"] })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
          </div>
        </div>

        <div className="ppc-card">
          <h3>Plan</h3>
          <div className="modal-grid">
            <Out label="Inventory budget" value={money(out.inventory)} />
            <Out label="PPC budget" value={money(out.ppc)} />
            <Out label="Reserve" value={money(out.reserve)} />
            <Out label="Units to order" value={num(out.units)} accent="#2563eb" />
            <Out label="Safe test order qty" value={num(Math.min(out.units, Math.max(25, Math.floor(out.units * 0.4))))} />
            <Out label="Max safe daily ad spend" value={money(out.maxDaily)} />
            <Out label="Break-even units" value={num(out.breakEvenUnits)} />
            <Out label="Break-even ACOS" value={`${out.be}%`} />
            <Out label="Target ACOS" value={`${out.tAcos}%`} accent="#16a34a" />
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ marginTop: 16 }}>
        <div className="chart-panel">
          <h3 className="chart-title">Capital allocation</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {allocation.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(x: number) => money(x)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-panel">
          <h3 className="chart-title">Profit by sell-through</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={out.scenarios}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sell_through_percent" tickFormatter={(t) => `${t}%`} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(x: number) => money(x)} />
                <Legend />
                <Bar dataKey="gross_profit" name="Gross profit" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ad_spend" name="Ad spend" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_profit" name="Net profit" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {out.warnings.length > 0 && (
        <div className="warn-banner" style={{ marginTop: 16 }}>
          <b>Cashflow / risk warnings:</b>
          <ul style={{ margin: "6px 0 0 18px" }}>{out.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

function Out({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="modal-stat">
      <div className="modal-stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="modal-stat-label">{label}</div>
    </div>
  );
}
