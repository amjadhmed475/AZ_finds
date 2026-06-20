import { useRef, useCallback } from "react";

/**
 * 3-D perspective tilt on hover.
 * intensity: degrees of max tilt. scale: zoom factor on hover.
 */
export function use3DTilt(intensity = 10, scale = 1.025) {
  const ref     = useRef<HTMLElement>(null);
  const frameId = useRef<number>(0);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frameId.current);
    frameId.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   /* 0–1 */
      const y = (e.clientY - rect.top)  / rect.height;  /* 0–1 */
      const rotX = (0.5 - y) * intensity;
      const rotY = (x - 0.5) * intensity;
      el.style.transform  = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
      el.style.transition = "transform 0.08s ease";
    });
  }, [intensity, scale]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frameId.current);
    el.style.transform  = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.transition = "transform 0.6s cubic-bezier(.175,.885,.32,1.275)";
  }, []);

  return {
    ref: ref as React.RefObject<HTMLDivElement>,
    onMouseMove,
    onMouseLeave,
  };
}
