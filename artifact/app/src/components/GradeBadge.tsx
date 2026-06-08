import type { Grade } from "../lib/types";
import { gradeColor, gradeBg, GRADE_LABELS } from "../lib/grade";

export function GradeBadge({ grade, size = "md" }: { grade?: Grade; size?: "sm" | "md" | "lg" }) {
  if (!grade) return <span className="grade-badge grade-na">—</span>;
  const dims = size === "lg" ? { w: 54, f: 22 } : size === "sm" ? { w: 34, f: 14 } : { w: 44, f: 18 };
  return (
    <span
      className="grade-badge"
      title={`${grade} — ${GRADE_LABELS[grade]}`}
      style={{ width: dims.w, height: dims.w, fontSize: dims.f, color: gradeColor(grade), background: gradeBg(grade), borderColor: gradeColor(grade) }}
    >
      {grade}
    </span>
  );
}
