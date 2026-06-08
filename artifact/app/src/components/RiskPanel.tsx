import type { Risk } from "../lib/types";
import { riskColor } from "../lib/formatters";

const LABELS: Array<[keyof Risk, string]> = [
  ["overall_risk", "Overall"],
  ["category_risk", "Category"],
  ["IP_risk", "IP"],
  ["trademark_risk", "Trademark"],
  ["patent_risk", "Patent"],
  ["hazmat_risk", "Hazmat"],
  ["regulatory_risk", "Regulatory"],
  ["fragile_risk", "Fragile"],
  ["return_risk", "Returns"],
  ["saturation_risk", "Saturation"],
  ["price_war_risk", "Price war"],
];

export function RiskPanel({ risk }: { risk?: Risk }) {
  if (!risk) return <p className="muted">No risk data.</p>;
  return (
    <div>
      <div className="risk-badges">
        {LABELS.map(([key, label]) => {
          const level = String(risk[key] ?? "low");
          return (
            <span key={key} className="risk-badge" style={{ borderColor: riskColor[level] || "#cbd5e1", color: riskColor[level] || "#475569" }}>
              {label}: <b>{level}</b>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function ManualChecklist({ steps }: { steps: string[] }) {
  return (
    <ol className="checklist">
      {steps.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  );
}
