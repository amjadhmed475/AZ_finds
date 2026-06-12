import { useEffect, useRef, useState } from "react";
import { JarvisRings } from "./JarvisRings";

const PARTICLES = 28;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fade, setFade] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    let p = 0;
    const steps = [
      { target: 22, delay: 0, speed: 60 },
      { target: 55, delay: 200, speed: 45 },
      { target: 78, delay: 100, speed: 55 },
      { target: 94, delay: 120, speed: 70 },
      { target: 100, delay: 80, speed: 35 },
    ];

    let stepIdx = 0;
    let interval: ReturnType<typeof setInterval>;

    function runStep() {
      if (stepIdx >= steps.length) {
        setTimeout(() => {
          setFade(true);
          setTimeout(() => {
            if (!doneRef.current) { doneRef.current = true; onDone(); }
          }, 680);
        }, 200);
        return;
      }
      const s = steps[stepIdx++];
      setTimeout(() => {
        interval = setInterval(() => {
          p = Math.min(p + 1, s.target);
          setProgress(p);
          if (p >= s.target) { clearInterval(interval); runStep(); }
        }, s.speed);
      }, s.delay);
    }

    const boot = setTimeout(runStep, 480);
    return () => { clearTimeout(boot); clearInterval(interval); };
  }, [onDone]);

  const status =
    progress < 25 ? "Initializing intelligence systems…" :
    progress < 52 ? "Loading product catalog…" :
    progress < 80 ? "Analyzing market opportunities…" :
    progress < 96 ? "Building your command center…" :
    "Systems online ✓";

  const orbIntensity = progress / 100;

  return (
    <div className={`splash${fade ? " splash-fade" : ""}`}>
      {/* Particle field */}
      <div className="splash-particles" aria-hidden>
        {Array.from({ length: PARTICLES }).map((_, i) => (
          <span key={i} className="spar" style={{ "--si": i } as React.CSSProperties} />
        ))}
      </div>

      {/* Grid lines */}
      <div className="splash-grid" aria-hidden />

      {/* Glow orbs */}
      <div className="splash-orb splash-orb-1" aria-hidden />
      <div className="splash-orb splash-orb-2" aria-hidden />

      {/* Main content */}
      <div className="splash-body">

        {/* ── Jarvis Arc Reactor ── */}
        <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Outer ambient rings behind everything */}
          <div className="splash-j-ring" style={{ opacity: orbIntensity * 0.6 }} />
          <div className="splash-j-ring-2" style={{ opacity: orbIntensity * 0.4 }} />

          {/* The main Jarvis arc reactor */}
          <div className="splash-j-orb" style={{ opacity: Math.max(0.15, orbIntensity) }}>
            <JarvisRings size={220} intensity={orbIntensity} />
          </div>

          {/* Logo overlaid on center of orb */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="splash-logomark" style={{ width: 52, height: 52, zIndex: 10 }}>
              <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 52 }}>
                <defs>
                  <linearGradient id="splashG1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f5a524" />
                    <stop offset="100%" stopColor="#fdd068" />
                  </linearGradient>
                  <linearGradient id="splashG2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5b8cf5" />
                    <stop offset="100%" stopColor="#7ba9ff" />
                  </linearGradient>
                </defs>
                <path d="M28 10 L44 40 H12 Z" fill="none" stroke="url(#splashG1)" strokeWidth="2.5" strokeLinejoin="round" className="splash-path-draw" />
                <path d="M21 33 L28 18 L35 33" fill="none" stroke="url(#splashG2)" strokeWidth="1.8" strokeLinejoin="round" className="splash-path-draw-inner" />
                <circle cx="28" cy="30" r="3.5" fill="url(#splashG1)" className="splash-dot-pulse" />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand text */}
        <div className="splash-brand-block" style={{ marginTop: 4 }}>
          <h1 className="splash-title j-glow-text">AZ Finds</h1>
          <p className="splash-sub">Amazon Seller Research Platform</p>
          <p className="splash-by">by Yamari Group</p>
        </div>

        {/* Progress bar */}
        <div className="splash-progress-wrap">
          <div className="splash-progress-track">
            <div className="splash-progress-fill" style={{ width: `${progress}%` }} />
            <div className="splash-progress-glow" style={{ left: `${progress}%` }} />
          </div>
          <div className="splash-progress-row">
            <span className="splash-status">{status}</span>
            <span className="splash-pct">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Live badge */}
        <div className="splash-live-badge">
          <span className="splash-live-dot" />
          LIVE DATA ENGINE
        </div>
      </div>
    </div>
  );
}
