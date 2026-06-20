import { useState } from "react";
import { notify } from "./NotificationBus";

interface Alert { id: string; severity: string; category: string; title: string; body: string; recommendation: string; asin?: string; read: boolean; created_at: string; }
interface Props { alerts: Alert[]; onClose: () => void; onMarkAllRead: () => void; }

const SEVERITY_COLOR: Record<string, string> = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
const CATEGORY_ICON: Record<string, string> = { inventory: "📦", ppc: "📢", competitor: "⚔️", listing: "📋", opportunity: "💡" };

export function AlertDrawer({ alerts, onClose, onMarkAllRead }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const markRead = async (id: string) => {
    await fetch(`/api/alerts/${id}/read`, { method: "POST" });
  };

  const askMaximus = (alert: Alert) => {
    window.dispatchEvent(new CustomEvent("maximus:query", { detail: { query: `${alert.title}: ${alert.body} What should I do?` } }));
    onClose();
  };

  const timeAgo = (dt: string) => {
    const diff = Date.now() - new Date(dt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 990, backdropFilter: "blur(4px)" }} />
      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh", width: 420,
        background: "var(--u-deep)", borderLeft: "1px solid var(--u-border)",
        zIndex: 1000, display: "flex", flexDirection: "column",
        animation: "slideInRight 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--u-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--u-text)" }}>MAXIMUS Intelligence</div>
            <div style={{ fontSize: 12, color: "var(--u-muted)", marginTop: 2 }}>{alerts.filter(a => !a.read).length} unread</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onMarkAllRead} style={{ fontSize: 12, color: "var(--u-neon-blue)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>Mark all read</button>
            <button onClick={onClose} style={{ color: "var(--u-muted)", background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
        </div>

        {/* Alert list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {alerts.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--u-muted)", fontSize: 14 }}>No alerts — all systems nominal</div>
          )}
          {alerts.map(alert => {
            const color = SEVERITY_COLOR[alert.severity] ?? "#3b82f6";
            const isExpanded = expanded === alert.id;
            return (
              <div
                key={alert.id}
                onClick={() => { setExpanded(isExpanded ? null : alert.id); markRead(alert.id); }}
                style={{
                  padding: "14px 20px", borderBottom: "1px solid var(--u-border)",
                  borderLeft: `3px solid ${color}`, cursor: "pointer",
                  background: alert.read ? "transparent" : "var(--u-glass)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--u-glass-hi)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = alert.read ? "transparent" : "var(--u-glass)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 16 }}>{CATEGORY_ICON[alert.category] ?? "🔔"}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)", lineHeight: 1.4 }}>{alert.title}</div>
                      {!alert.read && <div style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color, marginLeft: 4, verticalAlign: "middle" }} />}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--u-muted)", flexShrink: 0, marginLeft: 8 }}>{timeAgo(alert.created_at)}</span>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: "var(--u-muted)", lineHeight: 1.6, marginBottom: 8 }}>{alert.body}</div>
                    <div style={{ fontSize: 13, color: "var(--u-neon-cyan)", fontStyle: "italic", lineHeight: 1.5, marginBottom: 12 }}>→ {alert.recommendation}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={e => { e.stopPropagation(); askMaximus(alert); }}
                        style={{ fontSize: 12, padding: "6px 12px", background: "var(--u-neon-blue)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                      >Ask MAXIMUS</button>
                      {alert.asin && (
                        <button
                          onClick={e => { e.stopPropagation(); notify.info(`Viewing ${alert.asin}`); }}
                          style={{ fontSize: 12, padding: "6px 12px", background: "var(--u-elevated)", color: "var(--u-text)", border: "1px solid var(--u-border)", borderRadius: 6, cursor: "pointer" }}
                        >View Product</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--u-border)", display: "flex", gap: 8 }}>
          <button
            onClick={() => { window.dispatchEvent(new CustomEvent("maximus:query", { detail: { query: "Generate today's morning intelligence brief" } })); onClose(); }}
            style={{ flex: 1, padding: "10px", background: "var(--u-neon-violet)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
          >Morning Brief</button>
        </div>
      </div>
    </>
  );
}
