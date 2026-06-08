import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Dashboard } from "../lib/types";

export function ApiUsagePanel({ data }: { data: Dashboard }) {
  const api = data.apiUsage;
  if (!api) return <p className="muted">No API usage data in this batch.</p>;

  const usage = [
    { name: "Cache hits (reused)", value: api.cache_hits, color: "#16a34a" },
    { name: "Live API calls", value: api.api_calls_used_today, color: "#dc2626" },
    { name: "Calls saved vs full scan", value: api.estimated_calls_saved, color: "#2563eb" },
  ].filter((d) => d.value > 0);

  return (
    <section>
      <h2 className="section-title">Data sources &amp; API usage</h2>
      <div className="status-bar" style={{ marginBottom: 16 }}>
        <span className="status-pill est">{labelMode(api.data_mode)}</span>
        <span className="muted small status-note">Default is hybrid low-cost: paid calls reserved for top candidates and cached for the TTL window.</span>
        <span className="source-locks">
          {api.sources.map((s) => (
            <span key={s.name} className={`src ${s.connected ? "on" : "off"}`}>{s.connected ? "●" : "🔒"} {s.name}</span>
          ))}
        </span>
      </div>

      <div className="planner-layout">
        <div className="ppc-card">
          <h3>Usage today</h3>
          <div className="ppc-kpis">
            <Kpi label="Data mode" value={labelMode(api.data_mode)} />
            <Kpi label="API calls used" value={String(api.api_calls_used_today)} accent="#dc2626" />
            <Kpi label="Cache hits" value={String(api.cache_hits)} accent="#16a34a" />
            <Kpi label="Cache misses" value={String(api.cache_misses)} />
            <Kpi label="Calls saved" value={String(api.estimated_calls_saved)} accent="#2563eb" />
            <Kpi label="Max calls / day" value={String(api.max_api_calls)} />
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>
            Last refresh: {fmt(api.last_refresh)} · Next: {fmt(api.next_refresh)}
          </p>
        </div>
        <div className="ppc-card">
          <h3>Call efficiency</h3>
          <div style={{ height: 220 }}>
            {usage.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={usage} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                    {usage.map((u, i) => <Cell key={i} fill={u.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="muted small">No paid calls made — running fully on the estimate engine.</p>}
          </div>
        </div>
      </div>

      {api.warnings.length > 0 && (
        <div className="info-note" style={{ marginTop: 14 }}>{api.warnings.join(" ")}</div>
      )}
    </section>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="ppc-kpi"><div className="ppc-kpi-v" style={accent ? { color: accent } : undefined}>{value}</div><div className="ppc-kpi-l">{label}</div></div>;
}
function labelMode(m: string): string {
  return { estimate_engine_only: "Estimate engine only", hybrid_low_cost: "Hybrid low-cost", live_selected_only: "Live selected only", full_live_scan: "Full live scan" }[m] || m;
}
function fmt(iso: string): string { return iso ? iso.replace("T", " ").slice(0, 16) + " UTC" : "—"; }
