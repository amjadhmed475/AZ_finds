import { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = (p: string): { label: string; color: string; width: string } => {
    if (p.length === 0) return { label: "", color: "transparent", width: "0%" };
    if (p.length < 6) return { label: "Weak", color: "#ef4444", width: "25%" };
    if (p.length < 8) return { label: "Fair", color: "#f59e0b", width: "50%" };
    if (p.length < 12) return { label: "Good", color: "#3b82f6", width: "75%" };
    return { label: "Strong", color: "#10b981", width: "100%" };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "signin") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--u-elevated)",
    border: "1px solid var(--u-border)",
    color: "var(--u-text)",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    color: "var(--u-muted)",
    marginBottom: 6,
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--u-void)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Grid background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        pointerEvents: "none",
      }} />
      {/* Radial glow */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 600,
        background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "var(--u-card)",
        border: "1px solid var(--u-border)",
        borderRadius: 20,
        padding: 40,
        backdropFilter: "blur(var(--u-blur))",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--u-neon-gold)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            AZ Finds
          </div>
          <div style={{ fontSize: 13, color: "var(--u-muted)", marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Amazon Seller Command Center
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "var(--u-elevated)", borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {(["signin", "register"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              style={{
                flex: 1,
                padding: "8px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s",
                background: tab === t ? "var(--u-neon-blue)" : "transparent",
                color: tab === t ? "#fff" : "var(--u-muted)",
              }}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#fca5a5",
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {tab === "register" && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "var(--u-neon-blue)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--u-border)"; }}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "var(--u-neon-blue)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--u-border)"; }}
            />
          </div>

          <div style={{ marginBottom: tab === "register" && password.length > 0 ? 8 : 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "var(--u-neon-blue)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--u-border)"; }}
            />
          </div>

          {/* Password strength meter (register only) */}
          {tab === "register" && password.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ height: 3, background: "var(--u-elevated)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 2, transition: "all 0.3s" }} />
              </div>
              <div style={{ fontSize: 11, color: strength.color, marginTop: 4, textAlign: "right" }}>{strength.label}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "var(--u-dim)" : "var(--u-neon-blue)",
              color: "white",
              borderRadius: 10,
              padding: 12,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              border: "none",
              fontSize: 15,
              transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          >
            {loading ? "Please wait..." : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "var(--u-muted)" }}>
          Secured · Amazon FBA Intelligence Platform
        </div>
      </div>
    </div>
  );
}
