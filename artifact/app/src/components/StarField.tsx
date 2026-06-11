import { useEffect, useRef } from "react";

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, frame = 0, t = 0;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();

    /* Two layers: distant tiny stars + closer bright ones */
    const make = (n: number, maxR: number) =>
      Array.from({ length: n }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * maxR + 0.2,
        alpha: Math.random() * 0.5 + 0.05,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.008 + 0.003,
      }));

    let layer1 = make(90,  0.9);
    let layer2 = make(30,  1.8);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;
      for (const s of [...layer1, ...layer2]) {
        const a = s.alpha * (0.4 + 0.6 * Math.sin(t * s.speed * 60 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170, 210, 255, ${a})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      resize();
      layer1 = make(90,  0.9);
      layer2 = make(30,  1.8);
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
