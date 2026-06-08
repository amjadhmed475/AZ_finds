import { normalizeText } from "../utils/normalize.js";
import { recordApiCall } from "./apiUsageService.js";
import type { ProductImage, ImageType } from "../types/image.js";

type Glyph = "box" | "cup" | "panel" | "hook" | "ring";

interface Style { key: string; color: string; label: string; glyph: Glyph; }

// Refined palette + line-art glyph per product family (no emoji).
const STYLES: Style[] = [
  { key: "home organization", color: "#4f46e5", label: "Home Organization", glyph: "box" },
  { key: "storage products", color: "#4338ca", label: "Storage", glyph: "box" },
  { key: "containers", color: "#0d9488", label: "Container", glyph: "box" },
  { key: "office supplies", color: "#7c3aed", label: "Office", glyph: "box" },
  { key: "kitchen accessories", color: "#0891b2", label: "Kitchen", glyph: "cup" },
  { key: "cleaning tools", color: "#0e7490", label: "Cleaning", glyph: "cup" },
  { key: "mats", color: "#0f766e", label: "Mats", glyph: "panel" },
  { key: "racks", color: "#9333ea", label: "Racks", glyph: "panel" },
  { key: "trays", color: "#b45309", label: "Trays", glyph: "panel" },
  { key: "laptop accessories", color: "#1d4ed8", label: "Laptop", glyph: "panel" },
  { key: "phone accessories", color: "#2563eb", label: "Phone", glyph: "panel" },
  { key: "car interior accessories", color: "#475569", label: "Car", glyph: "panel" },
  { key: "hooks", color: "#0891b2", label: "Hooks", glyph: "hook" },
  { key: "clips", color: "#0ea5e9", label: "Clips", glyph: "hook" },
  { key: "holders", color: "#0284c7", label: "Holders", glyph: "hook" },
  { key: "pet accessories", color: "#d97706", label: "Pet", glyph: "ring" },
  { key: "fitness accessories", color: "#059669", label: "Fitness", glyph: "ring" },
  { key: "travel accessories", color: "#db2777", label: "Travel", glyph: "ring" },
  { key: "stands", color: "#6d28d9", label: "Stands", glyph: "ring" },
];
const GENERIC: Style = { key: "generic", color: "#475569", label: "Product", glyph: "box" };

const GLYPHS: Record<Glyph, string> = {
  box: `<rect x='185' y='120' width='110' height='98' rx='12'/><line x1='185' y1='152' x2='295' y2='152'/><rect x='223' y='130' width='34' height='11' rx='5.5'/>`,
  cup: `<path d='M201 132 L279 132 L271 214 Q240 224 209 214 Z'/><ellipse cx='240' cy='132' rx='39' ry='11'/>`,
  panel: `<rect x='178' y='128' width='124' height='90' rx='14'/><line x1='198' y1='156' x2='282' y2='156'/><line x1='198' y1='174' x2='282' y2='174'/><line x1='198' y1='192' x2='258' y2='192'/>`,
  hook: `<path d='M240 118 L240 176 Q240 208 270 208 Q289 208 289 189'/><circle cx='240' cy='118' r='8'/>`,
  ring: `<circle cx='240' cy='150' r='44'/><line x1='240' y1='194' x2='240' y2='210'/><rect x='208' y='210' width='64' height='11' rx='5.5'/>`,
};

function styleFor(productType: string, category: string): Style {
  const hay = normalizeText(`${productType} ${category}`);
  return STYLES.find((s) => hay.includes(s.key)) || GENERIC;
}

