import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

interface Task {
  id: string;
  product_title: string;
  description: string;
  priority: "urgent" | "high" | "normal" | "low";
  status: "pending" | "in_review" | "approved" | "rejected" | "more_info";
  assigned_to_name?: string;
  assigned_by_name?: string;
  due_date?: string;
  created_at: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  normal: "#3b82f6",
  low: "#64748b",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_review: "#3b82f6",
  approved: "#10b981",
  rejected: "#ef4444",
  more_info: "#8b5cf6",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  more_info: "Info Needed",
};

function isPastDue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ApprovalQueue() {
  const { can, authHeader } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const [tasksRes, countRes] = await Promise.all([
        fetch("/api/tasks", { headers: authHeader() }),
        fetch("/api/tasks/pending-count", { headers: authHeader() }),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (countRes.ok) { const d = await countRes.json(); setPendingCount(d.count ?? 0); }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateStatus = async (taskId: string, status: string) => {
    setUpdating(taskId);
    try {
      const r = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status }),
      });
      if (r.ok) await fetchTasks();
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_review");
  const recentTasks = tasks.filter(t => t.status === "approved" || t.status === "rejected");

  return (
    <div style={{ padding: "0 0 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--u-text)" }}>Approval Queue</div>
        {pendingCount > 0 && (
          <span style={{
            fontSize: 12, fontWeight: 700, background: "rgba(245,158,11,0.15)", color: "#f59e0b",
            borderRadius: 20, padding: "2px 10px",
          }}>{pendingCount} pending</span>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--u-muted)", fontSize: 14 }}>Loading tasks...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          {/* Pending Tasks */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Pending Tasks ({pendingTasks.length})
            </div>

            {pendingTasks.length === 0 ? (
              <div style={{
                background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16,
                padding: "40px 20px", textAlign: "center", color: "var(--u-muted)", fontSize: 14,
              }}>
                No pending approvals — all caught up ✓
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pendingTasks.map(task => {
                  const prioColor = PRIORITY_COLOR[task.priority] ?? "#64748b";
                  const statusColor = STATUS_COLOR[task.status] ?? "#64748b";
                  const pastDue = isPastDue(task.due_date);
                  const busy = updating === task.id;

                  return (
                    <div key={task.id} style={{
                      background: "var(--u-card)", border: "1px solid var(--u-border)",
                      borderRadius: 14, overflow: "hidden",
                      borderLeft: `3px solid ${prioColor}`,
                    }}>
                      <div style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--u-text)", marginBottom: 4 }}>{task.product_title}</div>
                            {task.description && (
                              <div style={{ fontSize: 12, color: "var(--u-muted)", lineHeight: 1.5 }}>{task.description}</div>
                            )}
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700, background: `${statusColor}22`, color: statusColor,
                            borderRadius: 6, padding: "2px 8px", marginLeft: 12, flexShrink: 0,
                            textTransform: "uppercase", letterSpacing: "0.04em",
                          }}>{STATUS_LABEL[task.status]}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--u-muted)", marginBottom: 12, flexWrap: "wrap" }}>
                          {task.assigned_by_name && <span>By: {task.assigned_by_name}</span>}
                          {task.assigned_to_name && <span>→ {task.assigned_to_name}</span>}
                          {task.due_date && (
                            <span style={{ color: pastDue ? "#ef4444" : "var(--u-muted)", fontWeight: pastDue ? 600 : 400 }}>
                              Due: {formatDate(task.due_date)}{pastDue ? " (OVERDUE)" : ""}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {can("canApprove") ? (
                            <>
                              <button
                                onClick={() => updateStatus(task.id, "approved")}
                                disabled={busy}
                                style={{ fontSize: 12, padding: "6px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                              >Approve</button>
                              <button
                                onClick={() => updateStatus(task.id, "rejected")}
                                disabled={busy}
                                style={{ fontSize: 12, padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                              >Reject</button>
                              <button
                                onClick={() => updateStatus(task.id, "more_info")}
                                disabled={busy}
                                style={{ fontSize: 12, padding: "6px 14px", background: "var(--u-elevated)", color: "var(--u-text)", border: "1px solid var(--u-border)", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                              >Need More Info</button>
                            </>
                          ) : (
                            <button
                              onClick={() => updateStatus(task.id, "in_review")}
                              disabled={busy}
                              style={{ fontSize: 12, padding: "6px 14px", background: "var(--u-elevated)", color: "var(--u-text)", border: "1px solid var(--u-border)", borderRadius: 6, cursor: "pointer" }}
                            >View Details</button>
                          )}
                          {busy && <span style={{ fontSize: 12, color: "var(--u-muted)", alignSelf: "center" }}>Updating...</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Recent Activity
            </div>
            <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 14, overflow: "hidden" }}>
              {recentTasks.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--u-muted)", fontSize: 13 }}>No recent activity</div>
              ) : (
                recentTasks.slice(0, 10).map((task, i) => {
                  const statusColor = STATUS_COLOR[task.status] ?? "#64748b";
                  return (
                    <div key={task.id} style={{
                      padding: "12px 16px",
                      borderBottom: i < recentTasks.length - 1 ? "1px solid var(--u-border)" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--u-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {task.product_title}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, background: `${statusColor}22`, color: statusColor,
                          borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", flexShrink: 0,
                        }}>{STATUS_LABEL[task.status]}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--u-muted)", marginTop: 3 }}>
                        {formatDate(task.created_at)}
                        {task.assigned_to_name && ` · ${task.assigned_to_name}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
