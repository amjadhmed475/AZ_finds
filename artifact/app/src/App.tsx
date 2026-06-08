import { useEffect, useState } from "react";
import type { Dashboard as DashboardData } from "./lib/types";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState("");

  useEffect(() => {
    // Try the bundled sample produced by `npm run research:sample`.
    fetch("sample-dashboard.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => setError("no-sample"));
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

  if (data) return <Dashboard data={data} />;

  return (
    <div className="loader">
      <div className="loader-card">
        <h1>Amazon Product Research</h1>
        <p className="muted">
          Load a dashboard JSON from the MCP tool <code>generate_research_dashboard</code>,
          or run <code>npm run research:sample</code> in <code>/server</code> to generate one.
        </p>
        {error && error !== "no-sample" && <p className="error">{error}</p>}
        <div className="loader-actions">
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
        <button className="btn" onClick={() => loadFromText(raw)} disabled={!raw.trim()}>Load pasted JSON</button>
      </div>
    </div>
  );
}
