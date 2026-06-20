import { useEffect, useRef } from "react";

interface Node { x: number; y: number; vx: number; vy: number; glow: number; }
interface Pulse { from: number; to: number; t: number; speed: number; }

export function NeuralBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const N = 28;
    const CONNECT_DIST = 220;
    const MAX_PULSES = 10;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const nodes: Node[] = Array.from({ length: N }, () => ({
      x: Math.random() * canvas!.width,
      y: Math.random() * canvas!.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      glow: Math.random(),
    }));

    const pulses: Pulse[] = [];

    const spawnInterval = setInterval(() => {
      if (pulses.length >= MAX_PULSES) return;
      const fi = Math.floor(Math.random() * N);
      const ti = Math.floor(Math.random() * N);
      if (fi === ti) return;
      const dx = nodes[ti].x - nodes[fi].x;
      const dy = nodes[ti].y - nodes[fi].y;
      if (Math.hypot(dx, dy) < CONNECT_DIST) {
        pulses.push({ from: fi, to: ti, t: 0, speed: 0.007 + Math.random() * 0.01 });
      }
    }, 350);

    function draw() {
      const W = canvas!.width, H = canvas!.height;
      ctx!.clearRect(0, 0, W, H);

      // Move nodes
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.glow = (n.glow + 0.005) % 1;
      }

      // Draw connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.13;
            ctx!.strokeStyle = `rgba(234,179,8,${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
      }

      // Draw pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }

        const n1 = nodes[p.from], n2 = nodes[p.to];
        const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
        if (dist >= CONNECT_DIST) { pulses.splice(i, 1); continue; }

        const px = n1.x + (n2.x - n1.x) * p.t;
        const py = n1.y + (n2.y - n1.y) * p.t;

        // Trail behind the pulse
        const trailLen = 0.12;
        const trailStart = Math.max(0, p.t - trailLen);
        const tx = n1.x + (n2.x - n1.x) * trailStart;
        const ty = n1.y + (n2.y - n1.y) * trailStart;
        const trail = ctx!.createLinearGradient(tx, ty, px, py);
        trail.addColorStop(0, "rgba(234,179,8,0)");
        trail.addColorStop(1, "rgba(234,179,8,0.6)");
        ctx!.strokeStyle = trail;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.moveTo(tx, ty);
        ctx!.lineTo(px, py);
        ctx!.stroke();

        // Pulse head glow
        const grad = ctx!.createRadialGradient(px, py, 0, px, py, 9);
        grad.addColorStop(0, "rgba(253,224,71,0.9)");
        grad.addColorStop(0.4, "rgba(234,179,8,0.4)");
        grad.addColorStop(1, "rgba(234,179,8,0)");
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(px, py, 9, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Draw nodes
      for (const n of nodes) {
        const pulse = Math.sin(n.glow * Math.PI * 2) * 0.5 + 0.5;
        const r = 1.2 + pulse * 0.8;
        const alpha = 0.2 + pulse * 0.35;
        ctx!.fillStyle = `rgba(234,179,8,${alpha})`;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(spawnInterval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        zIndex: 0, opacity: 0.55,
      }}
    />
  );
}
