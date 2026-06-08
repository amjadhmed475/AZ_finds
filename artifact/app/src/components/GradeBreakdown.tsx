import type { ProductGrade } from "../lib/types";
import { CRITERIA_LABEL, CRITERIA_MAX, gradeColor, GRADE_LABELS } from "../lib/grade";
import { GradeBadge } from "./GradeBadge";

export function GradeBreakdown({ grade }: { grade?: ProductGrade }) {
  if (!grade) return <p className="muted">No grade for this product.</p>;
  const cs = grade.criteria_scores;
  const rows = Object.keys(CRITERIA_MAX).map((k) => ({
    key: k, label: CRITERIA_LABEL[k], score: (cs as any)[k] ?? 0, max: CRITERIA_MAX[k],
  }));

  return (
    <div>
      <div className="grade-head">
        <GradeBadge grade={grade.grade} size="lg" />
        <div>
          <div className="grade-title">{grade.grade} — {GRADE_LABELS[grade.grade]}</div>
          <div className="muted small">Score {grade.score_out_of_100}/100 · confidence: {grade.confidence_label}</div>
        </div>
      </div>

      <div className="why-grade">
        <div className="why-grade-title">Why this grade?</div>
        {rows.map((r) => (
          <div className="criteria-row" key={r.key} title={`${r.label}: ${r.score} of ${r.max}`}>
            <span className="criteria-label">{r.label}</span>
            <span className="criteria-bar">
              <span style={{ width: `${(r.score / r.max) * 100}%`, background: gradeColor(grade.grade) }} />
            </span>
            <span className="criteria-num">{r.score}/{r.max}</span>
          </div>
        ))}
      </div>

      <p className="muted small" style={{ marginTop: 10 }}>{grade.reason_summary} {grade.weakness_summary}</p>

      {grade.grade_caps_applied.length > 0 && (
        <div className="caps">
          <div className="caps-title">Grade caps applied</div>
          {grade.grade_caps_applied.map((c, i) => (
            <div key={i} className={`cap-row sev-${c.severity}`}>
              <b>{c.original_grade} → {c.capped_grade}</b> · {c.cap_reason}
              <div className="muted small">{c.explanation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
