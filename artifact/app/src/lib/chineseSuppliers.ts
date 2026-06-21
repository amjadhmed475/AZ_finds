/** Category-matched Chinese manufacturer B2B platforms with DDP shipping intelligence. */

export interface DirectManufacturerLead {
  platform: string;
  url: string;
  search_url: string;
  ddp_available: boolean;
  ddp_note: string;
  typical_moq: string;
  typical_lead_days: number;
  region: string;
  category_match: string;
  category_fit: "primary" | "secondary";
  manufacturer_type: "factory" | "trading" | "mixed";
  notes: string;
}

interface SupplierEntry extends Omit<DirectManufacturerLead, "search_url" | "category_match"> {
  search_template: string;
}

const REGISTRY: Record<string, SupplierEntry[]> = {
  toys: [
    { platform: "CToy", url: "ctoy.com", search_template: "https://www.ctoy.com/search/{q}", ddp_available: true, ddp_note: "Filter 'DDP' in shipping terms. Most factories ship DDP to US/EU/AU.", typical_moq: "300–500 units", typical_lead_days: 30, region: "Guangdong", category_fit: "primary", manufacturer_type: "factory", notes: "China's dedicated toy B2B exchange. Factory-direct listings. Always request CE/ASTM F963 safety certs." },
    { platform: "ToyBaba", url: "toybaba.com", search_template: "https://www.toybaba.com/search.html?keyword={q}", ddp_available: true, ddp_note: "Verified factories offering DDP to US, UK, EU, AU. Confirm per supplier.", typical_moq: "200–500 units", typical_lead_days: 25, region: "Guangdong", category_fit: "primary", manufacturer_type: "factory", notes: "Vetted toy & baby toy manufacturers. Request EN71 + ASTM safety testing reports before sampling." },
    { platform: "Made in China – Toys", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Specify DDP + destination country in RFQ form.", typical_moq: "300 units", typical_lead_days: 35, region: "National", category_fit: "secondary", manufacturer_type: "mixed", notes: "Use 'Supplier Audit' filter for higher trust. Strong Guangdong toy factory catalog." },
  ],

  womens_clothing: [
    { platform: "Eelly", url: "eelly.com", search_template: "https://www.eelly.com/search?q={q}", ddp_available: true, ddp_note: "Many sellers use third-party freight forwarders for DDP — confirm in live chat before ordering.", typical_moq: "30–100 pieces", typical_lead_days: 12, region: "Guangzhou / Yiwu", category_fit: "primary", manufacturer_type: "mixed", notes: "Largest Guangzhou–Yiwu fashion wholesale platform. Low MOQ, fast turnaround, huge style variety." },
    { platform: "Missy17", url: "missy17.com", search_template: "https://www.missy17.com/search?k={q}", ddp_available: false, ddp_note: "EXW/FOB standard — use a freight forwarder (e.g. Yiwu sourcing agent) to convert to DDP.", typical_moq: "30 pieces", typical_lead_days: 10, region: "Guangzhou Shisanhang", category_fit: "primary", manufacturer_type: "factory", notes: "Direct from Guangzhou Shisanhang garment district. Very low MOQ. Strong fast-fashion capability." },
    { platform: "ChinaBrands Fashion", url: "chinabrands.com", search_template: "https://www.chinabrands.com/search?key={q}", ddp_available: true, ddp_note: "Fully DDP to 200+ countries. No minimum order — ideal for validation.", typical_moq: "1 piece", typical_lead_days: 8, region: "National", category_fit: "secondary", manufacturer_type: "trading", notes: "Good for product-market fit testing at 1-unit MOQ before committing to a factory bulk order." },
  ],

  cosmetics: [
    { platform: "ZGHZP", url: "zghzp.com", search_template: "http://www.zghzp.com/search/?key={q}", ddp_available: true, ddp_note: "Many Guangzhou cosmetic factories offer DDP. Must confirm per supplier — it's not universal.", typical_moq: "500–2000 units", typical_lead_days: 30, region: "Guangzhou", category_fit: "primary", manufacturer_type: "factory", notes: "Guangzhou Cosmetics Network — premier hub for GZ cosmetic factories. OEM/ODM private label available. Request MSDS + COA." },
    { platform: "Made in China – Cosmetics", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "State DDP + country in your RFQ. Many factories accommodate.", typical_moq: "500 units", typical_lead_days: 25, region: "National", category_fit: "secondary", manufacturer_type: "mixed", notes: "Request SGS/ISO certification + MSDS sheets. Filter by 'Audited Supplier'. Strong quality variation — vet carefully." },
    { platform: "DHGate Beauty", url: "dhgate.com", search_template: "https://www.dhgate.com/wholesale/search.do?searchkey={q}", ddp_available: true, ddp_note: "Many sellers explicitly list DDP in shipping options — filter for it.", typical_moq: "10–50 units", typical_lead_days: 14, region: "National", category_fit: "secondary", manufacturer_type: "trading", notes: "Low MOQ ideal for sampling before factory commitment. Good for finding style/formula that resonates." },
  ],

  electronics: [
    { platform: "Made in China – Electronics", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Request DDP + FCC/CE certification in the RFQ form.", typical_moq: "50–200 units", typical_lead_days: 30, region: "Shenzhen / Guangdong", category_fit: "primary", manufacturer_type: "factory", notes: "Filter by 'Audited Supplier'. Always require FCC (US), CE (EU), RoHS compliance docs before paying deposit." },
    { platform: "Global Sources Electronics", url: "globalsources.com", search_template: "https://www.globalsources.com/si/AS/Global-Supplier/Products.html?Q={q}", ddp_available: false, ddp_note: "FOB standard — negotiate DDP conversion via freight forwarder or ask supplier directly.", typical_moq: "100–500 units", typical_lead_days: 35, region: "Shenzhen", category_fit: "primary", manufacturer_type: "factory", notes: "Tighter vetting than Alibaba. Premium electronics exporters. Strong for Shenzhen-origin electronics." },
    { platform: "DHGate Electronics", url: "dhgate.com", search_template: "https://www.dhgate.com/wholesale/search.do?searchkey={q}", ddp_available: true, ddp_note: "Filter sellers with DDP in their shipping options. Very common here.", typical_moq: "1–10 units", typical_lead_days: 12, region: "National", category_fit: "secondary", manufacturer_type: "trading", notes: "Excellent for small test batches before making a factory commitment. Verify certifications still." },
  ],

  kitchen: [
    { platform: "Yiwugo Kitchen", url: "yiwugo.com", search_template: "https://www.yiwugo.com/search/?search={q}", ddp_available: true, ddp_note: "Use a Yiwu sourcing agent for consolidated DDP shipping to your warehouse.", typical_moq: "100–200 units", typical_lead_days: 20, region: "Yiwu", category_fit: "primary", manufacturer_type: "mixed", notes: "Online Yiwu International Trade Market. Massive kitchen & home catalog at very competitive prices." },
    { platform: "Made in China – Kitchenware", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Specify DDP Incoterms in quote. Food-contact items: request FDA/LFGB compliance.", typical_moq: "200 units", typical_lead_days: 28, region: "National", category_fit: "secondary", manufacturer_type: "factory", notes: "Strong for cookware, bakeware, utensils. Request food-safe material certs for anything food-contact." },
  ],

  sports: [
    { platform: "Made in China – Sports", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Request DDP in quote. Many factories ship DDP to US/EU.", typical_moq: "100 units", typical_lead_days: 30, region: "National", category_fit: "primary", manufacturer_type: "factory", notes: "Strong for fitness equipment, outdoor gear, sporting goods. Request CE/EN certifications where applicable." },
    { platform: "Alibaba Sports", url: "alibaba.com", search_template: "https://www.alibaba.com/trade/search?SearchText={q}", ddp_available: true, ddp_note: "Filter: Trade Assurance enabled. Search 'DDP' in shipping term field.", typical_moq: "50–200 units", typical_lead_days: 25, region: "National", category_fit: "secondary", manufacturer_type: "mixed", notes: "Use Trade Assurance for payment protection. Filter 'Verified Supplier' for quality. OEM/ODM widely available." },
  ],

  baby: [
    { platform: "ToyBaba Baby", url: "toybaba.com", search_template: "https://www.toybaba.com/search.html?keyword={q}", ddp_available: true, ddp_note: "Factories offer DDP to US/EU. Confirm EN71/CPSC compliance first.", typical_moq: "200 units", typical_lead_days: 25, region: "Guangdong", category_fit: "primary", manufacturer_type: "factory", notes: "Covers baby gear, infant toys, nursery items. Safety certifications are critical — never skip this step." },
    { platform: "Made in China – Baby", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Request DDP + EN71/CPSC compliance docs in the RFQ form.", typical_moq: "300 units", typical_lead_days: 35, region: "National", category_fit: "secondary", manufacturer_type: "mixed", notes: "Always require safety certifications: EN71 (EU), CPSC (US), ASTM F963. No exceptions for baby products." },
  ],

  pets: [
    { platform: "Made in China – Pet", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Specify DDP + food-grade material certs for any edible or food-contact items.", typical_moq: "200 units", typical_lead_days: 28, region: "National", category_fit: "primary", manufacturer_type: "mixed", notes: "Strong pet supply catalog. Request food-grade/non-toxic material certs for chews, bowls, and treats." },
    { platform: "Alibaba Pet Supplies", url: "alibaba.com", search_template: "https://www.alibaba.com/trade/search?SearchText={q}", ddp_available: true, ddp_note: "Filter: Trade Assurance + 'DDP' in shipping terms.", typical_moq: "100 units", typical_lead_days: 22, region: "National", category_fit: "secondary", manufacturer_type: "mixed", notes: "Good supplier variety. Use 'Verified Supplier' + Trade Assurance for payment protection." },
  ],

  home: [
    { platform: "Yiwugo Home", url: "yiwugo.com", search_template: "https://www.yiwugo.com/search/?search={q}", ddp_available: true, ddp_note: "Use a Yiwu sourcing agent for DDP consolidation and quality inspection.", typical_moq: "100 units", typical_lead_days: 18, region: "Yiwu", category_fit: "primary", manufacturer_type: "mixed", notes: "Yiwu is the world's largest small-goods market. Famous for candles, frames, décor, organizers at factory prices." },
    { platform: "Made in China – Home", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Request DDP Incoterms in RFQ. Most factories accommodate US/EU.", typical_moq: "200 units", typical_lead_days: 25, region: "National", category_fit: "secondary", manufacturer_type: "factory", notes: "Good for lighting, furniture, organizers, décor. Private-label / custom packaging widely available." },
  ],

  health: [
    { platform: "Made in China – Health", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Request DDP + GMP certificate + Certificate of Analysis (COA) in every quote.", typical_moq: "500–2000 units", typical_lead_days: 40, region: "National", category_fit: "primary", manufacturer_type: "factory", notes: "FDA-registered facilities available. Always require GMP, COA, and third-party lab results. High-risk category — vet thoroughly." },
    { platform: "Alibaba Health & Nutrition", url: "alibaba.com", search_template: "https://www.alibaba.com/trade/search?SearchText={q}", ddp_available: true, ddp_note: "Filter: Trade Assurance + 'DDP'. Always request FDA registration number from US-bound factories.", typical_moq: "500 units", typical_lead_days: 30, region: "National", category_fit: "secondary", manufacturer_type: "mixed", notes: "Large pool of suppliers. Filter carefully. Request COA, GMP, NSF, or USP certs. Regulations vary by country." },
  ],

  jewelry: [
    { platform: "Yiwugo Jewelry", url: "yiwugo.com", search_template: "https://www.yiwugo.com/search/?search={q}", ddp_available: true, ddp_note: "Source via Yiwu agent who handles DDP + quality inspection to your door.", typical_moq: "50–100 pieces", typical_lead_days: 15, region: "Yiwu", category_fit: "primary", manufacturer_type: "mixed", notes: "Yiwu is the global capital of fashion jewelry. Enormous variety at minimal MOQ. Request nickel/lead-free certs." },
    { platform: "DHGate Jewelry", url: "dhgate.com", search_template: "https://www.dhgate.com/wholesale/search.do?searchkey={q}", ddp_available: true, ddp_note: "Many DDP jewelry sellers. Filter by seller rating above 95%.", typical_moq: "5–20 pieces", typical_lead_days: 10, region: "National", category_fit: "secondary", manufacturer_type: "trading", notes: "Extremely low MOQ. Good for testing styles. Request nickel/lead-free compliance for US/EU market." },
  ],

  bags: [
    { platform: "Made in China – Bags", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Request DDP + material composition certificates.", typical_moq: "100–300 units", typical_lead_days: 30, region: "Guangdong / Yiwu", category_fit: "primary", manufacturer_type: "factory", notes: "Factory-direct bags, backpacks, luggage. Custom branding + private label widely available." },
    { platform: "DHGate Bags", url: "dhgate.com", search_template: "https://www.dhgate.com/wholesale/search.do?searchkey={q}", ddp_available: true, ddp_note: "DDP available from many sellers. Filter by it.", typical_moq: "2–10 units", typical_lead_days: 12, region: "National", category_fit: "secondary", manufacturer_type: "trading", notes: "Excellent for sampling different styles before committing to a factory bulk order." },
  ],

  office: [
    { platform: "Yiwugo Stationery", url: "yiwugo.com", search_template: "https://www.yiwugo.com/search/?search={q}", ddp_available: true, ddp_note: "Use Yiwu sourcing agent for DDP consolidation of mixed orders.", typical_moq: "200 units", typical_lead_days: 18, region: "Yiwu", category_fit: "primary", manufacturer_type: "mixed", notes: "Yiwu is the top global source for stationery, office supplies, and small goods at factory pricing." },
    { platform: "Made in China – Office", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Request DDP in RFQ form.", typical_moq: "200 units", typical_lead_days: 25, region: "National", category_fit: "secondary", manufacturer_type: "factory", notes: "Office equipment, furniture, supplies. Good private-label options. Request compliance docs." },
  ],

  general: [
    { platform: "Alibaba", url: "alibaba.com", search_template: "https://www.alibaba.com/trade/search?SearchText={q}", ddp_available: true, ddp_note: "Filter: 'Trade Assurance' enabled + type 'DDP' in supplier shipping terms. Both are critical.", typical_moq: "50–200 units", typical_lead_days: 25, region: "National", category_fit: "primary", manufacturer_type: "mixed", notes: "World's largest B2B platform. Always use Trade Assurance for payment protection. Filter 'Verified Supplier'." },
    { platform: "DHGate", url: "dhgate.com", search_template: "https://www.dhgate.com/wholesale/search.do?searchkey={q}", ddp_available: true, ddp_note: "Many DDP sellers. Filter by DDP shipping option before ordering.", typical_moq: "1–50 units", typical_lead_days: 14, region: "National", category_fit: "secondary", manufacturer_type: "trading", notes: "Low MOQ ideal for product testing. DDP widely available. Good for validating demand before factory order." },
    { platform: "Made in China", url: "made-in-china.com", search_template: "https://www.made-in-china.com/multi-search/{q}/F0/", ddp_available: true, ddp_note: "Specify DDP Incoterms in your RFQ. Most factories accommodate.", typical_moq: "100–300 units", typical_lead_days: 28, region: "National", category_fit: "secondary", manufacturer_type: "mixed", notes: "Strong for factory-direct sourcing. Use 'Audited Supplier' filter. Good for custom/OEM products." },
  ],
};

const KEYWORD_MAP: Array<[string, RegExp]> = [
  ["toys",            /\b(toy|puzzle|doll|figurine|plush|stuffed|action figure|board game|play set|building block|lego)\b/i],
  ["baby",            /\b(baby|infant|toddler|newborn|diaper|stroller|teether|sippy cup|nursery|crib|pacifier)\b/i],
  ["womens_clothing", /\b(women('?s)? (dress|top|blouse|shirt|skirt|pant|coat|jacket|hoodie)|ladies (top|wear|clothing)|female (clothing|apparel)|fashion (top|dress|blouse))\b/i],
  ["cosmetics",       /\b(makeup|lipstick|lip gloss|foundation|mascara|eyeshadow|blush|concealer|skincare|serum|moisturi[sz]er|face cream|face mask|bb cream|toner|primer|contour|highlighter)\b/i],
  ["electronics",     /\b(charger|usb|bluetooth|wireless|speaker|headphone|earphone|earbud|power bank|led light|smart (plug|light|home)|phone case|camera|dashcam|tablet stand)\b/i],
  ["kitchen",         /\b(kitchen|cookware|pot|pan|knife|utensil|baking|cutting board|food storage|coffee (mug|maker)|blender|air fryer|cooking (set|tool))\b/i],
  ["sports",          /\b(fitness|gym|yoga|exercise|resistance band|dumbbell|weight|workout|outdoor|camping|hiking|cycling|running (belt|vest|gear)|athletic)\b/i],
  ["pets",            /\b(dog|cat|puppy|kitten|pet (toy|bed|food|bowl|leash|collar)|fish tank|aquarium|bird cage|hamster|litter box)\b/i],
  ["health",          /\b(supplement|vitamin|protein (powder|bar)|probiotic|omega-?3|collagen|immune (support|boost)|weight loss|detox|melatonin|elderberry)\b/i],
  ["jewelry",         /\b(necklace|bracelet|ring|earring|pendant|charm|anklet|brooch|bangle|chain|locket|jewelry set)\b/i],
  ["bags",            /\b(backpack|tote bag|handbag|purse|luggage|suitcase|crossbody|fanny pack|duffel|clutch|laptop bag)\b/i],
  ["home",            /\b(home decor|candle|picture frame|wall art|throw pillow|blanket|lamp|area rug|curtain|vase|storage (bin|basket|organizer)|desk (organizer|lamp))\b/i],
  ["office",          /\b(stationery|pen set|notebook|desk (mat|organizer)|planner|calendar|binder|stapler|sticky note|whiteboard)\b/i],
];

export function categorizeProduct(name: string, category: string): string {
  const text = `${name} ${category}`;
  for (const [cat, re] of KEYWORD_MAP) {
    if (re.test(text)) return cat;
  }
  // Fallback: match on raw category string
  const catLow = category.toLowerCase();
  if (catLow.includes("toy") || catLow.includes("game")) return "toys";
  if (catLow.includes("cloth") || catLow.includes("fashion") || catLow.includes("apparel")) return "womens_clothing";
  if (catLow.includes("beauty") || catLow.includes("cosmet")) return "cosmetics";
  if (catLow.includes("electron") || catLow.includes("tech")) return "electronics";
  if (catLow.includes("kitchen") || catLow.includes("cook")) return "kitchen";
  if (catLow.includes("sport") || catLow.includes("fitness")) return "sports";
  if (catLow.includes("baby") || catLow.includes("infant")) return "baby";
  if (catLow.includes("pet") || catLow.includes("dog") || catLow.includes("cat")) return "pets";
  if (catLow.includes("health") || catLow.includes("supplement")) return "health";
  if (catLow.includes("jewel") || catLow.includes("accessor")) return "jewelry";
  if (catLow.includes("bag") || catLow.includes("luggage")) return "bags";
  if (catLow.includes("home") || catLow.includes("decor")) return "home";
  if (catLow.includes("office") || catLow.includes("stationery")) return "office";
  return "general";
}

export function getDirectSupplierLeads(
  name: string,
  category: string,
  maxResults = 3,
): DirectManufacturerLead[] {
  const cat = categorizeProduct(name, category);
  const keyword = name.split(" ").slice(0, 4).join(" ");
  const encoded = encodeURIComponent(keyword);

  const pool: SupplierEntry[] = [];
  const seen = new Set<string>();

  const addEntries = (entries: SupplierEntry[]) => {
    for (const e of entries) {
      if (!seen.has(e.url)) {
        seen.add(e.url);
        pool.push(e);
      }
    }
  };

  addEntries(REGISTRY[cat] ?? []);
  addEntries(REGISTRY.general);

  return pool.slice(0, maxResults).map((entry) => ({
    ...entry,
    category_match: cat,
    search_url: entry.search_template.replace("{q}", encoded),
  }));
}
