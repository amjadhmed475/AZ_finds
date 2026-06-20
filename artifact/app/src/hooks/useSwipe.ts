import { useRef } from "react";
interface SwipeHandlers { onTouchStart: (e: React.TouchEvent) => void; onTouchEnd: (e: React.TouchEvent) => void; }
export function useSwipe(
  onLeft?: () => void,
  onRight?: () => void,
  onDown?: () => void,
  threshold = 60
): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; },
    onTouchEnd: (e) => {
      if (!start.current) return;
      const dx = e.changedTouches[0].clientX - start.current.x;
      const dy = e.changedTouches[0].clientY - start.current.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        dx < 0 ? onLeft?.() : onRight?.();
      } else if (dy > threshold) { onDown?.(); }
      start.current = null;
    },
  };
}
