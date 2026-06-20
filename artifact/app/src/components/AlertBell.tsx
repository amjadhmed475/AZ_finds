import { useState, useEffect, useCallback } from "react";
import { AlertDrawer } from "./AlertDrawer";
import { notify } from "./NotificationBus";

interface Alert { id: string; severity: string; category: string; title: string; body: string; recommendation: string; asin?: string; read: boolean; created_at: string; }

export function AlertBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [prevUnread, setPrevUnread] = useState(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const r = await fetch("/api/alerts");
      if (!r.ok) return;
      const { alerts: a, unread: u } = await r.json();
      setAlerts(a);
      // Show toast for new critical alerts
      if (u > prevUnread) {
        const newAlerts = a.filter((al: Alert) => !al.read && al.severity === "critical");
        if (newAlerts.length > 0) {
          notify.error(`MAXIMUS: ${newAlerts[0].title}`);
        }
      }
      setUnread(u);
      setPrevUnread(u);
    } catch {
      // silent
    }
  }, [prevUnread]);

  useEffect(() => {
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 60000);
    return () => clearInterval(iv);
  }, [fetchAlerts]);

  const hasCritical = alerts.some(a => !a.read && a.severity === "critical");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, transition: "background 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--u-glass)")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
        title="Intelligence Alerts"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={hasCritical ? "#ef4444" : "var(--u-muted)"} strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <div style={{
            position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8,
            background: hasCritical ? "#ef4444" : "#f59e0b", color: "#fff", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
            animation: hasCritical ? "bellPulse 1.5s ease-in-out infinite" : "none",
          }}>
            {unread > 99 ? "99+" : unread}
          </div>
        )}
      </button>
      {open && <AlertDrawer alerts={alerts} onClose={() => { setOpen(false); fetchAlerts(); }} onMarkAllRead={async () => { await fetch("/api/alerts/read-all", { method: "POST" }); fetchAlerts(); }} />}
    </>
  );
}
