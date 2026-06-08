import { scoreColor, scoreGrade } from "../lib/formatters";

export function ScoreBadge({ score, size = 44 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 12, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: `${color}18`, border: `1.5px solid ${color}`, color, flexShrink: 0,
      }}
      title={`Opportunity score ${score}/100`}
    >
      <span style={{ fontWeight: 800, fontSize: size * 0.34, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: size * 0.18, fontWeight: 700, opacity: 0.8 }}>{scoreGrade(score)}</span>
    </div>
  );
}

export function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="summary-card">
      <div className="summary-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="summary-label">{label}</div>
    </div>
  );
}
