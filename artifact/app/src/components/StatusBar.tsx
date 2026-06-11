import type { Dashboard } from "../lib/types";

interface Props { data: Dashboard; tab: string; }

export function StatusBar({ data, tab }: Props) {
  const s = data.summary;
  const mode = data.apiUsage?.data_mode ?? "estimate-level";

  return (
    <div className="status-bar">
      <span className="sb-seg">
        <span className="sb-dot-mini" />
        {tab.toUpperCase()}
      </span>
      <span className="sb-sep" />
      <span className="sb-seg">
        {s.productsScanned} scanned · <b>{s.productsPassed}</b> passed
      </span>
      <span className="sb-sep" />
      <span className="sb-seg sb-mode">
        {mode === "estimate-level" ? "⬡ estimate" : "◉ live"}
      </span>
      {data.batch?.batch_date && (
        <>
          <span className="sb-sep" />
          <span className="sb-seg">{data.batch.batch_date}</span>
        </>
      )}
      <span className="sb-spacer" />
      <span className="sb-hint"><kbd>⌘K</kbd> commands</span>
      <span className="sb-hint"><kbd>M</kbd> MAXIMUS</span>
      <span className="sb-brand">Yamari Group</span>
    </div>
  );
}
