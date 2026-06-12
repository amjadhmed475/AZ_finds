import { useState, useEffect } from "react";

interface ReorderRec {
  asin: string;
  product_name: string;
  days_of_supply: number;
  recommended_qty: number;
  urgency: "critical" | "soon" | "plan";
  estimated_cost: number;
}

const URGENCY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  soon: "#f59e0b",
  plan: "#3b82f6",
};

export function ReorderAlerts() {
  const [recs, setRecs] = useState<ReorderRec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reorder-recommendations")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setRecs(Array.isArray(d) ? d : d.recommendations ?? []); })
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateOrder = () => {
    window.dispatchEvent(new CustomEvent("navigate:suppliers"));
  };

  return (
    <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--u-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)" }}>Reorder Alerts</div>
        {recs.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: "#ef4444",
            borderRadius: 6, padding: "2px 8px",
          }}>{recs.length}</span>
        )}
      </div>
      <div style={{ padding: "8px 0" }}>
        {loading && (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--u-muted)", fontSize: 13 }}>Loading...</div>
        )}
        {!loading && recs.length === 0 && (
          <div style={{ padding: "24px 20px", textAlign: "center", color: "var(--u-muted)", fontSize: 13 }}>
            All inventory levels nominal
          </div>
        )}
        {recs.map(rec => {
          const color = URGENCY_COLOR[rec.urgency] ?? "#3b82f6";
          return (
            <div key={rec.asin} style={{
              padding: "12px 16px",
              borderLeft: `3px solid ${color}`,
              borderBottom: "1px solid var(--u-border)",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {rec.product_name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: `${color}22`, color, borderRadius: 6, padding: "2px 7px" }}>
                    {rec.days_of_supply}d
                  </span>
                  <span style={{ fontSize: 11, color: "var(--u-muted)" }}>
                    Reorder {rec.recommended_qty.toLocaleString()} units · ~${rec.estimated_cost.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCreateOrder}
                style={{
                  fontSize: 11, padding: "5px 10px", background: color, color: "#fff",
                  border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, flexShrink: 0,
                }}
              >Create Order</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
