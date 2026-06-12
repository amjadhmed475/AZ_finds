import { useState } from "react";
interface Props {
  name: string;
  color?: string;
  role?: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}
const sizeMap = { sm: 24, md: 32, lg: 48 };
export function TeamAvatar({ name, color = "#3b82f6", role, size = "md", online }: Props) {
  const [showTip, setShowTip] = useState(false);
  const px = sizeMap[size];
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <div style={{ width: px, height: px, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: px * 0.35, fontWeight: 700, color: "#fff", border: "2px solid rgba(255,255,255,0.1)", userSelect: "none" }}>
        {initials}
      </div>
      {online !== undefined && (
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: online ? "#10b981" : "#64748b", border: "2px solid var(--u-card)" }} />
      )}
      {showTip && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "var(--u-elevated)", border: "1px solid var(--u-border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, whiteSpace: "nowrap", color: "var(--u-text)", zIndex: 1000, pointerEvents: "none" }}>
          {name}{role && <span style={{ color: "var(--u-muted)", marginLeft: 6 }}>· {role}</span>}
        </div>
      )}
    </div>
  );
}

interface GroupProps { users: Array<{ name: string; color?: string; role?: string; online?: boolean }>; max?: number; }
export function TeamAvatarGroup({ users, max = 4 }: GroupProps) {
  const shown = users.slice(0, max);
  const rest = users.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((u, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }}>
          <TeamAvatar {...u} size="sm" />
        </div>
      ))}
      {rest > 0 && (
        <div style={{ marginLeft: -8, width: 24, height: 24, borderRadius: "50%", background: "var(--u-elevated)", border: "1px solid var(--u-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--u-muted)", zIndex: 0 }}>
          +{rest}
        </div>
      )}
    </div>
  );
}
