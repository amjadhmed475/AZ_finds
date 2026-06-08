import type { RichRejected } from "../lib/types";
import { GradeBadge } from "./GradeBadge";

export function RejectedPanel({ rejected }: { rejected?: RichRejected[] }) {
  const list = rejected ?? [];
  return (
    <section>
      <h2 className="section-title">Rejected / avoid ({list.length})</h2>
      <div className="warn-banner">
        These items failed a quality gate or the restricted-category engine (supplements, food, drinks, cosmetics, skin-care liquids,
        medical, baby, batteries, hazmat, pesticides, chemicals, CBD/THC/nicotine/alcohol, weapons). They are shown, never hidden.
        Rejection is a conservative compliance/quality signal, not legal advice.
      </div>
      {list.length === 0 ? (
        <p className="muted">No rejected products in this run.</p>
      ) : (
        <div className="reject-grid">
          {list.map((r, i) => (
            <div className="reject-card" key={i}>
              <div className="reject-head">
                <span className="reject-x">✕</span>
                <div>
                  <div className="reject-name">{r.name}</div>
                  <div className="muted small">{r.category} · rule: {r.rejected_by_rule}</div>
                </div>
                {r.would_have_grade && <span className="reject-grade"><GradeBadge grade={r.would_have_grade} size="sm" /></span>}
              </div>
              <p className="reject-reason">{r.rejection_reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
