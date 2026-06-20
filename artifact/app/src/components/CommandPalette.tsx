import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "./Icon";

type Tab = "sourcing"|"overview"|"products"|"wholesale"|"details"|"suppliers"|
           "verify"|"live"|"ppc"|"capital"|"launch"|"watchlist"|"rejected"|"sources"|"help";

const TABS: Array<{ id: Tab; label: string; icon: string; director: string }> = [
  { id:"overview",  label:"Overview",         icon:"dashboard", director:"ARIA"     },
  { id:"sourcing",  label:"Sourcing",          icon:"target",    director:"ATLAS"    },
  { id:"products",  label:"Products",          icon:"grid",      director:"SCOUT"    },
  { id:"wholesale", label:"Wholesale Finder",  icon:"box",       director:"MERIDIAN" },
  { id:"details",   label:"Product Details",   icon:"list",      director:"NEXUS"    },
  { id:"suppliers", label:"Suppliers",         icon:"truck",     director:"FORGE"    },
  { id:"verify",    label:"Supplier Check",    icon:"shield",    director:"SENTINEL" },
  { id:"live",      label:"Live + Store",      icon:"activity",  director:"PULSE"    },
  { id:"ppc",       label:"PPC Manager",       icon:"megaphone", director:"APEX"     },
  { id:"capital",   label:"Capital Planner",   icon:"wallet",    director:"VAULT"    },
  { id:"launch",    label:"Launch Readiness",  icon:"rocket",    director:"IGNITE"   },
  { id:"watchlist", label:"Watchlist",         icon:"star",      director:"ORACLE"   },
  { id:"rejected",  label:"Rejected",          icon:"ban",       director:"SHIELD"   },
  { id:"sources",   label:"Data Sources",      icon:"database",  director:"MATRIX"   },
  { id:"help",      label:"Help Center",       icon:"help",      director:"SAGE"     },
];

const MAXIMUS_QUERIES = [
  { label: "Best opportunity today",    q: "What is the single best product opportunity in today's batch and why?" },
  { label: "Risk assessment",           q: "What are the top risk factors across the current product batch?" },
  { label: "PPC strategy",             q: "What PPC strategy should I use for the highest-graded products?" },
  { label: "Capital allocation",       q: "How should I allocate $10,000 across the current opportunities?" },
  { label: "Competitor analysis",      q: "Which products face the strongest competition and how do I position against it?" },
  { label: "Supplier recommendations", q: "Which supplier sources should I prioritize and why?" },
];

interface Props { onTab: (t: Tab) => void; }

export function CommandPalette({ onTab }: Props) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* toggle ⌘K / Ctrl+K */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); setOpen(o => !o); setQuery(""); setCursor(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 40); }, [open]);

  /* command list */
  const allCmds = [
    ...TABS.map(t => ({
      id:   `nav:${t.id}`, group: "Navigate",
      icon: t.icon, label: `Go to ${t.label}`,
      sub:  `Director: ${t.director}`,
      keys: [t.label.toLowerCase(), t.id, t.director.toLowerCase()],
      run:  () => { onTab(t.id); fire(); },
    })),
    ...MAXIMUS_QUERIES.map(m => ({
      id:   `mx:${m.label}`, group: "Ask MAXIMUS",
      icon: "activity", label: m.label,
      sub:  "claude-fable-5",
      keys: [m.label.toLowerCase(), "maximus", "ask"],
      run:  () => {
        window.dispatchEvent(new CustomEvent("maximus:query", { detail: { query: m.q } }));
        fire();
      },
    })),
  ];

  const fire = () => { setOpen(false); setQuery(""); };

  const q = query.toLowerCase().trim();
  const filtered = q
    ? allCmds.filter(c => c.label.toLowerCase().includes(q) || c.keys.some(k => k.includes(q)))
    : allCmds.slice(0, 14);

  /* arrow nav */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); filtered[cursor]?.run(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, cursor, filtered]);

  if (!open) return null;

  /* group by */
  const grouped: Record<string, typeof filtered> = {};
  for (const c of filtered) { (grouped[c.group] ??= []).push(c); }

  return (
    <div className="cmd-overlay" onClick={fire}>
      <div className="cmd-modal" onClick={e => e.stopPropagation()}>
        <div className="cmd-search-row">
          <svg className="cmd-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Search commands, tabs, ask MAXIMUS…"
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-esc">esc</kbd>
        </div>

        <div className="cmd-results">
          {Object.entries(grouped).map(([group, cmds]) => (
            <div key={group} className="cmd-group">
              <div className="cmd-group-label">{group}</div>
              {cmds.map((cmd) => {
                const idx = filtered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    className={`cmd-item${idx === cursor ? " cmd-item--on" : ""}`}
                    onClick={cmd.run}
                    onMouseEnter={() => setCursor(idx)}
                  >
                    <span className={`cmd-icon${cmd.group === "Ask MAXIMUS" ? " cmd-icon--maximus" : ""}`}>
                      {cmd.group === "Ask MAXIMUS"
                        ? "M"
                        : <Icon name={cmd.icon} size={14} />}
                    </span>
                    <div className="cmd-text">
                      <span className="cmd-label">{cmd.label}</span>
                      {cmd.sub && <span className="cmd-sub">{cmd.sub}</span>}
                    </div>
                    <span className="cmd-group-tag">{group}</span>
                    {idx === cursor && <span className="cmd-enter">↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="cmd-empty">No results for "<em>{query}</em>"</div>
          )}
        </div>

        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
          <span className="cmd-footer-right"><kbd>⌘K</kbd> · Command Palette</span>
        </div>
      </div>
    </div>
  );
}
