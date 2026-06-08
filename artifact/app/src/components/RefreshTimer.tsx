import { useEffect, useRef, useState } from "react";

/** Next 8:00 AM (local time) as epoch ms. */
function next8(): number {
  const now = new Date();
  const t = new Date(now);
  t.setHours(8, 0, 0, 0);
  if (now.getTime() >= t.getTime()) t.setDate(t.getDate() + 1);
  return t.getTime();
}

export function RefreshTimer() {
  const target = useRef(next8());
  const [ms, setMs] = useState(target.current - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      let left = target.current - Date.now();
      if (left <= 0) { target.current = next8(); left = target.current - Date.now(); }
      setMs(left);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const pct = 1 - ms / (24 * 3600 * 1000);

  return (
    <div className="rtimer">
      <div className="rtimer-scan" />
      <div className="rtimer-label"><span className="rtimer-pulse" /> NEXT SCAN · 08:00</div>
      <div className="rtimer-clock">
        <span className="rt-seg">{hh}</span><i>:</i><span className="rt-seg">{mm}</span><i>:</i><span className="rt-seg">{ss}</span>
      </div>
      <div className="rtimer-bar"><span style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }} /></div>
      <div className="rtimer-sub">auto-refresh 50 products + log top 5</div>
    </div>
  );
}
