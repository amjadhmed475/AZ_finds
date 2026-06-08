import type { ProductCheck } from "../lib/types";

const ICON: Record<string, string> = { pass: "✓", fail: "✕", pending: "•" };

export function CheckIndicators({ checks }: { checks?: ProductCheck[] }) {
  if (!checks?.length) return <p className="muted small">No checks.</p>;
  return (
    <div className="checks">
      {checks.map((c, i) => (
        <span key={i} className={`check ${c.state}`} title={`${c.label}: ${c.state}`}>
          <b>{ICON[c.state]}</b> {c.label}
        </span>
      ))}
    </div>
  );
}
