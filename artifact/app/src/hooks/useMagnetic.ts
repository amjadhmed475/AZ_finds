import { useRef, useCallback } from "react";

/**
 * Magnetic hover effect — element drifts toward cursor, snaps back elastically.
 * strength: 0–1 pull factor. distance: px radius where effect activates.
 */
export function useMagnetic(strength = 0.32, distance = 70) {
  const elRef   = useRef<HTMLElement>(null);
  const settle  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active  = useRef(false);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = elRef.current;
      if (!el) return;
      if (settle.current) clearTimeout(settle.current);
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = e.clientX - cx;
      const dy   = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > distance) {
        if (active.current) {
          active.current = false;
          el.style.transform  = "translate(0,0)";
          el.style.transition = "transform 0.5s cubic-bezier(.175,.885,.32,1.275)";
        }
        return;
      }
      active.current = true;
      const pull = (1 - dist / distance) * strength;
      el.style.transform  = `translate(${dx * pull}px,${dy * pull}px)`;
      el.style.transition = "transform 0.07s ease";
    },
    [strength, distance]
  );

  const onMouseLeave = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    active.current = false;
    if (settle.current) clearTimeout(settle.current);
    el.style.transform  = "translate(0,0)";
    el.style.transition = "transform 0.55s cubic-bezier(.175,.885,.32,1.275)";
  }, []);

  const onMouseDown = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    el.style.transform  = "scale(0.91) translate(0,0)";
    el.style.transition = "transform 0.1s ease";
    settle.current = setTimeout(() => {
      if (!el) return;
      el.style.transform  = "scale(1)";
      el.style.transition = "transform 0.45s cubic-bezier(.175,.885,.32,1.275)";
    }, 130);
  }, []);

  return {
    ref: elRef as React.RefObject<HTMLButtonElement>,
    onMouseMove,
    onMouseLeave,
    onMouseDown,
  };
}
