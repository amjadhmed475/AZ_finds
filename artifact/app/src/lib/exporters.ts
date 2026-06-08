import type { Dashboard, DashProduct, Supplier } from "./types";

type Cell = string | number | boolean | null | undefined;
type Row = Cell[];

interface SheetSpec {
  name: string;
  rows: Row[];
}

const money = (value: number | undefined) => Number((value ?? 0).toFixed(2));
const pct = (value: number | undefined) => Number((value ?? 0).toFixed(1));

export function downloadProductsCsv(products: DashProduct[], filename = "az-finds-opportunities.csv") {
  const csv = productsToCsv(products);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

export function productsToCsv(products: DashProduct[]) {
  return "\uFEFF" + rowsToCsv(opportunityRows(products));
}

export function downloadProductsWorkbook(data: Dashboard, products: DashProduct[], filename = "az-finds-research-workbook.xlsx") {
  downloadBlob(createProductsWorkbookBlob(data, products), filename);
}

export function createProductsWorkbookBlob(data: Dashboard, products: DashProduct[]) {
  const sheets: SheetSpec[] = [
    {
      name: "Summary",
      rows: [
        ["Metric", "Value"],
        ["Exported products", products.length],
        ["Products scanned", data.summary.productsScanned],
        ["Best score", data.summary.bestScore],
        ["Highest ROI %", data.summary.highestRoi],
        ["Average margin %", data.summary.averageMargin],
        ["Likely ungated", data.summary.likelyUngatedCount],
        ["Manual checks required", data.summary.manualCheckRequiredCount],
        ["Data mode", data.mode ?? "estimate"],
        ["Generated", new Date().toISOString()],
      ],
    },
    { name: "Opportunities", rows: opportunityRows(products) },
    { name: "Suppliers", rows: supplierRows(products) },
    { name: "Checks", rows: checkRows(products) },
    {
      name: "Read Me",
      rows: [
        ["AZ Finds export notes"],
        ["All figures are estimates until verified in Seller Central, supplier quotes, Amazon fee previews, and live Ads reports."],
        ["Representative photos are not proof of the exact SKU. Confirm exact supplier item, materials, dimensions, packaging, and compliance docs before ordering."],
        ["Grades can be capped in estimate mode. Connect live data sources to unlock higher-confidence scoring."],
      ],
    },
  ];
  return buildXlsx(sheets);
}

function opportunityRows(products: DashProduct[]): Row[] {
  const header = [
    "Rank",
    "Product ID",
    "Name",
    "Category",
    "Grade",
    "Grade confidence",
    "Score",
    "Bucket",
    "Sale price",
    "Monthly sales",
    "Monthly revenue",
    "Unit cost",
    "Landed cost",
    "FBA fee",
    "Referral fee",
    "Net profit",
    "ROI %",
    "Margin %",
    "Break-even price",
    "Sellers",
    "Rating",
    "Reviews",
    "Trend",
    "Gating",
    "Risk",
    "Best supplier",
    "Supplier site",
    "Supplier landed",
    "Supplier MOQ",
    "Supplier lead time",
    "Supplier match",
    "Recommended action",
  ];
  return [
    header,
    ...products.map((p, index) => {
      const best = p.suppliers?.[0];
      return [
        index + 1,
        p.id,
        p.name,
        p.category,
        p.grade?.grade ?? "",
        p.grade?.confidence_label ?? "",
        pct(p.opportunity_score),
        p.bucket ?? "top",
        money(p.estimatedSalePrice),
        p.estimatedMonthlySales,
        money(p.estimatedRevenue),
        money(p.profitability.unitCost),
        money(p.profitability.landedCost),
        money(p.profitability.fbaFee),
        money(p.profitability.referralFee),
        money(p.profitability.netProfit),
        pct(p.profitability.roi),
        pct(p.profitability.margin),
        money(p.profitability.breakEvenPrice),
        p.seller_count,
        p.reviewRating,
        p.reviewCount,
        p.trend_status,
        p.gating_status,
        p.risk_level,
        best?.supplier_name ?? "",
        best?.supplier_site ?? "",
        best ? money(best.estimated_landed_cost) : "",
        best?.moq ?? "",
        best?.lead_time ?? "",
        best?.match_quality_score ?? "",
        p.recommended_action,
      ];
    }),
  ];
}

function supplierRows(products: DashProduct[]): Row[] {
  const header = [
    "Product",
    "Grade",
    "Score",
    "Supplier",
    "Site",
    "Region",
    "Unit cost min",
    "Unit cost max",
    "Estimated shipping",
    "Estimated landed",
    "MOQ",
    "Rating",
    "Years active",
    "Lead time",
    "Private label",
    "Match score",
    "Supplier risk",
    "Notes",
    "URL",
  ];
  const rows = products.flatMap((p) =>
    (p.suppliers ?? []).map((s: Supplier) => [
      p.name,
      p.grade?.grade ?? "",
      pct(p.opportunity_score),
      s.supplier_name,
      s.supplier_site,
      s.region,
      money(s.unit_cost_min),
      money(s.unit_cost_max),
      money(s.estimated_shipping),
      money(s.estimated_landed_cost),
      s.moq,
      s.supplier_rating,
      s.years_active ?? "",
      s.lead_time,
      s.customization_available ? "Yes" : "No",
      s.match_quality_score,
      s.supplier_risk,
      s.notes,
      s.direct_product_url,
    ]),
  );
  return [header, ...rows];
}

function checkRows(products: DashProduct[]): Row[] {
  return [
    ["Product", "Grade", "Check", "State"],
    ...products.flatMap((p) =>
      (p.checks ?? []).map((check) => [p.name, p.grade?.grade ?? "", check.label, check.state]),
    ),
  ];
}

function rowsToCsv(rows: Row[]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function csvCell(value: Cell): string {
  if (value == null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildXlsx(sheets: SheetSpec[]): Blob {
  const files: Array<[string, string]> = [
    ["[Content_Types].xml", contentTypes(sheets.length)],
    ["_rels/.rels", rootRels()],
    ["docProps/app.xml", appProps()],
    ["docProps/core.xml", coreProps()],
    ["xl/workbook.xml", workbookXml(sheets)],
    ["xl/_rels/workbook.xml.rels", workbookRels(sheets.length)],
    ...sheets.map((sheet, index) => [`xl/worksheets/sheet${index + 1}.xml`, sheetXml(sheet.rows)] as [string, string]),
  ];
  return new Blob([zipStored(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function sheetXml(rows: Row[]) {
  const maxCols = Math.max(...rows.map((row) => row.length), 1);
  const ref = `A1:${colName(maxCols)}${Math.max(rows.length, 1)}`;
  const cols = Array.from({ length: maxCols }, (_, index) => {
    const width = Math.min(42, Math.max(10, ...rows.map((row) => String(row[index] ?? "").length + 2)));
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join("");
  const data = rows
    .map((row, rIndex) => {
      const cells = row.map((cell, cIndex) => cellXml(cell, `${colName(cIndex + 1)}${rIndex + 1}`)).join("");
      return `<row r="${rIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${cols}</cols>
  <sheetData>${data}</sheetData>
  <autoFilter ref="${ref}"/>
</worksheet>`;
}

function cellXml(value: Cell, ref: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  const text = value == null ? "" : String(value);
  return `<c r="${ref}" t="inlineStr"><is><t>${xml(text)}</t></is></c>`;
}

function workbookXml(sheets: SheetSpec[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets.map((sheet, index) => `<sheet name="${xml(sheet.name.slice(0, 31))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets>
</workbook>`;
}

function workbookRels(count: number) {
  const sheetRels = Array.from({ length: count }, (_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRels}</Relationships>`;
}

function contentTypes(count: number) {
  const sheets = Array.from({ length: count }, (_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${sheets}
</Types>`;
}

function rootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function appProps() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>AZ Finds</Application></Properties>`;
}

function coreProps() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>AZ Finds Research Export</dc:title><dc:creator>AZ Finds</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`;
}

function colName(index: number) {
  let name = "";
  while (index > 0) {
    const mod = (index - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    index = Math.floor((index - mod) / 26);
  }
  return name;
}

function xml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const encoder = new TextEncoder();

function zipStored(files: Array<[string, string]>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const [path, text] of files) {
    const name = encoder.encode(path);
    const data = encoder.encode(text);
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), name, data,
    ]);
    localParts.push(local);
    centralParts.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
    ]));
    offset += local.length;
  }
  const central = concat(centralParts);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(central.length), u32(offset), u16(0),
  ]);
  return concat([...localParts, central, end]);
}

function concat(parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u16(value: number) {
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value, true);
  return out;
}

function u32(value: number) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value >>> 0, true);
  return out;
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
