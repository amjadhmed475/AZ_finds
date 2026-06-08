import type { Citation } from "../lib/types";

export function SourceCitations({ citations }: { citations: Citation[] }) {
  if (!citations?.length) return <p className="muted">No citations attached.</p>;
  return (
    <ul className="citation-list">
      {citations.map((c, i) => {
        const rel = c.reliability_score;
        const color = rel >= 0.8 ? "#16a34a" : rel >= 0.5 ? "#d97706" : "#dc2626";
        const external = /^https?:/.test(c.source_url);
        return (
          <li key={i}>
            <span className="rel-dot" style={{ background: color }} title={`Reliability ${rel}`} />
            {external ? (
              <a href={c.source_url} target="_blank" rel="noopener noreferrer">{c.source_name}</a>
            ) : (
              <span>{c.source_name}</span>
            )}
            <span className="muted"> — {c.claim_supported}</span>
          </li>
        );
      })}
    </ul>
  );
}
