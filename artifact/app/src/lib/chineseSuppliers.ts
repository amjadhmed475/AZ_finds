/* Chinese B2B Supplier Intelligence — category-specific platforms */

export interface ChineseSupplier {
  name: string;
  site: string;
  urlTemplate: string;   // use {{Q}} as placeholder for search query
  specialty: string;
  categories: string[];  // lowercase keywords to match against product name + category
  moqRange: string;
  leadDays: string;
  trustLevel: "verified" | "trade-assurance" | "standard";
  advantage: string;
  tip: string;
  china_region: string;
}

export interface ResolvedSupplier extends Omit<ChineseSupplier, "urlTemplate"> {
  url: string;           // urlTemplate with {{Q}} substituted
}

const SUPPLIERS: ChineseSupplier[] = [
  // ── TOYS & BABY ──────────────────────────────────────────
  {
    name: "ToyBaba",
    site: "toybaba.com",
    urlTemplate: "https://www.toybaba.com/en/products?keyword={{Q}}",
    specialty: "Toys & baby products — China's largest toy B2B marketplace",
    categories: ["toy","toys","baby","children","kids","game","puzzle","doll","figure","educational","play","infant","toddler","nursery","rattle","teether","plush","stuffed"],
    moqRange: "50–500 units",
    leadDays: "15–30 days",
    trustLevel: "verified",
    advantage: "Toy-specialized with CE, ASTM, EN71 safety cert listings",
    tip: "Filter by 'CE certified'. For US Amazon, request ASTM F963 & CPSC compliance docs.",
    china_region: "Yiwu + Shantou, Guangdong",
  },
  {
    name: "Yiwu Goods (Toys)",
    site: "en.yiwugo.com",
    urlTemplate: "https://en.yiwugo.com/products/search.html?q={{Q}}&src=header",
    specialty: "Yiwu wholesale — world's largest small-commodities market",
    categories: ["toy","toys","baby","children","gift","novelty","party","seasonal","decoration","stationery","kids"],
    moqRange: "12–200 units",
    leadDays: "10–25 days",
    trustLevel: "standard",
    advantage: "Lowest MOQ in China. Perfect for product testing before bulk buys.",
    tip: "Yiwu prices are per-piece. Negotiate 3+ sample units before committing to bulk.",
    china_region: "Yiwu, Zhejiang",
  },
  // ── ELECTRONICS ──────────────────────────────────────────
  {
    name: "Global Sources Electronics",
    site: "globalsources.com",
    urlTemplate: "https://www.globalsources.com/searchList/products?keyWord={{Q}}&category=consumer-electronics",
    specialty: "Verified electronics exporters — annual Hong Kong trade shows",
    categories: ["electronic","electronics","gadget","tech","charging","cable","bluetooth","wireless","speaker","headphone","earbuds","usb","power bank","led","smart","device","sensor","camera"],
    moqRange: "200–5000 units",
    leadDays: "25–50 days",
    trustLevel: "verified",
    advantage: "Supplier-audited platform. Contacts from HK Electronics Show are here.",
    tip: "Filter 'verified supplier', sort by 'years in business'. Target 5+ years. Require FCC/CE docs.",
    china_region: "Shenzhen + Hong Kong",
  },
  {
    name: "HKTDC Sourcing",
    site: "hktdc.com",
    urlTemplate: "https://sourcing.hktdc.com/en/Search?q={{Q}}",
    specialty: "Hong Kong Trade Council — electronics & hardware with Western compliance",
    categories: ["electronic","gadget","hardware","tool","lighting","solar","battery","appliance","industrial","component","phone","tablet"],
    moqRange: "100–2000 units",
    leadDays: "20–40 days",
    trustLevel: "verified",
    advantage: "HK suppliers follow stricter quality & export standards than mainland China.",
    tip: "HKTDC suppliers already export to US/EU — less compliance friction. Good for first China order.",
    china_region: "Hong Kong / Guangdong",
  },
  // ── HOME & KITCHEN ────────────────────────────────────────
  {
    name: "Yiwu Goods (Home)",
    site: "en.yiwugo.com",
    urlTemplate: "https://en.yiwugo.com/products/search.html?q={{Q}}&src=header",
    specialty: "Home goods — Yiwu wholesale hub for household items",
    categories: ["home","kitchen","storage","organizer","container","household","cleaning","bath","bedroom","towel","bedding","pillow","curtain","lamp","candle","decor"],
    moqRange: "12–300 units",
    leadDays: "10–25 days",
    trustLevel: "standard",
    advantage: "Widest home goods selection in the world. Very low MOQ for testing.",
    tip: "Use Yiwugo agent service for QC inspections — don't skip this step for FBM.",
    china_region: "Yiwu, Zhejiang",
  },
  {
    name: "Made-in-China Kitchen",
    site: "made-in-china.com",
    urlTemplate: "https://www.made-in-china.com/products-search/hot-china-products/{{Q}}.html",
    specialty: "Kitchen & cookware manufacturers — direct factory connection",
    categories: ["kitchen","cookware","bakeware","utensil","silicone","cutting","knife","pan","pot","baking","mat","spatula","cooking","grater"],
    moqRange: "100–1000 units",
    leadDays: "20–40 days",
    trustLevel: "verified",
    advantage: "Factory-direct pricing. Yangjiang (knives) and Xinhui (cookware) clusters here.",
    tip: "For any kitchen item touching food, request FDA food-safe certification. Essential for Amazon.",
    china_region: "Yangjiang + Xinhui, Guangdong",
  },
  {
    name: "China Brands",
    site: "chinabrands.com",
    urlTemplate: "https://www.chinabrands.com/dropshipping/search?keyword={{Q}}",
    specialty: "Home & lifestyle — no-MOQ option for product testing",
    categories: ["home","kitchen","bedroom","bathroom","living","storage","office","decor","garden","cleaning"],
    moqRange: "1–50 units",
    leadDays: "7–20 days",
    trustLevel: "trade-assurance",
    advantage: "No MOQ option — test products before bulk ordering on Alibaba.",
    tip: "Use for validation. Once a product proves itself, switch to Alibaba bulk for better unit cost.",
    china_region: "Guangzhou",
  },
  // ── FURNITURE ─────────────────────────────────────────────
  {
    name: "Foshan Global Furniture",
    site: "foshanglobal.com",
    urlTemplate: "https://www.foshanglobal.com/search?key={{Q}}",
    specialty: "Foshan — China's furniture capital. Sofas, chairs, shelving, tables.",
    categories: ["furniture","chair","table","desk","shelf","cabinet","sofa","bed","bookcase","rack","wardrobe","dresser"],
    moqRange: "1–50 units",
    leadDays: "30–60 days",
    trustLevel: "verified",
    advantage: "Foshan is the world's furniture manufacturing capital. Custom design available.",
    tip: "Visit the Canton Fair (Guangzhou, twice/year) for face-to-face Foshan supplier meetings.",
    china_region: "Foshan, Guangdong",
  },
  // ── SPORTS & OUTDOORS ─────────────────────────────────────
  {
    name: "Global Sources Sports",
    site: "globalsources.com",
    urlTemplate: "https://www.globalsources.com/searchList/products?keyWord={{Q}}&category=sports",
    specialty: "Verified sports goods exporters with safety certs",
    categories: ["sport","sports","outdoor","fitness","exercise","gym","yoga","resistance","weight","camping","bicycle","swimming","fishing","hunting","hiking"],
    moqRange: "100–1000 units",
    leadDays: "25–45 days",
    trustLevel: "verified",
    advantage: "Audited sports manufacturers. Easier to obtain EN/ASTM safety certifications.",
    tip: "Sports items often need product liability insurance. Ask suppliers for BSCI factory audit.",
    china_region: "Jinhua / Quzhou, Zhejiang",
  },
  // ── TOOLS & HOME IMPROVEMENT ─────────────────────────────
  {
    name: "Yongkang Hardware City",
    site: "made-in-china.com",
    urlTemplate: "https://www.made-in-china.com/products-search/hot-china-products/{{Q}}-tools.html",
    specialty: "Yongkang — world's hardware capital. Every hand tool is made here.",
    categories: ["tool","tools","hardware","drill","wrench","screw","lock","handle","power tool","hand tool","plier","hammer","saw","socket","nut","bolt"],
    moqRange: "50–500 units",
    leadDays: "20–40 days",
    trustLevel: "verified",
    advantage: "Yongkang City = global hub for tools. Hundreds of specialized factories.",
    tip: "Tools need UL/CE cert for Amazon US. Always request existing cert docs before ordering.",
    china_region: "Yongkang, Zhejiang",
  },
  // ── OFFICE PRODUCTS ──────────────────────────────────────
  {
    name: "Yiwu Office District",
    site: "en.yiwugo.com",
    urlTemplate: "https://en.yiwugo.com/products/search.html?q={{Q}}&src=header",
    specialty: "Office supplies, stationery, organizers — Yiwu District 4",
    categories: ["office","stationery","pen","notebook","binder","folder","organizer","paper","tape","scissors","stapler","clip","rubber","marker","highlighter"],
    moqRange: "12–500 units",
    leadDays: "10–25 days",
    trustLevel: "standard",
    advantage: "3,000+ office supply sellers in Yiwu. Lowest prices globally for stationery.",
    tip: "Use a Yiwu sourcing agent for inspections. District 4 (文具) is the office supplies area.",
    china_region: "Yiwu, Zhejiang",
  },
  // ── LUGGAGE & TRAVEL ─────────────────────────────────────
  {
    name: "Baigou Bags & Luggage",
    site: "made-in-china.com",
    urlTemplate: "https://www.made-in-china.com/products-search/hot-china-products/{{Q}}-bag.html",
    specialty: "Baigou — China's luggage and bag manufacturing capital (70% of China's output)",
    categories: ["luggage","bag","backpack","suitcase","travel","handbag","purse","tote","duffel","packing","cube","toiletry","passport","sleeve"],
    moqRange: "50–300 units",
    leadDays: "15–35 days",
    trustLevel: "standard",
    advantage: "Baigou County produces 70% of China's bags. Lowest possible factory prices.",
    tip: "Many Baigou suppliers are on Made-in-China.com. Low MOQ test orders are possible.",
    china_region: "Baigou, Hebei Province",
  },
  // ── PET PRODUCTS ─────────────────────────────────────────
  {
    name: "Alibaba Pet Supplies",
    site: "alibaba.com",
    urlTemplate: "https://www.alibaba.com/trade/search?SearchText={{Q}}&category=pet-supplies",
    specialty: "Pet supplies — Jiangsu/Guangdong pet product exporters",
    categories: ["pet","dog","cat","animal","collar","leash","bed","toy","feeder","grooming","harness","bowl","litter","aquarium","fish"],
    moqRange: "50–500 units",
    leadDays: "15–35 days",
    trustLevel: "trade-assurance",
    advantage: "China produces 80% of global pet products. Very cost competitive with Trade Assurance.",
    tip: "Pet food needs FDA registration. Pet accessories need REACH compliance for EU/US safety.",
    china_region: "Wujiang, Jiangsu",
  },
];

