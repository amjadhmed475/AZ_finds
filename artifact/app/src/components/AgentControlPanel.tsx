import { useState, useEffect, useCallback } from "react";
import { Icon } from "./Icon";

interface AgentStatus {
  running: boolean;
  lastRun: Record<string, string>;
  nextRun: Record<string, string>;
  currentTask: string | null;
  tasksCompleted: number;
  alertsGenerated: number;
}

interface AgentRun {
  id: string;
  task_type: string;
  status: string;
  products_found: number;
  products_graded: number;
  alerts_generated: number;
  summary: string;
  started_at: string;
  completed_at?: string;
}

interface DiscoveryStats {
  total: number;
  gradeA: number;
  avgROI: number;
  latestRun?: AgentRun;
}

const TASK_LABELS: Record<string, string> = {
  product_discovery: "Product Discovery",
  inventory_check: "Inventory Check",
  seo_monitor: "SEO Monitor",
  morning_brief: "Morning Brief",
  ppc_health: "PPC Health",
};

const TASK_ICONS: Record<string, string> = {
  product_discovery: "search",
  inventory_check: "box",
  seo_monitor: "target",
  morning_brief: "activity",
  ppc_health: "megaphone",
};

const STATUS_COLOR: Record<string, string> = {
  completed: "#10b981",
  running: "#3b82f6",
  error: "#ef4444",
  pending: "#f59e0b",
};

function timeAgo(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function timeUntil(dt: string): string {
  const diff = new Date(dt).getTime() - Date.now();
  if (diff <= 0) return "soon";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function AgentControlPanel() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerMsg, setTriggerMsg] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, runsRes, statsRes] = await Promise.all([
        fetch("/api/agent/status"),
        fetch("/api/agent/history"),
        fetch("/api/research/stats"),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (runsRes.ok) setRuns(await runsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 30000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const triggerTask = async (task: string) => {
    setTriggering(task);
    setTriggerMsg("");
    try {
      const r = await fetch("/api/agent/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const d = await r.json();
      setTriggerMsg(d.message ?? "Task triggered");
      setTimeout(() => { setTriggerMsg(""); fetchAll(); }, 4000);
    } catch { setTriggerMsg("Failed to trigger task"); }
    finally { setTriggering(null); }
  };

  const taskKeys = Object.keys(TASK_LABELS);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Products Discovered", val: stats?.total?.toLocaleString() ?? "—", icon: "grid", color: "var(--u-neon-blue)" },
          { label: "Grade A Opportunities", val: stats?.gradeA?.toLocaleString() ?? "—", icon: "star", color: "var(--u-neon-gold)" },
          { label: "Avg ROI", val: stats?.avgROI ? `${stats.avgROI.toFixed(0)}%` : "—", icon: "trending-up", color: "#10b981" },
          { label: "Tasks Completed", val: status?.tasksCompleted?.toLocaleString() ?? "—", icon: "check-circle", color: "var(--u-neon-violet)" },
        ].map(({ label, val, icon, color }) => (
          <div key={label} style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Icon name={icon} size={14} />
              <span style={{ fontSize: 11, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Agent Status + Tasks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        {/* Scheduled Tasks */}
        <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--u-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--u-text)" }}>Autonomous Tasks</div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: status?.running ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
              color: status?.running ? "#10b981" : "var(--u-muted)",
              borderRadius: 20, padding: "3px 10px"
            }}>
              {status?.running ? "● ACTIVE" : "○ IDLE"}
            </span>
          </div>
          {taskKeys.map(task => (
            <div key={task} style={{ padding: "14px 20px", borderBottom: "1px solid var(--u-border)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--u-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={TASK_ICONS[task] ?? "activity"} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)", marginBottom: 2 }}>{TASK_LABELS[task]}</div>
                <div style={{ fontSize: 11, color: "var(--u-muted)" }}>
                  {status?.lastRun[task] ? `Last: ${timeAgo(status.lastRun[task])}` : "Not yet run"}
                  {status?.nextRun[task] && ` · Next: ${timeUntil(status.nextRun[task])}`}
                </div>
              </div>
              <button
                onClick={() => triggerTask(task)}
                disabled={triggering === task}
                style={{
                  padding: "5px 12px", fontSize: 11, fontWeight: 600,
                  background: triggering === task ? "var(--u-elevated)" : "var(--u-neon-blue)",
                  color: triggering === task ? "var(--u-muted)" : "#fff",
                  border: "none", borderRadius: 6, cursor: triggering === task ? "not-allowed" : "pointer",
                  flexShrink: 0,
                }}
              >{triggering === task ? "Running…" : "Run Now"}</button>
            </div>
          ))}
          {triggerMsg && (
            <div style={{ padding: "10px 20px", background: "rgba(16,185,129,0.1)", fontSize: 12, color: "#10b981" }}>
              ✓ {triggerMsg}
            </div>
          )}
        </div>

        {/* Recent Run History */}
        <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--u-border)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--u-text)" }}>Run History</div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 340 }}>
            {runs.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--u-muted)", fontSize: 13 }}>
                No runs yet — tasks will start in ~30s
              </div>
            )}
            {runs.map(run => (
              <div key={run.id} style={{ padding: "11px 16px", borderBottom: "1px solid var(--u-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--u-text)" }}>
                    {TASK_LABELS[run.task_type] ?? run.task_type}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: STATUS_COLOR[run.status] ?? "var(--u-muted)",
                    background: `${STATUS_COLOR[run.status] ?? "#64748b"}22`,
                    borderRadius: 4, padding: "1px 6px"
                  }}>{run.status.toUpperCase()}</span>
                </div>
                {run.summary && (
                  <div style={{ fontSize: 11, color: "var(--u-muted)", lineHeight: 1.4 }}>{run.summary}</div>
                )}
                <div style={{ fontSize: 10, color: "var(--u-text-3)", marginTop: 3 }}>{timeAgo(run.started_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Task Indicator */}
      {status?.currentTask && (
        <div style={{
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: 12, padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#3b82f6",
            animation: "agentPulse 1s ease-in-out infinite"
          }} />
          <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600 }}>
            MAXIMUS is running: {TASK_LABELS[status.currentTask] ?? status.currentTask}
          </span>
        </div>
      )}
    </div>
  );
}
