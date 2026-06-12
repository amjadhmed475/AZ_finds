import { useCallback, useEffect, useState } from "react";
import type { Dashboard as DashboardData } from "./lib/types";
import { Dashboard } from "./components/Dashboard";
import { SplashScreen } from "./components/SplashScreen";
import { MobileWarRoom } from "./components/MobileWarRoom";
import { LoginPage } from "./components/LoginPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useIsMobile } from "./hooks/useIsMobile";

/* Register service worker for PWA */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

function AppInner() {
  const [data, setData]         = useState<DashboardData | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [raw, setRaw]           = useState("");
  const [splashDone, setSplashDone] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const { user, loading: authLoading, hasUsers } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch("sample-dashboard.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => setError("no-sample"));
  }, []);

  const onSplashDone = useCallback(() => {
    setSplashDone(true);
    setTimeout(() => setShowLoader(true), 80);
  }, []);

  const loadFromText = (text: string) => {
    try {
      setData(JSON.parse(text));
      setError(null);
    } catch {
      setError("Invalid JSON. Paste the output of generate_research_dashboard.");
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(loadFromText);
  };

  /* Auth gate: only shown when team mode is active (hasUsers === true) and user not logged in */
  if (!authLoading && hasUsers && !user) {
    return <LoginPage />;
  }

  if (!splashDone) {
    return <SplashScreen onDone={onSplashDone} />;
  }

  if (data) {
    return isMobile
      ? <MobileWarRoom data={data} />
      : <Dashboard data={data} />;
  }

  if (!showLoader) return null;

  return (
    <div className="loader">
      <div className="loader-card">
        <h1>AZ Finds — Seller Research</h1>
        <p className="muted" style={{ marginBottom: 16, lineHeight: 1.6 }}>
          Load a dashboard JSON from the MCP tool <code>generate_research_dashboard</code>,
          or run <code>npm run research:sample</code> in <code>/server</code> to generate one.
        </p>
        {error && error !== "no-sample" && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
        <div style={{ marginBottom: 14 }}>
          <label className="btn primary">
            Upload dashboard.json
            <input type="file" accept="application/json" onChange={onFile} hidden />
          </label>
        </div>
        <textarea
          className="loader-paste"
          placeholder="…or paste dashboard JSON here"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <button className="btn" onClick={() => loadFromText(raw)} disabled={!raw.trim()}>
          Load pasted JSON
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