function buildUrl(template: string, query: string): string {
  return template.replace(/\{\{Q\}\}/g, encodeURIComponent(query));
}

export function getChineseSuppliers(
  productName: string,
  category: string,
  customQuery?: string
): ResolvedSupplier[] {
  const search = `${productName} ${category}`.toLowerCase();
  const query = customQuery ?? productName;

  const scored = SUPPLIERS.map(s => {
    let score = 0;
    for (const kw of s.categories) {
      if (search.includes(kw)) score += kw.length >= 5 ? 3 : 1;
    }
    return { s, score };
  });

  const top = scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (top.length === 0) {
    // Fallback: return general platforms
    return SUPPLIERS
      .filter(s => ["China Brands", "Yiwu Goods (Home)", "HKTDC Sourcing"].includes(s.name))
      .map(s => {
        const { urlTemplate, ...rest } = s;
        return { ...rest, url: buildUrl(urlTemplate, query) };
      });
  }

  return top.map(({ s }) => {
    const { urlTemplate, ...rest } = s;
    return { ...rest, url: buildUrl(urlTemplate, query) };
  });
}

export const CHINA_HUBS: Record<string, { city: string; region: string; known_for: string }> = {
  toys:        { city: "Shantou + Yiwu",       region: "Guangdong / Zhejiang", known_for: "70% of world toys" },
  electronics: { city: "Shenzhen",             region: "Guangdong",            known_for: "Consumer electronics hub" },
  furniture:   { city: "Foshan",               region: "Guangdong",            known_for: "World furniture capital" },
  luggage:     { city: "Baigou",               region: "Hebei",                known_for: "70% of China's bags" },
  tools:       { city: "Yongkang",             region: "Zhejiang",             known_for: "World hardware capital" },
  kitchen:     { city: "Yangjiang + Xinhui",   region: "Guangdong",            known_for: "Cookware & cutlery" },
  sports:      { city: "Jinhua / Quzhou",       region: "Zhejiang",             known_for: "Fitness equipment" },
  office:      { city: "Yiwu District 4",      region: "Zhejiang",             known_for: "Global stationery hub" },
  general:     { city: "Yiwu",                 region: "Zhejiang",             known_for: "World's largest small commodities market" },
};

export function getChinaHub(category: string, productName: string) {
  const text = `${category} ${productName}`.toLowerCase();
  if (/toy|baby|children|kids|infant|toddler/.test(text)) return CHINA_HUBS.toys;
  if (/electronic|gadget|tech|bluetooth|wireless|usb|charging|cable/.test(text)) return CHINA_HUBS.electronics;
  if (/furniture|chair|table|desk|shelf|cabinet|sofa|bed/.test(text)) return CHINA_HUBS.furniture;
  if (/luggage|bag|backpack|suitcase|travel|purse|tote/.test(text)) return CHINA_HUBS.luggage;
  if (/tool|hardware|drill|wrench|screw|lock/.test(text)) return CHINA_HUBS.tools;
  if (/kitchen|cookware|bakeware|silicone|knife|pan|cutting/.test(text)) return CHINA_HUBS.kitchen;
  if (/sport|fitness|gym|yoga|outdoor|camping|exercise/.test(text)) return CHINA_HUBS.sports;
  if (/office|stationery|pen|notebook|binder|folder/.test(text)) return CHINA_HUBS.office;
  return CHINA_HUBS.general;
}
