import { useEffect, useRef, useState } from "react";

/* ── Agent definitions ──────────────────────────────────── */
const AGENTS = [
  {
    id: "MAXIMUS", color: "#4f8ef7", emoji: "⚡", label: "MAXIMUS", role: "Director",
    statuses: ["Orchestrating team…", "Routing tasks…", "Synthesising intel…", "Coordinating agents…"],
  },
  {
    id: "ARIA", color: "#f0a500", emoji: "🔍", label: "ARIA", role: "Research",
    statuses: ["Scanning niches…", "Grading products…", "BSR analysis…", "Finding opportunities…"],
  },
  {
    id: "SCOUT", color: "#22c55e", emoji: "📦", label: "SCOUT", role: "Supply Chain",
    statuses: ["Checking stock…", "Reorder calc…", "Vetting suppliers…", "Lead time review…"],
  },
  {
    id: "NEXUS", color: "#a855f7", emoji: "🎯", label: "NEXUS", role: "SEO",
    statuses: ["Optimising listing…", "Keyword research…", "A+ content audit…", "Rank tracking…"],
  },
  {
    id: "ATLAS", color: "#ec4899", emoji: "📢", label: "ATLAS", role: "PPC",
    statuses: ["ACoS review…", "Adjusting bids…", "Harvesting negatives…", "Campaign audit…"],
  },
  {
    id: "IRIS", color: "#06b6d4", emoji: "💰", label: "IRIS", role: "Finance",
    statuses: ["P&L analysis…", "Margin modelling…", "Cash flow…", "ROI report…"],
  },
];

/* Edges: [fromIdx, toIdx] — 0 = MAXIMUS */
const EDGES = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 3], [2, 5], [3, 4],
];

