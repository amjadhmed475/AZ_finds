import { useState, useEffect, useCallback } from "react";
import { notify } from "./NotificationBus";

interface Supplier {
  id: string;
  name: string;
  country: string;
  contact_name?: string;
  email?: string;
  whatsapp?: string;
  lead_time_days: number;
  quality_rating: number;
  response_rating: number;
  payment_terms?: string;
  supplier_note?: string;
  product_count?: number;
  last_order_date?: string;
}

interface SupplierProduct {
  id: string;
  product_name: string;
  asin?: string;
  unit_cost_usd?: number;
  moq?: number;
}

interface Order {
  id: string;
  status: string;
  order_date?: string;
  total_units?: number;
  total_cost_usd?: number;
  po_number?: string;
}

interface SupplierNote {
  id: string;
  note: string;
  type: string;
  created_at: string;
}

interface SupplierDetail extends Supplier {
  products: SupplierProduct[];
  orders: Order[];
  notes: SupplierNote[];
}

interface ReorderRec {
  asin: string;
  product_name: string;
  days_of_supply: number;
  urgency: string;
  recommended_qty: number;
  estimated_cost: number;
}

const countryFlag = (c: string): string =>
  ({ CN: "🇨🇳", US: "🇺🇸", IN: "🇮🇳", VN: "🇻🇳", TH: "🇹🇭", BD: "🇧🇩" }[c] ?? "🏳️");

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= rating ? "#f59e0b" : "var(--u-dim)", fontSize: 12 }}>
          {i <= rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  draft: "#64748b",
  sent: "#3b82f6",
  confirmed: "#06b6d4",
  in_production: "#8b5cf6",
  shipped: "#f59e0b",
  received: "#10b981",
};

type DetailTab = "overview" | "products" | "orders" | "notes";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--u-elevated)", border: "1px solid var(--u-border)",
  color: "var(--u-text)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: "var(--u-muted)", marginBottom: 4,
  fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em",
};

