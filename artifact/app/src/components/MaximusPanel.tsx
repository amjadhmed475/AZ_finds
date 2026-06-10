import { useState, useEffect, useRef } from "react";

const MAXIMUS_URL = "https://themaximus.netlify.app";

export function MaximusPanel() {
  const [open,       setOpen]       = useState(false);
  const [arcPhase,   setArcPhase]   = useState(0);
  const [iframeErr,  setIframeErr]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* arc reactor segment cycling */
  useEffect(() => {
    const iv = setInterval(() => setArcPhase(p => (p + 1) % 6), 750);
    return () => clearInterval(iv);
  }, []);

  /* reset iframe state on every open */
  useEffect(() => {
    if (open) { setIframeErr(false); setLoading(true); }
  }, [open]);

  const ArcRings = ({ size = 36 }: { size?: number }) => (
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
      {/* ── Floating trigger ── */}
      <button
        className={`maximus-fab${open ? " maximus-fab--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle MAXIMUS"
      >
        <ArcRings size={30} />
        <span className="maximus-fab-label">MAXIMUS</span>
        <span className="maximus-srv-dot online" />
      </button>

      {/* ── Intelligence Panel ── */}
      {open && (
        <div className="maximus-panel">
          <div className="maximus-bg" />

          <header className="maximus-hdr">
            <div className="maximus-hdr-left">
              <ArcRings size={42} />
              <div>
                <div className="maximus-title">MAXIMUS</div>
                <div className="maximus-sub">Chief Intelligence Officer · Yamari Group</div>
              </div>
            </div>
            <div className="maximus-hdr-right">
              <a
                href={MAXIMUS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="maximus-expand-btn"
                title="Open MAXIMUS in full screen"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </a>
              <button className="maximus-x" onClick={() => setOpen(false)}>✕</button>
            </div>
          </header>

          <div className="maximus-iframe-wrap">
            {loading && !iframeErr && (
              <div className="maximus-loading">
                <ArcRings size={52} />
                <span className="maximus-loading-text">Initializing MAXIMUS…</span>
              </div>
            )}

            {iframeErr ? (
              <div className="maximus-fallback">
                <ArcRings size={64} />
                <p className="maximus-fallback-title">MAXIMUS</p>
                <p className="maximus-fallback-sub">
                  The embedded frame was blocked by a browser security policy.<br/>
                  Open MAXIMUS in its own window for full functionality.
                </p>
                <a
                  href={MAXIMUS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maximus-open-btn"
                >
                  Open MAXIMUS
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                  </svg>
                </a>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={MAXIMUS_URL}
                title="MAXIMUS Intelligence System"
                className={`maximus-iframe${loading ? " maximus-iframe--loading" : ""}`}
                onLoad={() => setLoading(false)}
                onError={() => { setIframeErr(true); setLoading(false); }}
                allow="clipboard-write; microphone"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
