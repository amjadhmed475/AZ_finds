import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface Comment {
  id: string;
  content: string;
  type: string;
  user_name: string;
  avatar_color: string;
  user_role: string;
  created_at: string;
}

interface Props { productId: string; }

const TYPE_COLOR: Record<string, string> = {
  general: "#64748b",
  research: "#3b82f6",
  risk: "#ef4444",
  approved: "#10b981",
  rejected: "#ef4444",
};

const TYPE_OPTIONS = ["general", "research", "risk", "approved", "rejected"];

function timeAgo(dt: string): string {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export function CommentThread({ productId }: Props) {
  const { authHeader, hasUsers } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    try {
      const r = await fetch(`/api/products/${productId}/comments`, { headers: authHeader() });
      if (r.ok) setComments(await r.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ content: content.trim(), type }),
      });
      if (r.ok) {
        setContent("");
        await loadComments();
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Comment list */}
      {loading ? (
        <div style={{ padding: "16px", color: "var(--u-muted)", fontSize: 13 }}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ padding: "16px", color: "var(--u-muted)", fontSize: 13, textAlign: "center" }}>
          No comments yet — be the first
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {comments.map(c => {
            const typeColor = TYPE_COLOR[c.type] ?? "#64748b";
            const isApproved = c.type === "approved";
            return (
              <div key={c.id} style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--u-border)",
                background: isApproved ? "rgba(16,185,129,0.04)" : "transparent",
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", background: c.avatar_color || "#3b82f6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>
                    {initials(c.user_name || "?")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--u-text)" }}>{c.user_name}</span>
                      {c.user_role && <span style={{ fontSize: 11, color: "var(--u-muted)" }}>· {c.user_role}</span>}
                      <span style={{
                        fontSize: 10, fontWeight: 700, background: `${typeColor}22`, color: typeColor,
                        borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>{c.type}</span>
                      {isApproved && <span style={{ color: "#10b981", fontSize: 14 }}>✓</span>}
                      <span style={{ fontSize: 11, color: "var(--u-muted)", marginLeft: "auto" }}>{timeAgo(c.created_at)}</span>
                    </div>
                    {/* Content */}
                    <div style={{ fontSize: 13, color: "var(--u-text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.content}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} style={{ padding: "12px 16px", borderTop: "1px solid var(--u-border)" }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          style={{
            width: "100%", background: "var(--u-elevated)", border: "1px solid var(--u-border)",
            color: "var(--u-text)", borderRadius: 8, padding: "8px 12px", fontSize: 13,
            resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          {!hasUsers ? null : (
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{
                background: "var(--u-elevated)", border: "1px solid var(--u-border)", color: "var(--u-muted)",
                borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none",
              }}
            >
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            style={{
              marginLeft: "auto", padding: "6px 16px", background: content.trim() ? "var(--u-neon-blue)" : "var(--u-elevated)",
              color: content.trim() ? "#fff" : "var(--u-muted)", border: "none", borderRadius: 6,
              cursor: content.trim() ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600,
            }}
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