export function SupplierCRM() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [reorderRecs, setReorderRecs] = useState<ReorderRec[]>([]);
  const [emailModal, setEmailModal] = useState<{ type: string; content: string } | null>(null);
  const [poModal, setPoModal] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Supplier>>({});

  // Add supplier form state
  const [form, setForm] = useState({
    name: "", contact_name: "", email: "", whatsapp: "",
    country: "CN", lead_time_days: 30, payment_terms: "",
  });

  const fetchSuppliers = useCallback(async () => {
    try {
      const r = await fetch("/api/suppliers");
      if (r.ok) {
        const d = await r.json();
        setSuppliers(Array.isArray(d) ? d : d.suppliers ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const r = await fetch(`/api/suppliers/${id}`);
      if (r.ok) setDetail(await r.json());
    } catch {
      // silent
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchReorderRecs = useCallback(async () => {
    try {
      const r = await fetch("/api/reorder-recommendations");
      if (r.ok) {
        const d = await r.json();
        setReorderRecs(Array.isArray(d) ? d : d.recommendations ?? []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
    fetchReorderRecs();
  }, [fetchSuppliers, fetchReorderRecs]);

  useEffect(() => {
    if (selected) fetchDetail(selected);
    else setDetail(null);
  }, [selected, fetchDetail]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        const d = await r.json();
        notify.success("Supplier added");
        setShowAddForm(false);
        setForm({ name: "", contact_name: "", email: "", whatsapp: "", country: "CN", lead_time_days: 30, payment_terms: "" });
        await fetchSuppliers();
        setSelected(d.id);
      } else {
        notify.error("Failed to add supplier");
      }
    } catch {
      notify.error("Network error");
    }
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    try {
      const r = await fetch(`/api/suppliers/${selected}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (r.ok) {
        notify.success("Supplier updated");
        setEditMode(false);
        await fetchDetail(selected);
        await fetchSuppliers();
      }
    } catch {
      notify.error("Update failed");
    }
  };

  const handleGenerateEmail = async (type: string) => {
    if (!selected) return;
    try {
      const r = await fetch(`/api/generate-supplier-email/${selected}?type=${type}`);
      if (r.ok) {
        const d = await r.json();
        setEmailModal({ type, content: d.email ?? d.content ?? "No content generated." });
      }
    } catch {
      notify.error("Failed to generate email");
    }
  };

  const handleGeneratePO = async (orderId: string) => {
    try {
      const r = await fetch(`/api/generate-po/${orderId}`, { method: "POST" });
      if (r.ok) {
        const d = await r.json();
        setPoModal(d.po_text ?? d.content ?? "PO generated.");
      }
    } catch {
      notify.error("Failed to generate PO");
    }
  };

  const handleAddNote = async () => {
    if (!selected || !newNote.trim()) return;
    try {
      const r = await fetch(`/api/suppliers/${selected}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote.trim(), type: noteType }),
      });
      if (r.ok) {
        setNewNote("");
        await fetchDetail(selected);
      }
    } catch {
      notify.error("Failed to add note");
    }
  };

  const handleCreateOrder = async (supplierId: string) => {
    try {
      const r = await fetch(`/api/suppliers/${supplierId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (r.ok) {
        notify.success("Order created");
        if (selected === supplierId) await fetchDetail(supplierId);
      }
    } catch {
      notify.error("Failed to create order");
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.country?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", gap: 0, background: "var(--u-void)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--u-border)" }}>

      {/* Left Panel — Supplier List */}
      <div style={{ width: 240, flexShrink: 0, borderRight: "1px solid var(--u-border)", display: "flex", flexDirection: "column", background: "var(--u-deep)" }}>
        {/* Search + Add */}
        <div style={{ padding: "12px", borderBottom: "1px solid var(--u-border)" }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{ width: "100%", padding: "8px", background: "var(--u-neon-blue)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 8 }}
          >+ Add Supplier</button>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }}
          />
        </div>

        {/* Supplier list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "20px", color: "var(--u-muted)", fontSize: 12, textAlign: "center" }}>Loading...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div style={{ padding: "20px", color: "var(--u-muted)", fontSize: 12, textAlign: "center" }}>No suppliers yet</div>
          ) : filteredSuppliers.map(s => (
            <div
              key={s.id}
              onClick={() => setSelected(s.id)}
              style={{
                padding: "12px", borderBottom: "1px solid var(--u-border)", cursor: "pointer",
                background: selected === s.id ? "rgba(59,130,246,0.12)" : "transparent",
                borderLeft: selected === s.id ? "2px solid var(--u-neon-blue)" : "2px solid transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (selected !== s.id) (e.currentTarget as HTMLDivElement).style.background = "var(--u-glass)"; }}
              onMouseLeave={e => { if (selected !== s.id) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{countryFlag(s.country)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Stars rating={s.quality_rating} />
                {s.last_order_date && (
                  <span style={{ fontSize: 10, color: "var(--u-muted)" }}>
                    {new Date(s.last_order_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center — Detail Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--u-muted)", fontSize: 14 }}>
            Select a supplier to view details
          </div>
        ) : detailLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--u-muted)", fontSize: 14 }}>Loading...</div>
        ) : detail ? (
          <>
            {/* Detail header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--u-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--u-text)", display: "flex", alignItems: "center", gap: 8 }}>
                  {countryFlag(detail.country)} {detail.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--u-muted)", marginTop: 2 }}>
                  Lead time: {detail.lead_time_days}d · {detail.payment_terms ?? "N/A"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {/* AI Email dropdown */}
                <div style={{ position: "relative" }}>
                  <select
                    onChange={e => { if (e.target.value) { handleGenerateEmail(e.target.value); e.target.value = ""; } }}
                    style={{ padding: "6px 10px", background: "var(--u-elevated)", border: "1px solid var(--u-border)", color: "var(--u-text)", borderRadius: 8, fontSize: 12, cursor: "pointer", outline: "none" }}
                    defaultValue=""
                  >
                    <option value="" disabled>AI Email...</option>
                    <option value="reorder">Reorder</option>
                    <option value="negotiate">Negotiate</option>
                    <option value="quality">Quality Issue</option>
                  </select>
                </div>
                {!editMode ? (
                  <button
                    onClick={() => { setEditMode(true); setEditData({ ...detail }); }}
                    style={{ padding: "6px 14px", background: "var(--u-elevated)", border: "1px solid var(--u-border)", color: "var(--u-text)", borderRadius: 8, fontSize: 12, cursor: "pointer" }}
                  >Edit</button>
                ) : (
                  <>
                    <button onClick={handleSaveEdit} style={{ padding: "6px 14px", background: "var(--u-neon-blue)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditMode(false)} style={{ padding: "6px 14px", background: "var(--u-elevated)", border: "1px solid var(--u-border)", color: "var(--u-muted)", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--u-border)", padding: "0 20px" }}>
              {(["overview", "products", "orders", "notes"] as DetailTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  style={{
                    padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                    color: detailTab === t ? "var(--u-neon-blue)" : "var(--u-muted)",
                    borderBottom: detailTab === t ? "2px solid var(--u-neon-blue)" : "2px solid transparent",
                  }}
                >{t}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

              {/* OVERVIEW TAB */}
              {detailTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {editMode ? (
                    <>
                      {[
                        { key: "name", label: "Name" },
                        { key: "contact_name", label: "Contact Name" },
                        { key: "email", label: "Email" },
                        { key: "whatsapp", label: "WhatsApp" },
                        { key: "country", label: "Country Code" },
                        { key: "payment_terms", label: "Payment Terms" },
                        { key: "lead_time_days", label: "Lead Time (days)", type: "number" },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={labelStyle}>{f.label}</label>
                          <input
                            type={f.type ?? "text"}
                            value={(editData as Record<string, unknown>)[f.key] as string ?? ""}
                            onChange={e => setEditData(prev => ({ ...prev, [f.key]: f.type === "number" ? parseInt(e.target.value) : e.target.value }))}
                            style={inputStyle}
                          />
                        </div>
                      ))}
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={labelStyle}>Notes</label>
                        <textarea
                          value={editData.supplier_note ?? ""}
                          onChange={e => setEditData(prev => ({ ...prev, supplier_note: e.target.value }))}
                          rows={3}
                          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {[
                        { label: "Contact", value: detail.contact_name },
                        { label: "Email", value: detail.email },
                        { label: "WhatsApp", value: detail.whatsapp },
                        { label: "Country", value: `${countryFlag(detail.country)} ${detail.country}` },
                        { label: "Payment Terms", value: detail.payment_terms },
                        { label: "Lead Time", value: `${detail.lead_time_days} days` },
                      ].map(row => row.value ? (
                        <div key={row.label}>
                          <div style={labelStyle}>{row.label}</div>
                          <div style={{ fontSize: 14, color: "var(--u-text)" }}>{row.value}</div>
                        </div>
                      ) : null)}
                      <div>
                        <div style={labelStyle}>Quality Rating</div>
                        <Stars rating={detail.quality_rating} />
                      </div>
                      <div>
                        <div style={labelStyle}>Response Rating</div>
                        <Stars rating={detail.response_rating} />
                      </div>
                      {detail.supplier_note && (
                        <div style={{ gridColumn: "span 2" }}>
                          <div style={labelStyle}>Notes</div>
                          <div style={{ fontSize: 13, color: "var(--u-muted)", lineHeight: 1.6 }}>{detail.supplier_note}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* PRODUCTS TAB */}
              {detailTab === "products" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <button
                      onClick={() => notify.info("Add product form coming soon")}
                      style={{ padding: "6px 14px", background: "var(--u-neon-blue)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >+ Add Product</button>
                  </div>
                  {detail.products.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--u-muted)", fontSize: 13, padding: 32 }}>No products linked yet</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--u-border)" }}>
                          {["Product", "ASIN", "Unit Cost", "MOQ"].map(h => (
                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--u-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.products.map(p => (
                          <tr key={p.id} style={{ borderBottom: "1px solid var(--u-border)" }}>
                            <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--u-text)" }}>{p.product_name}</td>
                            <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--u-muted)" }}>{p.asin ?? "—"}</td>
                            <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--u-text)" }}>{p.unit_cost_usd ? `$${p.unit_cost_usd}` : "—"}</td>
                            <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--u-text)" }}>{p.moq?.toLocaleString() ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ORDERS TAB */}
              {detailTab === "orders" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <button
                      onClick={() => handleCreateOrder(detail.id)}
                      style={{ padding: "6px 14px", background: "var(--u-neon-blue)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >+ New Order</button>
                  </div>
                  {detail.orders.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--u-muted)", fontSize: 13, padding: 32 }}>No orders yet</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {detail.orders.map(o => {
                        const statusColor = ORDER_STATUS_COLOR[o.status] ?? "#64748b";
                        return (
                          <div key={o.id} style={{ background: "var(--u-elevated)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--u-border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)" }}>
                                  {o.po_number ?? `Order #${o.id.slice(0, 8)}`}
                                </div>
                                {o.order_date && (
                                  <div style={{ fontSize: 11, color: "var(--u-muted)", marginTop: 2 }}>
                                    {new Date(o.order_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, background: `${statusColor}22`, color: statusColor, borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" }}>
                                {o.status.replace("_", " ")}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--u-muted)" }}>
                              {o.total_units && <span>{o.total_units.toLocaleString()} units</span>}
                              {o.total_cost_usd && <span>${o.total_cost_usd.toLocaleString()}</span>}
                            </div>
                            <div style={{ marginTop: 10 }}>
                              <button
                                onClick={() => handleGeneratePO(o.id)}
                                style={{ fontSize: 11, padding: "4px 10px", background: "var(--u-card)", border: "1px solid var(--u-border)", color: "var(--u-text)", borderRadius: 6, cursor: "pointer" }}
                              >Generate PO</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* NOTES TAB */}
              {detailTab === "notes" && (
                <div>
                  {/* Timeline */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {detail.notes.length === 0 ? (
                      <div style={{ textAlign: "center", color: "var(--u-muted)", fontSize: 13, padding: 24 }}>No notes yet</div>
                    ) : detail.notes.map(n => (
                      <div key={n.id} style={{ background: "var(--u-elevated)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--u-border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: "var(--u-card)", color: "var(--u-muted)", borderRadius: 4, padding: "1px 6px", textTransform: "uppercase" }}>{n.type}</span>
                          <span style={{ fontSize: 11, color: "var(--u-muted)" }}>
                            {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--u-text)", lineHeight: 1.5 }}>{n.note}</div>
                      </div>
                    ))}
                  </div>

                  {/* Add note form */}
                  <div style={{ borderTop: "1px solid var(--u-border)", paddingTop: 16 }}>
                    <textarea
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", marginBottom: 8 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <select value={noteType} onChange={e => setNoteType(e.target.value)}
                        style={{ background: "var(--u-elevated)", border: "1px solid var(--u-border)", color: "var(--u-muted)", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none" }}>
                        {["general", "negotiation", "quality", "shipment", "payment"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        style={{ padding: "6px 16px", background: newNote.trim() ? "var(--u-neon-blue)" : "var(--u-elevated)", color: newNote.trim() ? "#fff" : "var(--u-muted)", border: "none", borderRadius: 6, cursor: newNote.trim() ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600 }}
                      >Add Note</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Right Panel — Reorder Alerts */}
      <div style={{ width: 300, flexShrink: 0, borderLeft: "1px solid var(--u-border)", display: "flex", flexDirection: "column", background: "var(--u-deep)" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--u-border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)" }}>Reorder Alerts</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {reorderRecs.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--u-muted)", fontSize: 13 }}>All stock levels nominal</div>
          ) : reorderRecs.map(rec => {
            const color = rec.urgency === "critical" ? "#ef4444" : rec.urgency === "soon" ? "#f59e0b" : "#3b82f6";
            return (
              <div key={rec.asin} style={{ padding: "12px 14px", borderBottom: "1px solid var(--u-border)", borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--u-text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.product_name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: `${color}22`, color, borderRadius: 4, padding: "1px 6px" }}>{rec.days_of_supply}d</span>
                  <span style={{ fontSize: 10, color: "var(--u-muted)" }}>{rec.recommended_qty?.toLocaleString()} units</span>
                </div>
                <button
                  onClick={() => {
                    setSelected(suppliers[0]?.id ?? null);
                    setDetailTab("orders");
                  }}
                  style={{ fontSize: 10, padding: "4px 8px", background: color, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}
                >Create Order</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddForm && (
        <>
          <div onClick={() => setShowAddForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 990, backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "var(--u-deep)", border: "1px solid var(--u-border)", borderRadius: 16,
            padding: 28, width: 440, zIndex: 1000,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--u-text)", marginBottom: 20 }}>Add Supplier</div>
            <form onSubmit={handleAddSupplier}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { key: "name", label: "Company Name", required: true },
                  { key: "contact_name", label: "Contact Name" },
                  { key: "email", label: "Email" },
                  { key: "whatsapp", label: "WhatsApp" },
                  { key: "payment_terms", label: "Payment Terms" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input
                      type="text"
                      required={f.required}
                      value={(form as Record<string, unknown>)[f.key] as string ?? ""}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Country</label>
                  <select value={form.country} onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    {[["CN", "🇨🇳 China"], ["US", "🇺🇸 USA"], ["IN", "🇮🇳 India"], ["VN", "🇻🇳 Vietnam"], ["TH", "🇹🇭 Thailand"], ["BD", "🇧🇩 Bangladesh"]].map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Lead Time (days)</label>
                  <input
                    type="number"
                    value={form.lead_time_days}
                    onChange={e => setForm(prev => ({ ...prev, lead_time_days: parseInt(e.target.value) || 30 }))}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddForm(false)}
                  style={{ padding: "8px 16px", background: "var(--u-elevated)", border: "1px solid var(--u-border)", color: "var(--u-muted)", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: "8px 20px", background: "var(--u-neon-blue)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Email Modal */}
      {emailModal && (
        <>
          <div onClick={() => setEmailModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 990, backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "var(--u-deep)", border: "1px solid var(--u-border)", borderRadius: 16,
            padding: 28, width: 520, zIndex: 1000, maxHeight: "80vh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--u-text)", textTransform: "capitalize" }}>{emailModal.type} Email</div>
              <button onClick={() => setEmailModal(null)} style={{ background: "none", border: "none", color: "var(--u-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <pre style={{ flex: 1, overflowY: "auto", fontSize: 13, color: "var(--u-text)", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "var(--u-elevated)", padding: 16, borderRadius: 8, fontFamily: "inherit", marginBottom: 16 }}>
              {emailModal.content}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(emailModal.content); notify.success("Email copied to clipboard"); }}
              style={{ padding: "10px", background: "var(--u-neon-blue)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >Copy to Clipboard</button>
          </div>
        </>
      )}

      {/* PO Modal */}
      {poModal && (
        <>
          <div onClick={() => setPoModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 990, backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "var(--u-deep)", border: "1px solid var(--u-border)", borderRadius: 16,
            padding: 28, width: 560, zIndex: 1000, maxHeight: "80vh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--u-text)" }}>Purchase Order</div>
              <button onClick={() => setPoModal(null)} style={{ background: "none", border: "none", color: "var(--u-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <pre style={{ flex: 1, overflowY: "auto", fontSize: 12, color: "var(--u-text)", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "var(--u-elevated)", padding: 16, borderRadius: 8, fontFamily: "monospace", marginBottom: 16 }}>
              {poModal}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(poModal); notify.success("PO copied to clipboard"); }}
              style={{ padding: "10px", background: "var(--u-neon-blue)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >Copy PO Text</button>
          </div>
        </>
      )}
    </div>
  );
}
