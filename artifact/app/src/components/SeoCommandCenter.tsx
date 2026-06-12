import { useState } from "react";
import { Icon } from "./Icon";

type SeoTab = "keywords" | "audit" | "yamari";

interface Keyword {
  keyword: string;
  search_volume: number;
  competition: number;
  opportunity_score: number;
  recommended_bid: number;
}

interface AuditResult {
  score: number;
  issues: string[];
  recommendations: string[];
  optimized_title: string;
  optimized_bullets: string[];
}

interface YamariResult {
  brand_mentions: number;
  top_keywords: string[];
  seo_opportunities: string[];
  content_ideas: string[];
}

function OpportunityBadge({ score }: { score: number }) {
  const color = score > 80 ? "#10b981" : score > 60 ? "#f59e0b" : "#ef4444";
  const label = score > 80 ? "High" : score > 60 ? "Medium" : "Low";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "2px 7px",
      background: `${color}22`, color,
    }}>{label} ({score})</span>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const deg = (score / 100) * 180;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div className="seo-gauge-wrap">
        <div className="seo-gauge-bg" />
        <div
          className="seo-gauge-fill"
          style={{
            borderColor: `${color} ${color} transparent transparent`,
            transform: `rotate(${deg - 90}deg)`,
            transformOrigin: "50% 50%",
          }}
        />
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{score}</div>
      <div style={{ fontSize: 12, color: "var(--u-muted)" }}>SEO Score</div>
    </div>
  );
}

