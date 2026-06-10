import { useState, useEffect, useRef, useCallback } from "react";

interface HistoryMsg { role: "user" | "assistant"; content: string; }
interface UIMsg      { role: "user" | "maximus";   content: string; timestamp: Date; streaming?: boolean; }

const QUICK_ACTIONS = [
  { label: "Market Brief",  prompt: "Give me today's market intelligence summary for the loaded products" },
  { label: "Top Signals",   prompt: "What are the strongest buy signals in the current batch?" },
  { label: "Risk Check",    prompt: "Identify the highest-risk factors I should know about right now" },
  { label: "Scout Report",  prompt: "Summarise the scouting results and the single best opportunity" },
  { label: "PPC Strategy",  prompt: "What's the optimal PPC approach for the top-graded product?" },
];

export function MaximusPanel() {
  const [open,       setOpen]       = useState(false);
  const [messages,   setMessages]   = useState<UIMsg[]>([{
    role: "maximus",
    content: "MAXIMUS online. All intelligence systems initialized.\nHow can I assist your commerce operations today?",
    timestamp: new Date(),
  }]);
  const [history,    setHistory]    = useState<HistoryMsg[]>([]);
  const [input,      setInput]      = useState("");
  const [streaming,  setStreaming]  = useState(false);
  const [online,     setOnline]     = useState(false);
  const [arcPhase,   setArcPhase]   = useState(0);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* arc reactor cycling */
  useEffect(() => {
    const iv = setInterval(() => setArcPhase(p => (p + 1) % 6), 720);
    return () => clearInterval(iv);
  }, []);

  /* server health polling */
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch("/api/health", { signal: AbortSignal.timeout(2500) });
        setOnline(r.ok);
      } catch { setOnline(false); }
    };
    check();
    const iv = setInterval(check, 14000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 90); }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: UIMsg = { role: "user", content: text.trim(), timestamp: new Date() };
    setMessages(prev => [
      ...prev,
      userMsg,
      { role: "maximus", content: "", timestamp: new Date(), streaming: true },
    ]);
    setInput("");
    setStreaming(true);
    abortRef.current = new AbortController();

    let accumulated = "";

    try {
      const res = await fetch("/api/maximus", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text.trim(), history }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Server ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const p = JSON.parse(data);
            if (p.error) throw new Error(p.error);
            if (p.delta) {
              accumulated += p.delta;
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last.streaming) next[next.length - 1] = { ...last, content: accumulated };
                return next;
              });
            }
          } catch (e: any) {
            if (e.message !== "data parse") throw e;
          }
        }
      }

      /* settle streaming state */
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.streaming) next[next.length - 1] = { ...last, streaming: false };
        return next;
      });

      /* append to conversation history for context on next turn */
      setHistory(prev => [
        ...prev,
        { role: "user",      content: text.trim() },
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
            ? `Intelligence error: ${err.message}`
            : "MAXIMUS server offline.\nStart it with: ./start.sh",
        };
        return next;
      });
    } finally { setStreaming(false); }
  }, [streaming, online, history]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const Arc = ({ size = 36 }: { size?: number }) => (
    <div className="arc-reactor" style={{ width: size, height: size }}>
      {[0,1,2,3,4,5].map(i => (
        <div key={i} className={`arc-seg${arcPhase === i ? " arc-seg--hot" : ""}`}
          style={{ "--s": i } as React.CSSProperties} />
      ))}
      <div className="arc-core" />
    </div>
  );

  return (
    <>
      {/* ── FAB ── */}
      <button
        className={`maximus-fab${open ? " maximus-fab--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle MAXIMUS"
      >
        <Arc size={30} />
        <span className="maximus-fab-label">MAXIMUS</span>
        <span className={`maximus-srv-dot${online ? " online" : ""}`} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div className="maximus-panel">
          <div className="maximus-bg" />

          <header className="maximus-hdr">
            <div className="maximus-hdr-left">
              <Arc size={42} />
              <div>
                <div className="maximus-title">MAXIMUS</div>
                <div className="maximus-sub">Chief Intelligence Officer · Yamari Group</div>
              </div>
            </div>
            <div className="maximus-hdr-right">
              <span className={`maximus-badge${online ? " badge-online" : " badge-offline"}`}>
                <span className="badge-dot" />
                {online ? "ONLINE" : "OFFLINE"}
              </span>
              {history.length > 0 && (
                <button
                  className="maximus-clear"
                  onClick={() => { setHistory([]); }}
                  title="Clear conversation history"
                >↺</button>
              )}
              <button className="maximus-x" onClick={() => setOpen(false)}>✕</button>
            </div>
          </header>

          <div className="maximus-msgs">
            {messages.map((m, i) => (
              <div key={i} className={`maximus-msg msg-${m.role}`}>
                {m.role === "maximus" && <div className="msg-avatar">M</div>}
                <div className="msg-wrap">
                  <div className="msg-bubble">
                    {m.content}{m.streaming && <span className="stream-cur" />}
                  </div>
                  <div className="msg-ts">
                    {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="maximus-quick">
            {QUICK_ACTIONS.map(({ label, prompt }) => (
              <button key={label} className="qa-btn" onClick={() => sendMessage(prompt)} disabled={streaming}>
                {label}
              </button>
            ))}
          </div>

          <div className="maximus-input-row">
            <textarea
              ref={inputRef}
              className="maximus-ta"
              placeholder="Ask MAXIMUS anything…  (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              disabled={streaming}
            />
            <button
              className="maximus-send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
            >
              {streaming
                ? <span className="send-spin" />
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