function rgb(hex: string) {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

/* ── Canvas graph ───────────────────────────────────────── */
function Graph() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const DPR = window.devicePixelRatio || 1;

    let W = 0, H = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas!.width = W * DPR; canvas!.height = H * DPR;
      ctx.scale(DPR, DPR);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* node positions computed from canvas size */
    type NodePos = (typeof AGENTS)[0] & { x: number; y: number };

    function buildNodes(): NodePos[] {
      const CX = W / 2, CY = H / 2;
      const R  = Math.min(W, H) * 0.30;
      return [
        { ...AGENTS[0], x: CX, y: CY },
        ...AGENTS.slice(1).map((a, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          return { ...a, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
        }),
      ];
    }

    /* particles per edge */
    type Particle = { t: number; speed: number; size: number };
    const parts: Particle[][] = EDGES.map(() =>
      Array.from({ length: 3 }, (_, i) => ({
        t: i / 3,
        speed: 0.0028 + Math.random() * 0.0032,
        size: 2 + Math.random() * 0.8,
      }))
    );

    /* per-node animation state */
    type Anim = { breath: number; bspd: number; ring: number; timer: number; interval: number };
    const anims: Anim[] = AGENTS.map((_, i) => ({
      breath: (i / AGENTS.length) * Math.PI * 2,
      bspd: 0.7 + Math.random() * 0.5,
      ring: 0,
      timer: (i + 1) * 700 + Math.random() * 1800,
      interval: 2500 + Math.random() * 3500,
    }));

    let raf: number;
    let lastTs = performance.now();

    function frame(ts: number) {
      const dt = Math.min(ts - lastTs, 48);
      lastTs = ts;

      const nodes = buildNodes();
      ctx.clearRect(0, 0, W, H);

      /* update node anims */
      anims.forEach(a => {
        a.breath += dt * 0.001 * a.bspd;
        a.timer  -= dt;
        if (a.timer <= 0) { a.ring = 1; a.timer = a.interval + Math.random() * 400; }
        if (a.ring > 0)   a.ring = Math.max(0, a.ring - dt * 0.0011);
      });

      /* edges + particles */
      EDGES.forEach(([fi, ti], ei) => {
        const from = nodes[fi], to = nodes[ti];
        const c = rgb(from.color);

        /* edge line */
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = `rgba(${c},0.07)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        /* particles */
        parts[ei].forEach(p => {
          p.t += p.speed;
          if (p.t > 1) p.t -= 1;
          const px = from.x + (to.x - from.x) * p.t;
          const py = from.y + (to.y - from.y) * p.t;
          const fade = Math.sin(p.t * Math.PI) * 0.9;

          /* glow halo */
          const g = ctx.createRadialGradient(px, py, 0, px, py, p.size * 5);
          g.addColorStop(0, `rgba(${c},${fade * 0.38})`);
          g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, p.size * 5, 0, Math.PI * 2); ctx.fill();

          /* core */
          ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${c},${fade})`; ctx.fill();
        });
      });

      /* nodes */
      nodes.forEach((node, i) => {
        const a = anims[i];
        const breath = 0.5 + 0.5 * Math.sin(a.breath);
        const r = node.id === "MAXIMUS" ? 22 : 17;
        const c = rgb(node.color);

        /* ambient glow */
        const gr = r * (2.5 + breath * 0.8 + a.ring * 1.6);
        const ga = 0.07 + breath * 0.05 + a.ring * 0.18;
        const glw = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, gr);
        glw.addColorStop(0, `rgba(${c},${ga})`); glw.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = glw;
        ctx.beginPath(); ctx.arc(node.x, node.y, gr, 0, Math.PI * 2); ctx.fill();

        /* activity ring — expands outward as ring fades */
        if (a.ring > 0) {
          const rr = r + (1 - a.ring) * r * 3.8;
          ctx.beginPath(); ctx.arc(node.x, node.y, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${c},${a.ring * 0.6})`; ctx.lineWidth = 1.5; ctx.stroke();
        }

        /* breath ring */
        ctx.beginPath(); ctx.arc(node.x, node.y, r + 5 + breath * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${c},${0.06 + breath * 0.09})`; ctx.lineWidth = 1; ctx.stroke();

        /* fill */
        ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = "#0e1520"; ctx.fill();
        ctx.strokeStyle = `rgba(${c},${0.42 + breath * 0.45 + a.ring * 0.15})`;
        ctx.lineWidth = node.id === "MAXIMUS" ? 2 : 1.5; ctx.stroke();

        /* emoji */
        ctx.font = `${node.id === "MAXIMUS" ? 13 : 11}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(node.emoji, node.x, node.y);

        /* label */
        ctx.font = `700 8.5px Inter,sans-serif`;
        ctx.fillStyle = `rgba(${c},0.9)`;
        ctx.textBaseline = "top";
        ctx.fillText(node.label, node.x, node.y + r + 5);

        /* role */
        ctx.font = `400 7.5px Inter,sans-serif`;
        ctx.fillStyle = "rgba(110,145,185,0.5)";
        ctx.fillText(node.role, node.x, node.y + r + 15);
      });

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

/* ── Full agent network panel ───────────────────────────── */
export function AgentNetwork() {
  const [statuses, setStatuses] = useState(() => AGENTS.map(a => a.statuses[0]));

  /* Each agent rotates its own status independently */
  useEffect(() => {
    const handles: ReturnType<typeof setInterval>[] = [];
    AGENTS.forEach((agent, i) => {
      const tid = setTimeout(() => {
        const iv = setInterval(() => {
          setStatuses(prev => {
            const next = [...prev];
            next[i] = agent.statuses[Math.floor(Math.random() * agent.statuses.length)];
            return next;
          });
        }, 3200 + i * 600);
        handles.push(iv);
      }, i * 900);
      handles.push(tid as unknown as ReturnType<typeof setInterval>);
    });
    return () => handles.forEach(h => clearInterval(h));
  }, []);

  return (
    <div className="agent-rail-inner">
      {/* Header */}
      <div className="agent-rail-head">
        <span className="agent-rail-title">Intelligence Network</span>
        <span className="agent-rail-sub">6 agents · always-on</span>
      </div>

      {/* Canvas graph */}
      <div className="agent-rail-graph">
        <Graph />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--p-b1)", margin: "0 12px" }} />

      {/* Agent status list */}
      <div className="agent-rail-status-head">Live Status</div>
      <div className="agent-rail-list">
        {AGENTS.map((agent, i) => (
          <div key={agent.id} className="agent-status-row">
            <div
              className="agent-status-dot"
              style={{ background: agent.color, boxShadow: `0 0 6px ${agent.color}99` }}
            />
            <div className="agent-status-info">
              <span className="agent-status-name" style={{ color: agent.color }}>{agent.label}</span>
              <span className="agent-status-task">{statuses[i]}</span>
            </div>
            <div
              className="agent-status-pulse"
              style={{
                background: agent.color,
                animationDelay: `${i * 0.28}s`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
