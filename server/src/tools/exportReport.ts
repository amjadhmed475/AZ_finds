import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ProductCandidate } from "../types/product.js";
import type { ProfitabilityAnalysis } from "../types/profitability.js";
import type { SupplierOption } from "../types/supplier.js";
import { fmtUSD } from "../utils/currency.js";

export interface ExportInput {
  format: "markdown" | "csv" | "xlsx" | "pdf";
  products: ProductCandidate[];
  profitability?: ProfitabilityAnalysis[];
  suppliers?: SupplierOption[];
  include_citations?: boolean;
  include_supplier_links?: boolean;
  out_dir?: string;
}

export interface ExportResult {
  file_path: string | null;
  report_summary: string;
  content?: string;
  note?: string;
}

export async function exportReport(input: ExportInput): Promise<ExportResult> {
  const dir = input.out_dir || join(process.cwd(), "reports");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const profById = new Map((input.profitability ?? []).map((p) => [p.product_candidate_id, p]));
  const supByProduct = new Map<string, SupplierOption[]>();
  for (const s of input.suppliers ?? []) {
    (supByProduct.get(s.product_candidate_id) ?? supByProduct.set(s.product_candidate_id, []).get(s.product_candidate_id)!).push(s);
  }

  if (input.format === "csv") {
    const header = ["rank", "grade", "grade_label", "image_type", "name", "category", "sale_price", "monthly_sales", "monthly_revenue", "landed_cost", "net_profit", "roi_%", "margin_%", "seller_count", "rating", "trend", "gating", "risk", "score", "action"];
    const rows = input.products.map((p, i) => {
      const f = profById.get(p.id);
      return [i + 1, p.grade?.grade ?? "", q(p.grade?.grade_label ?? ""), p.image?.image_type ?? "", q(p.name), q(p.category), p.estimated_sale_price, p.estimated_monthly_sales, p.estimated_revenue, f?.landed_cost ?? "", f?.net_profit ?? "", f?.roi_percent ?? "", f?.net_margin_percent ?? "", p.seller_count, p.review_rating_average, p.trend_status, q(p.gating_status), p.risk_level, p.opportunity_score, q(p.recommended_action)].join(",");
    });
    const content = [header.join(","), ...rows].join("\n");
    const file = join(dir, `amazon-research-${stamp}.csv`);
    await writeFile(file, content, "utf8");
    return { file_path: file, report_summary: `CSV with ${input.products.length} products.`, content };
  }

  if (input.format === "markdown") {
    const content = renderMarkdown(input, profById, supByProduct);
    const file = join(dir, `amazon-research-${stamp}.md`);
    await writeFile(file, content, "utf8");
    return { file_path: file, report_summary: `Markdown report with ${input.products.length} products.`, content };
  }

  // xlsx / pdf: emit a JSON payload the Skill's python exporters consume.
  const payloadFile = join(dir, `amazon-research-${stamp}.json`);
  await writeFile(payloadFile, JSON.stringify({ products: input.products, profitability: input.profitability ?? [], suppliers: input.suppliers ?? [] }, null, 2), "utf8");
  return {
    file_path: payloadFile,
    report_summary: `Wrote research payload for ${input.format.toUpperCase()} export.`,
    note: `Generate the ${input.format.toUpperCase()} with the Skill: python skill/scripts/export_${input.format}.py "${payloadFile}"`,
  };
}

function q(s: string): string {
  return `"${String(s).replace(/"/g, '""')}"`;
}

function renderMarkdown(
  input: ExportInput,
  profById: Map<string, ProfitabilityAnalysis>,
  supByProduct: Map<string, SupplierOption[]>
): string {
  const lines: string[] = [];
  lines.push(`# Amazon Product Research Report`);
  lines.push(`_Generated ${new Date().toISOString().slice(0, 10)}. All figures are estimates. Verify in Seller Central before buying._\n`);
  lines.push(`| # | Grade | Product | Category | Price | Monthly Sales | Net/Unit | ROI | Margin | Gating | Risk | Score |`);
  lines.push(`|---|-------|---------|----------|-------|---------------|----------|-----|--------|--------|------|-------|`);
  input.products.forEach((p, i) => {
    const f = profById.get(p.id);
    lines.push(`| ${i + 1} | ${p.grade?.grade ?? "—"} | ${p.name} | ${p.category} | ${fmtUSD(p.estimated_sale_price)} | ${p.estimated_monthly_sales} | ${f ? fmtUSD(f.net_profit) : "—"} | ${f?.roi_percent ?? "—"}% | ${f?.net_margin_percent ?? "—"}% | ${p.gating_status} | ${p.risk_level} | ${p.opportunity_score} |`);
  });
  lines.push("");

  for (const p of input.products) {
    const f = profById.get(p.id);
    const sup = supByProduct.get(p.id) ?? [];
    lines.push(`## ${p.name}  —  Score ${p.opportunity_score}/100`);
    lines.push(`**Category:** ${p.category} · **Type:** ${p.product_type} · **Generic confidence:** ${p.generic_confidence}`);
    lines.push(`**Sale price:** ${fmtUSD(p.estimated_sale_price)} · **Monthly sales (est):** ${p.estimated_monthly_sales} · **Revenue (est):** ${fmtUSD(p.estimated_revenue)}`);
    lines.push(`**Demand:** ${p.demand_consistency} · **Trend:** ${p.trend_status} · **Sellers:** ${p.seller_count} · **Rating:** ${p.review_rating_average}`);
    if (f) {
      lines.push(`**Landed:** ${fmtUSD(f.landed_cost)} · **FBA:** ${fmtUSD(f.fba_fee)} · **Referral:** ${fmtUSD(f.amazon_referral_fee)} · **Net/unit:** ${fmtUSD(f.net_profit)} · **ROI:** ${f.roi_percent}% · **Margin:** ${f.net_margin_percent}% · **Break-even:** ${fmtUSD(f.break_even_price)}`);
    }
    lines.push(`**Gating:** ${p.gating_status} (confidence ${p.gated_confidence}) · **Risk:** ${p.risk_level}`);
    if (input.include_supplier_links !== false && sup.length) {
      lines.push(`\n**Suppliers:**`);
      for (const s of sup.slice(0, 6)) {
        lines.push(`- ${s.supplier_name} (${s.region}) — ${fmtUSD(s.unit_cost_min)}–${fmtUSD(s.unit_cost_max)}/unit, MOQ ${s.moq}, match ${s.match_quality_score}, risk ${s.supplier_risk} — ${s.direct_product_url}`);
      }
    }
    if (input.include_citations) {
      lines.push(`\n**Citations:**`);
      for (const c of p.citations.slice(0, 8)) lines.push(`- ${c.source_name} (${c.reliability_score}) — ${c.claim_supported} — ${c.source_url}`);
    }
    lines.push(`\n**Manual verification:** confirm gating, brand/generic status, and fees in Seller Central + the Amazon Revenue Calculator before purchase.\n`);
  }
  return lines.join("\n");
}