/** Premium designed-illustration data URI (clean line-art, gradient, no emoji). */
function premiumPlaceholder(style: Style, name: string): string {
  const c = style.color;
  const short = name.length > 34 ? name.slice(0, 33) + "…" : name;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360' viewBox='0 0 480 360'>` +
    `<defs>` +
    `<linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='#ffffff'/><stop offset='1' stop-color='${c}' stop-opacity='0.10'/></linearGradient>` +
    `<radialGradient id='glow' cx='0.5' cy='0.42' r='0.5'>` +
    `<stop offset='0' stop-color='${c}' stop-opacity='0.18'/><stop offset='1' stop-color='${c}' stop-opacity='0'/></radialGradient>` +
    `<pattern id='dots' width='22' height='22' patternUnits='userSpaceOnUse'><circle cx='1.4' cy='1.4' r='1.4' fill='${c}' fill-opacity='0.10'/></pattern>` +
    `</defs>` +
    `<rect width='480' height='360' fill='url(#bg)'/>` +
    `<rect width='480' height='360' fill='url(#dots)'/>` +
    `<rect width='480' height='360' fill='url(#glow)'/>` +
    `<g fill='none' stroke='${c}' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' opacity='0.92'>${GLYPHS[style.glyph]}</g>` +
    `<rect x='20' y='312' rx='12' ry='12' width='${Math.min(300, 70 + style.label.length * 9)}' height='28' fill='${c}' fill-opacity='0.12'/>` +
    `<text x='34' y='331' font-family='Inter,Arial,sans-serif' font-size='14' font-weight='700' fill='${c}'>${esc(style.label)}</text>` +
    `<text x='460' y='30' text-anchor='end' font-family='Inter,Arial,sans-serif' font-size='10' letter-spacing='1' fill='${c}' fill-opacity='0.55'>ILLUSTRATION</text>` +
    `<text x='240' y='268' text-anchor='middle' font-family='Inter,Arial,sans-serif' font-size='13' fill='#475569' opacity='0.7'>${esc(short)}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const today = () => new Date().toISOString().slice(0, 10);

export function placeholderImage(id: string, name: string, productType: string, category: string): ProductImage {
  const style = styleFor(productType, category);
  return {
    product_candidate_id: id,
    image_url: premiumPlaceholder(style, name),
    image_source_url: "",
    image_source_name: "Category illustration",
    image_type: "category_placeholder",
    image_confidence: "low",
    image_alt_text: `${name} — ${style.label} illustration (no live image source connected)`,
    image_last_checked: today(),
    attribution: "Generated category illustration (connect an image source for real photos)",
    fallback_used: true,
  };
}

export interface ImageEnrichOptions {
  allow_supplier_images?: boolean;
  allow_marketplace_images?: boolean;
  use_placeholders?: boolean;
  user_image_url?: string;
  supplier_image_url?: string;
  supplier_source_url?: string;
}

/** Sync: used during candidate build — always a premium placeholder (no network). */
export function buildProductImage(
  id: string, name: string, productType: string, category: string, opts: ImageEnrichOptions = {}
): ProductImage {
  if (opts.user_image_url) {
    return {
      product_candidate_id: id, image_url: opts.user_image_url, image_source_url: opts.user_image_url,
      image_source_name: "User provided", image_type: "user_provided_image", image_confidence: "high",
      image_alt_text: `${name} — user provided image`, image_last_checked: today(),
      attribution: "User-provided image URL", fallback_used: false,
    };
  }
  if (opts.allow_supplier_images && opts.supplier_image_url) {
    return {
      product_candidate_id: id, image_url: opts.supplier_image_url, image_source_url: opts.supplier_source_url || "",
      image_source_name: "Supplier listing", image_type: "supplier_image", image_confidence: "medium",
      image_alt_text: `${name} — supplier listing image`, image_last_checked: today(),
      attribution: "Supplier listing image (displayed by source URL; verify usage rights)", fallback_used: false,
    };
  }
  return placeholderImage(id, name, productType, category);
}

/**
 * Async real-photo resolver (used by the images:enrich script, not per render).
 * Priority: user URL → Pexels (PEXELS_API_KEY) → Openverse (commercial CC) → placeholder.
 * Real photos are displayed by source URL with attribution + confidence. Representative,
 * not necessarily the exact SKU — labeled accordingly.
 */
export async function resolveProductImage(
  id: string, name: string, productType: string, category: string, opts: ImageEnrichOptions = {}
): Promise<ProductImage> {
  if (opts.user_image_url || (opts.allow_supplier_images && opts.supplier_image_url)) {
    return buildProductImage(id, name, productType, category, opts);
  }
  const query = `${name.replace(/\(.*?\)/g, "").trim()} ${category}`.slice(0, 80);

  const pexKey = process.env.PEXELS_API_KEY;
  if (pexKey) {
    try {
      recordApiCall();
      const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`, { headers: { Authorization: pexKey } });
      if (r.ok) {
        const j: any = await r.json();
        const p = j.photos?.[0];
        if (p?.src?.large) {
          return {
            product_candidate_id: id, image_url: p.src.large, image_source_url: p.url || "",
            image_source_name: "Pexels", image_type: "marketplace_image", image_confidence: "medium",
            image_alt_text: p.alt || `${name} — representative product photo`, image_last_checked: today(),
            attribution: `Photo by ${p.photographer || "Pexels"} on Pexels (representative, not exact SKU)`, fallback_used: false,
          };
        }
      }
    } catch { /* fall through */ }
  }

  if (process.env.OPENVERSE_ENABLED === "true") {
    try {
      recordApiCall();
      const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&page_size=1`, { headers: { Accept: "application/json" } });
      if (r.ok) {
        const j: any = await r.json();
        const im = j.results?.[0];
        if (im?.url) {
          return {
            product_candidate_id: id, image_url: im.thumbnail || im.url, image_source_url: im.foreign_landing_url || "",
            image_source_name: im.source || "Openverse", image_type: "marketplace_image", image_confidence: "low",
            image_alt_text: im.title || `${name} — representative image`, image_last_checked: today(),
            attribution: `${im.creator || "Unknown"} via Openverse (${im.license || "CC"}) — representative, not exact SKU`, fallback_used: false,
          };
        }
      }
    } catch { /* fall through */ }
  }

  return placeholderImage(id, name, productType, category);
}
