import { useState, useEffect, useRef, useCallback } from "react";
import { JarvisRings } from "./JarvisRings";

/* ─── Types ─────────────────────────────────────────────────── */
type AgentId = "MAXIMUS" | "ARIA" | "SCOUT" | "NEXUS" | "ATLAS" | "IRIS";

interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  emoji: string;
}

interface HistoryMsg { role: "user" | "assistant"; content: string; }
interface UIMsg {
  role: "user" | "agent";
  agent?: AgentDef;
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

/* ─── Static agent metadata (mirrors server) ─────────────────── */
const AGENT_META: Record<AgentId, AgentDef> = {
  MAXIMUS: { id: "MAXIMUS", name: "MAXIMUS", role: "Chief of Staff",           color: "#06b6d4", emoji: "⚡" },
  ARIA:    { id: "ARIA",    name: "ARIA",    role: "Product Research",          color: "#f59e0b", emoji: "🔍" },
  SCOUT:   { id: "SCOUT",   name: "SCOUT",   role: "Supply Chain & Operations", color: "#10b981", emoji: "📦" },
  NEXUS:   { id: "NEXUS",   name: "NEXUS",   role: "SEO & Listing",             color: "#8b5cf6", emoji: "🎯" },
  ATLAS:   { id: "ATLAS",   name: "ATLAS",   role: "PPC & Advertising",         color: "#3b82f6", emoji: "📢" },
  IRIS:    { id: "IRIS",    name: "IRIS",    role: "Financial Intelligence",     color: "#ec4899", emoji: "💰" },
};

const AGENT_ORDER: AgentId[] = ["MAXIMUS", "ARIA", "SCOUT", "NEXUS", "ATLAS", "IRIS"];

/* ─── Quick actions by agent ─────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Morning Brief",   prompt: "Give me the full morning briefing — all agents status",             agent: "MAXIMUS" as AgentId },
  { label: "🔍 Find Products", prompt: "Find me 5 high-potential Grade A Amazon products right now with full analysis", agent: "ARIA" as AgentId },
  { label: "📦 Inventory",    prompt: "What inventory items need attention? Any critical stockout risks?", agent: "SCOUT" as AgentId },
  { label: "🎯 SEO Audit",    prompt: "Which of my listings need SEO optimization? Show scores.",          agent: "NEXUS" as AgentId },
  { label: "📢 PPC Report",   prompt: "Give me a full PPC performance summary with specific bid recommendations", agent: "ATLAS" as AgentId },
  { label: "💰 P&L Today",    prompt: "Show me today's P&L breakdown — revenue, costs, net profit, margin", agent: "IRIS" as AgentId },
];

/* ─── Arc reactor animation ──────────────────────────────────── */
function Arc({ size = 36, color = "#06b6d4" }: { size?: number; color?: string }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPhase(p => (p + 1) % 6), 720);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="arc-reactor" style={{ width: size, height: size }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`arc-seg${phase === i ? " arc-seg--hot" : ""}`}
          style={{ "--s": i, "--arc-hot": color } as React.CSSProperties} />
      ))}
      <div className="arc-core" style={{ background: color }} />
    </div>
  );
}

