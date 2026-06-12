import { useState } from "react";
import type { DashProduct } from "../lib/types";

interface Props { products: DashProduct[]; }

const GRADE_COLOR: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
};

function gradeColor(grade?: string): string {
  if (!grade) return "#64748b";
  return GRADE_COLOR[grade[0]] ?? "#64748b";
}

export function MobileProductList({ products }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = [...products].sort((a, b) => {
    const ga = a.grade?.score_out_of_100 ?? 0;
    const gb = b.grade?.score_out_of_100 ?? 0;
    return gb - ga;
  }).slice(0, 20);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, overflowY: "auto", flex: 1 }}>
      {sorted.map(p => {
        const grade = p.grade?.grade ?? "—";
        const color = gradeColor(grade);
        const isExpanded = expanded === p.id;

        return (
          <div
            key={p.id}
            onClick={() => setExpanded(isExpanded ? null : p.id)}
            style={{
              padding: "12px 16px", borderBottom: "1px solid var(--u-border)",
              cursor: "pointer", transition: "background 0.15s",
              background: isExpanded ? "var(--u-glass)" : "transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Grade badge */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: `${color}22`, color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, flexShrink: 0, border: `1px solid ${color}44`,
              }}>
                {grade}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "var(--u-text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--u-muted)", marginTop: 2 }}>{p.category}</div>
              </div>

              {/* ROI */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--u-neon-green)" }}>
                  {p.grade?.criteria_scores?.profit_strength ? `${Math.round(p.grade.criteria_scores.profit_strength)}%` : "—"}
                </div>
                <div style={{ fontSize: 10, color: "var(--u-muted)" }}>ROI</div>
              </div>

              <div style={{ color: "var(--u-dim)", fontSize: 14, flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Score", value: `${p.grade?.score_out_of_100 ?? "—"}/100` },
                  { label: "Risk", value: p.risk_level ?? "—", color: p.risk_level === "low" ? "#10b981" : p.risk_level === "medium" ? "#f59e0b" : "#ef4444" },
                  { label: "Monthly Sales", value: p.estimatedMonthlySales ? `${p.estimatedMonthlySales.toLocaleString()}` : "—" },
                  { label: "Price", value: p.estimatedSalePrice ? `$${p.estimatedSalePrice.toFixed(2)}` : "—" },
                  { label: "Sellers", value: p.seller_count ?? "—" },
                  { label: "Trend", value: p.trend_status ?? "—" },
                ].map(item => (
                  <div key={item.label} style={{ background: "var(--u-elevated)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.color ?? "var(--u-text)" }}>{item.value}</div>
                  </div>
                ))}
                {p.recommended_action && (
                  <div style={{ gridColumn: "span 2", background: "rgba(59,130,246,0.08)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--u-border)" }}>
                    <div style={{ fontSize: 10, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Action</div>
                    <div style={{ fontSize: 12, color: "var(--u-neon-cyan)" }}>{p.recommended_action}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