export function SeoCommandCenter() {
  const [activeTab, setActiveTab] = useState<SeoTab>("keywords");

  // Keywords tab state
  const [kwTitle, setKwTitle] = useState("");
  const [kwCategory, setKwCategory] = useState("");
  const [kwLoading, setKwLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [kwError, setKwError] = useState("");

  // Audit tab state
  const [auditTitle, setAuditTitle] = useState("");
  const [auditBullets, setAuditBullets] = useState("");
  const [auditDesc, setAuditDesc] = useState("");
  const [auditAsin, setAuditAsin] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState("");

  // Yamari tab state
  const [yamariLoading, setYamariLoading] = useState(false);
  const [yamariResult, setYamariResult] = useState<YamariResult | null>(null);
  const [yamariError, setYamariError] = useState("");

  const researchKeywords = async () => {
    if (!kwTitle.trim()) return;
    setKwLoading(true);
    setKwError("");
    try {
      const r = await fetch("/api/seo/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: kwTitle, category: kwCategory }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setKeywords(await r.json());
    } catch (e) {
      setKwError(e instanceof Error ? e.message : "Failed to research keywords");
    } finally {
      setKwLoading(false);
    }
  };

  const runAudit = async () => {
    if (!auditTitle.trim()) return;
    setAuditLoading(true);
    setAuditError("");
    try {
      const r = await fetch("/api/seo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: auditTitle,
          bullets: auditBullets.split("\n").filter(Boolean),
          description: auditDesc,
          asin: auditAsin,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setAuditResult(await r.json());
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setAuditLoading(false);
    }
  };

  const checkBrand = async () => {
    setYamariLoading(true);
    setYamariError("");
    try {
      const r = await fetch("/api/seo/yamari", { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setYamariResult(await r.json());
    } catch (e) {
      setYamariError(e instanceof Error ? e.message : "Brand check failed");
    } finally {
      setYamariLoading(false);
    }
  };

  const tabStyle = (t: SeoTab): React.CSSProperties => ({
    padding: "7px 18px",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: activeTab === t ? "var(--u-neon-blue)" : "transparent",
    color: activeTab === t ? "#fff" : "var(--u-muted)",
    transition: "all 0.15s",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    fontSize: 13,
    background: "var(--u-elevated)",
    border: "1px solid var(--u-border)",
    borderRadius: 8,
    color: "var(--u-text)",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnStyle = (loading: boolean): React.CSSProperties => ({
    padding: "9px 22px",
    fontSize: 13,
    fontWeight: 700,
    background: loading ? "var(--u-elevated)" : "var(--u-neon-blue)",
    color: loading ? "var(--u-muted)" : "#fff",
    border: "none",
    borderRadius: 8,
    cursor: loading ? "not-allowed" : "pointer",
    flexShrink: 0,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        <button style={tabStyle("keywords")} onClick={() => setActiveTab("keywords")}>Keywords</button>
        <button style={tabStyle("audit")} onClick={() => setActiveTab("audit")}>Listing Audit</button>
        <button style={tabStyle("yamari")} onClick={() => setActiveTab("yamari")}>Yamari Group</button>
      </div>

      {/* ── Keywords Tab ── */}
      {activeTab === "keywords" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--u-text)", marginBottom: 14 }}>Keyword Research</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                style={{ ...inputStyle, flex: 2 }}
                placeholder="Product title or topic…"
                value={kwTitle}
                onChange={e => setKwTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && researchKeywords()}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Category (optional)"
                value={kwCategory}
                onChange={e => setKwCategory(e.target.value)}
              />
              <button style={btnStyle(kwLoading)} onClick={researchKeywords} disabled={kwLoading}>
                {kwLoading ? "Researching…" : "Research"}
              </button>
            </div>
            {kwError && <div style={{ marginTop: 10, fontSize: 12, color: "#ef4444" }}>{kwError}</div>}
          </div>

          {keywords.length > 0 && (
            <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--u-border)", fontSize: 13, fontWeight: 700, color: "var(--u-text)" }}>
                {keywords.length} Keywords Found
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--u-elevated)" }}>
                      {["Keyword", "Opportunity", "Search Volume", "Competition", "Rec. Bid"].map(h => (
                        <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((kw, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--u-border)" }}>
                        <td style={{ padding: "10px 16px", color: "var(--u-text)", fontWeight: 500 }}>{kw.keyword}</td>
                        <td style={{ padding: "10px 16px" }}><OpportunityBadge score={kw.opportunity_score} /></td>
                        <td style={{ padding: "10px 16px", color: "var(--u-text-2)" }}>{kw.search_volume.toLocaleString()}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ flex: 1, height: 4, background: "var(--u-elevated)", borderRadius: 2, maxWidth: 60 }}>
                              <div style={{ width: `${kw.competition * 100}%`, height: "100%", background: kw.competition > 0.7 ? "#ef4444" : kw.competition > 0.4 ? "#f59e0b" : "#10b981", borderRadius: 2 }} />
                            </div>
                            <span style={{ color: "var(--u-muted)", fontSize: 10 }}>{(kw.competition * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", color: "var(--u-neon-gold)", fontWeight: 600 }}>${kw.recommended_bid.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Listing Audit Tab ── */}
      {activeTab === "audit" && (
        <div style={{ display: "flex", gap: 16 }}>
          {/* Input panel */}
          <div style={{ flex: 1, background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--u-text)" }}>Listing Auditor</div>
            <div>
              <label style={{ fontSize: 11, color: "var(--u-muted)", display: "block", marginBottom: 5 }}>ASIN (optional)</label>
              <input style={inputStyle} placeholder="B08XXXXX" value={auditAsin} onChange={e => setAuditAsin(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--u-muted)", display: "block", marginBottom: 5 }}>Product Title</label>
              <input style={inputStyle} placeholder="Full product title…" value={auditTitle} onChange={e => setAuditTitle(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--u-muted)", display: "block", marginBottom: 5 }}>Bullet Points (one per line)</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 100, fontFamily: "inherit" }}
                placeholder={"• Feature one\n• Feature two\n• Feature three"}
                value={auditBullets}
                onChange={e => setAuditBullets(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--u-muted)", display: "block", marginBottom: 5 }}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
                placeholder="Product description…"
                value={auditDesc}
                onChange={e => setAuditDesc(e.target.value)}
              />
            </div>
            <button style={btnStyle(auditLoading)} onClick={runAudit} disabled={auditLoading}>
              {auditLoading ? "Auditing…" : "Run Audit"}
            </button>
            {auditError && <div style={{ fontSize: 12, color: "#ef4444" }}>{auditError}</div>}
          </div>

          {/* Results panel */}
          {auditResult && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Score */}
              <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 24, display: "flex", justifyContent: "center" }}>
                <ScoreGauge score={auditResult.score} />
              </div>

              {/* Issues */}
              {auditResult.issues.length > 0 && (
                <div style={{ background: "var(--u-card)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Issues Found</div>
                  <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
                    {auditResult.issues.map((issue, i) => (
                      <li key={i} style={{ fontSize: 12, color: "var(--u-text-2)", lineHeight: 1.5 }}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {auditResult.recommendations.length > 0 && (
                <div style={{ background: "var(--u-card)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recommendations</div>
                  <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
                    {auditResult.recommendations.map((rec, i) => (
                      <li key={i} style={{ fontSize: 12, color: "var(--u-text-2)", lineHeight: 1.5 }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimized Title */}
              {auditResult.optimized_title && (
                <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--u-neon-blue)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Optimized Title</div>
                  <div style={{ fontSize: 13, color: "var(--u-text)", lineHeight: 1.5 }}>{auditResult.optimized_title}</div>
                </div>
              )}

              {/* Optimized Bullets */}
              {auditResult.optimized_bullets.length > 0 && (
                <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--u-neon-blue)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Optimized Bullets</div>
                  <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    {auditResult.optimized_bullets.map((b, i) => (
                      <li key={i} style={{ fontSize: 12, color: "var(--u-text)", lineHeight: 1.5 }}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!auditResult && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16 }}>
              <div style={{ textAlign: "center", color: "var(--u-muted)" }}>
                <Icon name="target" size={32} />
                <div style={{ marginTop: 12, fontSize: 13 }}>Enter listing details and run audit</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Yamari Group Tab ── */}
      {activeTab === "yamari" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--u-text)" }}>Yamari Group Brand Intelligence</div>
              <div style={{ fontSize: 12, color: "var(--u-muted)", marginTop: 4 }}>yamarigroup.com · SEO monitoring &amp; competitor analysis</div>
            </div>
            <button style={btnStyle(yamariLoading)} onClick={checkBrand} disabled={yamariLoading}>
              {yamariLoading ? "Checking…" : "Check Brand"}
            </button>
          </div>

          {yamariError && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "#ef4444" }}>
              {yamariError}
            </div>
          )}

          {yamariResult && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {/* Brand Mentions */}
              <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Brand Mentions</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "var(--u-neon-blue)" }}>{yamariResult.brand_mentions.toLocaleString()}</div>
              </div>

              {/* Top Keywords */}
              <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Top Keywords</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {yamariResult.top_keywords.map((kw, i) => (
                    <span key={i} style={{ fontSize: 11, background: "rgba(0,180,255,0.12)", color: "var(--u-neon-blue)", borderRadius: 6, padding: "3px 9px", fontWeight: 600 }}>{kw}</span>
                  ))}
                </div>
              </div>

              {/* SEO Opportunities */}
              <div style={{ background: "var(--u-card)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>SEO Opportunities</div>
                <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                  {yamariResult.seo_opportunities.map((opp, i) => (
                    <li key={i} style={{ fontSize: 12, color: "var(--u-text-2)", lineHeight: 1.5 }}>{opp}</li>
                  ))}
                </ul>
              </div>

              {/* Content Ideas */}
              <div style={{ background: "var(--u-card)", border: "1px solid rgba(245,165,36,0.2)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--u-neon-gold)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Content Ideas</div>
                <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                  {yamariResult.content_ideas.map((idea, i) => (
                    <li key={i} style={{ fontSize: 12, color: "var(--u-text-2)", lineHeight: 1.5 }}>{idea}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!yamariResult && !yamariLoading && (
            <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 16, padding: 48, textAlign: "center", color: "var(--u-muted)" }}>
              <Icon name="target" size={32} />
              <div style={{ marginTop: 12, fontSize: 13 }}>Click "Check Brand" to analyze yamarigroup.com SEO presence</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