/* ─── Agent status dot ───────────────────────────────────────── */
function AgentDot({ agent, active, onClick }: { agent: AgentDef; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${agent.name} — ${agent.role}`}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
        borderRadius: 8, transition: "background 0.15s",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: active ? agent.color : "rgba(255,255,255,0.06)",
        border: `2px solid ${active ? agent.color : "rgba(255,255,255,0.12)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, transition: "all 0.2s",
        boxShadow: active ? `0 0 10px ${agent.color}66` : "none",
      }}>
        {agent.emoji}
      </div>
      <span style={{ fontSize: 8, fontWeight: 700, color: active ? agent.color : "var(--u-dim)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {agent.name === "MAXIMUS" ? "MAX" : agent.name}
      </span>
    </button>
  );
}

/* ─── Message bubble ─────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: UIMsg }) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <div style={{
          maxWidth: "78%", padding: "10px 14px",
          background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)",
          borderRadius: "14px 14px 4px 14px", fontSize: 13, color: "var(--u-text)", lineHeight: 1.55,
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  const agent = msg.agent ?? AGENT_META.MAXIMUS;
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
      {/* Agent avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: `${agent.color}22`, border: `2px solid ${agent.color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, boxShadow: `0 0 8px ${agent.color}33`,
      }}>
        {agent.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Agent name badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: agent.color, letterSpacing: "0.06em" }}>
            {agent.name}
          </span>
          <span style={{ fontSize: 10, color: "var(--u-dim)" }}>{agent.role}</span>
          <span style={{ fontSize: 10, color: "var(--u-dim)", marginLeft: "auto" }}>
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        {/* Message content */}
        <div style={{
          padding: "10px 14px",
          background: `${agent.color}0d`,
          border: `1px solid ${agent.color}28`,
          borderRadius: "4px 14px 14px 14px",
          fontSize: 13, color: "var(--u-text)", lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {msg.content || (msg.streaming && <span style={{ opacity: 0.5 }}>Thinking…</span>)}
          {msg.streaming && <span style={{
            display: "inline-block", width: 2, height: 14, background: agent.color,
            marginLeft: 2, verticalAlign: "middle",
            animation: "liveBlink 0.8s ease-in-out infinite",
          }} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Main panel ─────────────────────────────────────────────── */
export function MaximusPanel() {
  const [open, setOpen]             = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [forcedAgent, setForcedAgent] = useState<AgentId | null>(null);
  const [online, setOnline]         = useState(false);
  const [streaming, setStreaming]   = useState(false);
  const [input, setInput]           = useState("");
  const [history, setHistory]       = useState<HistoryMsg[]>([]);
  const [messages, setMessages]     = useState<UIMsg[]>([{
    role: "agent",
    agent: AGENT_META.MAXIMUS,
    content: "MAXIMUS team online. Six specialized agents standing by:\n\n🔍 ARIA — Product Research\n📦 SCOUT — Supply Chain\n🎯 NEXUS — SEO & Listings\n📢 ATLAS — PPC & Ads\n💰 IRIS — Financial Intelligence\n\nAsk anything about your Amazon business. I'll route you to the right specialist.",
    timestamp: new Date(),
  }]);

  const endRef        = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const abortRef      = useRef<AbortController | null>(null);
  const sendRef       = useRef<((text: string, agent?: AgentId) => void) | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 90); }, [open]);

  // Health check
  useEffect(() => {
    const check = async () => {
      try { const r = await fetch("/api/health", { signal: AbortSignal.timeout(2500) }); setOnline(r.ok); }
      catch { setOnline(false); }
    };
    check();
    const iv = setInterval(check, 14000);
    return () => clearInterval(iv);
  }, []);

  // Global event listener for maximus:query
  useEffect(() => {
    const handler = (e: Event) => {
      const { query } = (e as CustomEvent<{ query: string }>).detail;
      setOpen(true);
      setTimeout(() => sendRef.current?.(query), 150);
    };
    window.addEventListener("maximus:query", handler);
    return () => window.removeEventListener("maximus:query", handler);
  }, []);

  const sendMessage = useCallback(async (text: string, forceAgent?: AgentId) => {
    if (!text.trim() || streaming) return;

    const userMsg: UIMsg = { role: "user", content: text.trim(), timestamp: new Date() };
    const agentPlaceholder: UIMsg = {
      role: "agent", agent: forceAgent ? AGENT_META[forceAgent] : AGENT_META.MAXIMUS,
      content: "", timestamp: new Date(), streaming: true,
    };

    setMessages(prev => [...prev, userMsg, agentPlaceholder]);
    setInput("");
    setStreaming(true);
    abortRef.current = new AbortController();

    let accumulated = "";
    let resolvedAgent: AgentDef = forceAgent ? AGENT_META[forceAgent] : AGENT_META.MAXIMUS;

    try {
      const res = await fetch("/api/maximus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history,
          agentId: forceAgent ?? null,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Server ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const chunk = JSON.parse(raw);

            if (chunk.type === "agent") {
              // Server told us which agent is responding
              resolvedAgent = {
                id: chunk.id, name: chunk.name, role: chunk.role,
                color: chunk.color, emoji: chunk.emoji,
              };
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last.streaming) next[next.length - 1] = { ...last, agent: resolvedAgent };
                return next;
              });
            } else if (chunk.type === "delta" && chunk.delta) {
              accumulated += chunk.delta;
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last.streaming) next[next.length - 1] = { ...last, content: accumulated };
                return next;
              });
            } else if (chunk.delta) {
              // Legacy format fallback
              accumulated += chunk.delta;
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last.streaming) next[next.length - 1] = { ...last, content: accumulated };
                return next;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }

      // Finalize
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.streaming) next[next.length - 1] = { ...last, streaming: false };
        return next;
      });
      setHistory(prev => [
        ...prev,
        { role: "user", content: text.trim() },
        { role: "assistant", content: accumulated },
      ]);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.streaming) next[next.length - 1] = {
          ...last, streaming: false,
          content: online
            ? `Error: ${err.message}`
            : "MAXIMUS server offline. Start it: cd server && npm run dev:http",
        };
        return next;
      });
    } finally { setStreaming(false); }
  }, [streaming, online, history]);

  sendRef.current = sendMessage;

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input, forcedAgent ?? undefined); }
  };

  const panelW = expanded ? 680 : 420;
  const panelH = expanded ? 680 : 520;

  return (
    <>
      {/* ── FAB ── */}
      <button
        className={`maximus-fab${open ? " maximus-fab--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle MAXIMUS Team"
        style={{ overflow: "hidden" }}
      >
        <div style={{ position: "relative", width: 30, height: 30 }}>
          <JarvisRings size={30} intensity={online ? 0.9 : 0.3} />
        </div>
        <span className="maximus-fab-label">MAXIMUS</span>
        <span className={`maximus-srv-dot${online ? " online" : ""}`} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div className="maximus-panel" style={{ width: panelW, height: panelH, transition: "width 0.25s, height 0.25s" }}>
          <div className="maximus-bg" />

          {/* ── Header ── */}
          <header className="maximus-hdr maximus-j-header" style={{ flexDirection: "column", gap: 0, padding: 0 }}>
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10 }}>
              <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
                <JarvisRings size={42} intensity={online ? 1 : 0.3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="maximus-title j-glow-text" style={{ fontSize: 14 }}>MAXIMUS COMMAND CENTER</div>
                <div className="maximus-sub">Yamari Group · 6-Agent AI Team · Fable 5</div>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span className={`maximus-badge${online ? " badge-online" : " badge-offline"}`}>
                  <span className="badge-dot" />
                  {online ? "LIVE" : "OFFLINE"}
                </span>
                <button
                  onClick={() => setExpanded(e => !e)}
                  style={{ background: "none", border: "none", color: "var(--u-dim)", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}
                  title={expanded ? "Compact" : "Expand"}
                >
                  {expanded ? "⊟" : "⊞"}
                </button>
                {history.length > 0 && (
                  <button className="maximus-clear" onClick={() => { setHistory([]); setForcedAgent(null); }} title="Clear history">↺</button>
                )}
                <button className="maximus-x" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>

            {/* Team agent dots */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-around",
              padding: "6px 10px 8px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
            }}>
              {AGENT_ORDER.map(id => (
                <AgentDot
                  key={id}
                  agent={AGENT_META[id]}
                  active={forcedAgent === id}
                  onClick={() => setForcedAgent(prev => prev === id ? null : id)}
                />
              ))}
            </div>

            {/* Forced agent indicator */}
            {forcedAgent && (
              <div style={{
                padding: "5px 14px", fontSize: 11, fontWeight: 600,
                background: `${AGENT_META[forcedAgent].color}18`,
                borderTop: `1px solid ${AGENT_META[forcedAgent].color}30`,
                color: AGENT_META[forcedAgent].color,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>{AGENT_META[forcedAgent].emoji} Routing all messages to {AGENT_META[forcedAgent].name} — {AGENT_META[forcedAgent].role}</span>
                <button onClick={() => setForcedAgent(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 12 }}>✕ Auto</button>
              </div>
            )}
          </header>

          {/* ── Messages ── */}
          <div className="maximus-msgs" style={{ flex: 1 }}>
            {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
            <div ref={endRef} />
          </div>

          {/* ── Quick actions ── */}
          <div style={{
            display: "flex", gap: 6, padding: "8px 12px", flexWrap: "wrap",
            borderTop: "1px solid var(--u-border)",
            background: "rgba(0,0,0,0.15)",
          }}>
            {QUICK_ACTIONS.map(({ label, prompt, agent }) => (
              <button
                key={label}
                onClick={() => sendMessage(prompt, agent)}
                disabled={streaming}
                style={{
                  padding: "4px 10px", background: `${AGENT_META[agent].color}18`,
                  border: `1px solid ${AGENT_META[agent].color}35`,
                  color: AGENT_META[agent].color, borderRadius: 20, fontSize: 11,
                  fontWeight: 600, cursor: streaming ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Input ── */}
          <div className="maximus-input-row" style={{ borderTop: "1px solid var(--u-border)" }}>
            <textarea
              ref={inputRef}
              className={`maximus-ta maximus-j-input`}
              placeholder={forcedAgent
                ? `Ask ${AGENT_META[forcedAgent].name}… (Enter to send)`
                : "Ask the team anything… Enter to send · Shift+Enter for newline"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              disabled={streaming}
            />
            <button
              className="maximus-send"
              onClick={() => sendMessage(input, forcedAgent ?? undefined)}
              disabled={!input.trim() || streaming}
              style={forcedAgent ? { background: AGENT_META[forcedAgent].color } : {}}
            >
              {streaming
                ? <span className="send-spin" />
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
              }
            </button>
          </div>
        </div>
      )}
    </>
  );
}
