import type { DashProduct } from "../lib/types";
import { getDirectSupplierLeads, categorizeProduct } from "../lib/chineseSuppliers";
import type { DirectManufacturerLead } from "../lib/chineseSuppliers";

const CATEGORY_LABELS: Record<string, string> = {
  toys: "Toys & Games",
  baby: "Baby & Infant",
  womens_clothing: "Women's Clothing",
  cosmetics: "Beauty & Cosmetics",
  electronics: "Electronics & Tech",
  kitchen: "Kitchen & Cooking",
  sports: "Sports & Fitness",
  pets: "Pet Supplies",
  health: "Health & Wellness",
  jewelry: "Jewelry & Accessories",
  bags: "Bags & Luggage",
  home: "Home & Décor",
  office: "Office & Stationery",
  general: "General Merchandise",
};

function ManufacturerCard({ lead, isPrimary }: { lead: DirectManufacturerLead; isPrimary: boolean }) {
  return (
    <a
      className={`dsup-card${isPrimary ? " dsup-card-primary" : ""}`}
      href={lead.search_url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="dsup-card-top">
        <div>
          <div className="dsup-card-name-row">
            <span className="dsup-platform-name">{lead.platform}</span>
            {isPrimary && <span className="dsup-best-badge">Best Match</span>}
          </div>
          <div className="dsup-url-row">
            <span className="dsup-url-text">{lead.url}</span>
            <span className="dsup-region">{lead.region}</span>
          </div>
        </div>
        <div className="dsup-badges">
          {lead.ddp_available ? (
            <span className="dsup-ddp-badge">DDP</span>
          ) : (
            <span className="dsup-no-ddp">FOB</span>
          )}
          <span className="dsup-type-badge">{lead.manufacturer_type}</span>
        </div>
      </div>

      <div className="dsup-stats-row">
        <div className="dsup-stat">
          <span className="dsup-stat-l">Min Order</span>
          <span className="dsup-stat-v">{lead.typical_moq}</span>
        </div>
        <div className="dsup-stat">
          <span className="dsup-stat-l">Lead Time</span>
          <span className="dsup-stat-v">{lead.typical_lead_days}d</span>
        </div>
      </div>

      {lead.ddp_available && (
        <div className="dsup-ddp-note">
          <span className="dsup-ddp-note-icon">&#10003;</span>
          <span>{lead.ddp_note}</span>
        </div>
      )}

      <p className="dsup-notes">{lead.notes}</p>

      <div className="dsup-cta">Search "{lead.platform}" for this product &rarr;</div>
    </a>
  );
}

export function DirectSupplierLeads({ product }: { product: DashProduct }) {
  const leads = getDirectSupplierLeads(product.name, product.category, 3);
  if (leads.length === 0) return null;

  const detectedCategory = categorizeProduct(product.name, product.category);
  const categoryLabel = CATEGORY_LABELS[detectedCategory] ?? "General";

  return (
    <div className="dsup-root">
      <div className="dsup-header">
        <div className="dsup-header-left">
          <div>
            <div className="dsup-title">Direct Chinese Manufacturer Sources</div>
            <div className="dsup-sub">Factory-direct B2B platforms — cut out the middleman and build your own supply chain</div>
          </div>
        </div>
        <span className="dsup-cat-pill">{categoryLabel}</span>
      </div>

      <div className="dsup-grid">
        {leads.map((lead, i) => (
          <ManufacturerCard key={lead.url} lead={lead} isPrimary={i === 0} />
        ))}
      </div>

      <div className="dsup-tip">
        <span className="dsup-tip-icon">&#9888;</span>
        <span>
          <b>DDP (Delivered Duty Paid)</b> means the supplier handles customs, duties, and last-mile delivery — your product arrives at your warehouse with no surprise fees. Always confirm DDP availability and destination country in writing before placing an order. Request samples before committing to a bulk run.
        </span>
      </div>
    </div>
  );
}
