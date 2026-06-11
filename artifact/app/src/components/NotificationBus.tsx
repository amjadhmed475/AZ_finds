import { useState, useEffect, useCallback } from "react";

type ToastType = "info" | "success" | "warning" | "error";
interface Toast { id: number; type: ToastType; message: string; }

/* ── Global event-bus for fire-and-forget notifications ── */
let _id = 0;
export const notify = {
  info:    (message: string) => fire("info",    message),
  success: (message: string) => fire("success", message),
  warning: (message: string) => fire("warning", message),
  error:   (message: string) => fire("error",   message),
};
function fire(type: ToastType, message: string) {
  window.dispatchEvent(new CustomEvent("az:notify", { detail: { type, message, id: ++_id } }));
}

const ICON: Record<ToastType, string> = {
  info:    "ℹ",
  success: "✓",
  warning: "⚠",
  error:   "✕",
};

export function NotificationBus() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const h = (e: Event) => {
      const { id, type, message } = (e as CustomEvent).detail as Toast;
      setToasts(prev => [...prev.slice(-4), { id, type, message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
    };
    window.addEventListener("az:notify", h);
    return () => window.removeEventListener("az:notify", h);
  }, []);

  const dismiss = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);

  if (!toasts.length) return null;

  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast-icon">{ICON[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-x" onClick={() => dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
