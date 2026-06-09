import { makeCitation } from "../services/citationService.js";
import { checkRestriction } from "../services/restrictionService.js";
import type { Citation } from "../types/citations.js";

export interface ProductSeed {
  name: string;
  short_description: string;
  category: string;
  product_type: string;
  amazon_keywords: string[];
  asin?: string;
  price_hint: number;
  target_unit_cost: number;
  weight_oz: number;
  dimensions_in: { length: number; width: number; height: number };
  seller_count_hint: number;
  // honesty / compliance metadata
  why_generic: string;
  restricted_check: { restricted: boolean; reasons: string[] };
  risk_notes: string;
  supplier_search_terms: string[];
  mock_demand_hint: string;
  mock_profit_hint: string;
  mock_confidence: "low" | "medium" | "high";
  citations: Citation[];
}

// Compact tuple: [name, category, product_type, keywords, price, weightOz, L, W, H, sellers]
type Row = [string, string, string, string[], number, number, number, number, number, number];

const ROWS: Row[] = [
  // ── Home organization ──
  ["Collapsible Storage Bins (Set of 2)", "Home & Kitchen", "home organization", ["collapsible storage bin", "fabric cube organizer", "foldable closet bin"], 18.99, 3.2, 11, 11, 11, 18],
  ["Drawer Dividers (adjustable, 4 pack)", "Home & Kitchen", "home organization", ["drawer dividers", "adjustable organizer", "drawer separators"], 17.99, 2.2, 17, 3, 2, 13],
  ["Over-Door Hook Rack (5 hooks)", "Home & Kitchen", "home organization", ["over the door hooks", "door hanger rack", "coat hooks"], 13.99, 2.4, 9, 4, 2, 17],
  ["Shoe Slot Organizers (4 pack)", "Home & Kitchen", "home organization", ["shoe organizer", "shoe slots", "closet shoe rack"], 15.99, 2.8, 11, 5, 3, 14],
  ["Closet Hanger Connector Hooks (20 pack)", "Home & Kitchen", "home organization", ["hanger connector hooks", "closet space saver", "cascading hooks"], 7.99, 1.0, 5, 4, 1, 24],
  ["Pantry Storage Bins (4 pack)", "Home & Kitchen", "home organization", ["pantry bins", "kitchen storage bins", "clear organizer bins"], 24.99, 4.4, 15, 6, 5, 16],
  ["Under-Bed Storage Bags (3 pack)", "Home & Kitchen", "storage products", ["under bed storage", "blanket storage bag", "clothes storage"], 22.99, 3.0, 16, 12, 3, 19],
  ["Hanging Closet Organizer (6 shelf)", "Home & Kitchen", "home organization", ["hanging closet organizer", "closet shelves", "sweater organizer"], 19.99, 5.0, 12, 12, 2, 15],
  ["Lazy Susan Turntable (2 pack)", "Home & Kitchen", "home organization", ["lazy susan", "cabinet turntable", "spinning organizer"], 16.99, 4.0, 10, 10, 3, 20],
  ["Stackable Storage Cubes (set)", "Home & Kitchen", "storage products", ["stackable cubes", "modular storage", "closet cubes"], 26.99, 6.0, 14, 11, 6, 12],
  ["Wall-Mounted Storage Baskets (3 pack)", "Home & Kitchen", "home organization", ["wall baskets", "hanging storage basket", "wall organizer"], 18.49, 2.6, 10, 6, 4, 14],
  ["Magazine File Holders (4 pack)", "Office Products", "home organization", ["magazine holder", "file organizer", "desk file holder"], 15.49, 3.2, 10, 4, 9, 15],
  ["Sock & Drawer Organizer (set)", "Home & Kitchen", "home organization", ["drawer organizer", "sock organizer", "underwear divider"], 14.99, 1.8, 12, 9, 3, 18],
  ["Foldable Storage Ottoman Bin", "Home & Kitchen", "storage products", ["storage ottoman", "foldable bin seat", "toy box ottoman"], 27.99, 8.0, 15, 15, 15, 11],
  ["Cord Organizer Box", "Office Products", "home organization", ["cord organizer box", "cable management box", "power strip box"], 21.99, 3.4, 13, 5, 5, 16],

  // ── Kitchen accessories (no heavy food-contact risk) ──
  ["Silicone Stretch Lids (12 pack)", "Home & Kitchen", "kitchen accessories", ["silicone stretch lids", "reusable lids", "bowl covers"], 12.49, 1.9, 8, 6, 1, 22],
  ["Stainless Measuring Spoons (set)", "Kitchen", "kitchen accessories", ["measuring spoons", "stainless measuring set", "magnetic spoons"], 11.99, 5.5, 7, 3, 2, 21],
  ["Magnetic Jar Tins (12 pack)", "Kitchen", "kitchen accessories", ["magnetic jars", "fridge tins", "storage tins"], 19.99, 6.0, 9, 7, 3, 17],
  ["Kitchen Sink Caddy Organizer", "Home & Kitchen", "kitchen accessories", ["sink caddy", "sponge holder", "sink organizer"], 13.49, 2.0, 9, 4, 4, 19],
  ["Compact Dish Drying Rack", "Home & Kitchen", "kitchen accessories", ["dish drying rack", "compact dish rack", "sink dish rack"], 23.99, 9.0, 14, 12, 4, 14],
  ["Refrigerator Storage Bins (6 pack)", "Home & Kitchen", "kitchen accessories", ["fridge bins", "refrigerator organizer", "clear storage bins"], 25.99, 5.2, 12, 5, 4, 15],
  ["Reusable Silicone Storage Bags (set)", "Home & Kitchen", "kitchen accessories", ["reusable storage bags", "silicone bags", "leakproof bags"], 16.99, 3.0, 9, 7, 2, 18],
  ["Pot Lid Organizer Rack", "Home & Kitchen", "kitchen accessories", ["pot lid organizer", "lid rack", "cabinet lid holder"], 17.99, 3.6, 13, 4, 4, 16],
  ["Cabinet Trash Bag Holder", "Home & Kitchen", "kitchen accessories", ["cabinet trash bag holder", "bag holder", "kitchen bag rack"], 9.99, 1.4, 11, 8, 1, 20],
  ["Stainless Utensil Holder", "Kitchen", "kitchen accessories", ["utensil holder", "utensil crock", "counter organizer"], 14.99, 7.0, 5, 5, 7, 17],
  ["Collapsible Colander (2 pack)", "Kitchen", "kitchen accessories", ["collapsible colander", "silicone strainer", "folding colander"], 15.49, 5.5, 9, 9, 3, 16],
  ["Drawer Cutlery Organizer Insert", "Home & Kitchen", "kitchen accessories", ["cutlery organizer", "flatware tray", "drawer insert"], 13.99, 3.4, 15, 12, 2, 18],

  // ── Cleaning tools (no chemicals) ──
  ["Microfiber Cleaning Cloths (24 pack)", "Home & Kitchen", "cleaning tools", ["microfiber cloths", "cleaning rags", "polishing cloth"], 13.99, 6.0, 9, 7, 3, 26],
  ["Shower Glass Squeegee", "Home & Kitchen", "cleaning tools", ["shower squeegee", "glass squeegee", "bathroom squeegee"], 9.99, 2.2, 11, 4, 1, 22],
  ["Extendable Microfiber Duster", "Home & Kitchen", "cleaning tools", ["microfiber duster", "extendable duster", "cobweb duster"], 14.49, 3.0, 18, 3, 3, 17],
  ["Reusable Mop Pads (6 pack)", "Home & Kitchen", "cleaning tools", ["reusable mop pads", "microfiber mop pad", "washable mop pad"], 16.99, 4.0, 12, 6, 2, 15],
  ["Scrub Brush Set (3 pack)", "Home & Kitchen", "cleaning tools", ["scrub brush set", "cleaning brush", "grout brush"], 11.49, 2.4, 8, 4, 3, 21],
  ["Silicone Sink Mat", "Home & Kitchen", "cleaning tools", ["sink mat", "sink protector", "silicone mat"], 12.99, 5.0, 13, 11, 1, 18],
  ["Empty Spray Bottles (3 pack)", "Home & Kitchen", "cleaning tools", ["empty spray bottles", "refillable spray bottle", "trigger bottle"], 10.99, 4.5, 9, 3, 3, 24],
  ["Dustpan and Brush Set", "Home & Kitchen", "cleaning tools", ["dustpan and brush", "hand broom set", "counter sweep"], 13.49, 6.0, 12, 9, 4, 16],

  // ── Pet accessories (no consumables/medical) ──
  ["Pet Hair Remover Roller (reusable)", "Pet Products", "pet accessories", ["pet hair remover", "reusable lint roller", "fur remover"], 14.99, 5.0, 8, 4, 3, 19],
  ["Slow Feeder Dog Bowl", "Pet Products", "pet accessories", ["slow feeder bowl", "dog bowl", "anti gulp bowl"], 13.99, 6.0, 9, 9, 2, 20],
  ["Cat Scratching Mat", "Pet Products", "pet accessories", ["cat scratcher", "scratching mat", "cat pad"], 16.49, 7.0, 16, 12, 1, 15],
  ["Dog Poop Bag Holder", "Pet Products", "pet accessories", ["poop bag holder", "leash bag dispenser", "dog walking holder"], 8.99, 1.2, 4, 2, 2, 22],
  ["Pet Grooming Glove (2 pack)", "Pet Products", "pet accessories", ["grooming glove", "deshedding glove", "pet brush glove"], 12.49, 3.0, 9, 6, 2, 18],
  ["Collapsible Travel Dog Bowl (2 pack)", "Pet Products", "pet accessories", ["collapsible dog bowl", "travel pet bowl", "foldable bowl"], 11.99, 2.4, 7, 7, 2, 19],
  ["Pet Car Seat Cover", "Pet Products", "pet accessories", ["pet seat cover", "dog car hammock", "backseat protector"], 24.99, 10.0, 14, 11, 3, 14],
  ["Durable Dog Rope Toy", "Pet Products", "pet accessories", ["dog rope toy", "tug toy", "chew rope"], 10.99, 5.0, 12, 4, 3, 21],

  // ── Office supplies ──
  ["Adhesive Cable Clips (16 pack)", "Office Products", "office supplies", ["cable clips", "cord organizer", "cable management"], 8.99, 1.1, 6, 4, 1, 26],
  ["Desk Organizer Caddy", "Office Products", "office supplies", ["desk organizer", "office caddy", "pen organizer"], 18.99, 4.0, 10, 6, 5, 17],
  ["Sticky Note Holder Set", "Office Products", "office supplies", ["sticky note holder", "memo holder", "desk note dispenser"], 12.99, 2.0, 7, 5, 3, 19],
  ["Cable Management Sleeve (4 pack)", "Office Products", "office supplies", ["cable sleeve", "cord cover", "wire wrap"], 13.49, 2.2, 9, 4, 2, 20],
  ["Mesh Pen Holder Cup (3 pack)", "Office Products", "office supplies", ["pen holder", "mesh cup", "desk pen organizer"], 10.99, 2.6, 7, 4, 4, 22],
  ["Expanding File Folder Organizer", "Office Products", "office supplies", ["expanding file folder", "document organizer", "accordion folder"], 16.99, 5.0, 13, 9, 2, 16],
  ["Whiteboard Eraser Set", "Office Products", "office supplies", ["whiteboard eraser", "magnetic eraser", "dry erase eraser"], 11.49, 3.0, 5, 3, 2, 18],
  ["Desk Cable Clip Organizer (6 pack)", "Office Products", "office supplies", ["desk cable clips", "cord holder", "wire clip"], 9.49, 1.0, 5, 3, 1, 23],

  // ── Car interior accessories (no safety-critical parts) ──
  ["Car Seat Gap Filler (2 pack)", "Automotive", "car interior accessories", ["seat gap filler", "console organizer", "seat side pocket"], 16.49, 3.5, 12, 4, 3, 16],
  ["Car Trunk Organizer", "Automotive", "car interior accessories", ["trunk organizer", "cargo organizer", "collapsible trunk box"], 27.99, 12.0, 17, 13, 12, 15],
  ["Car Backseat Hooks (4 pack)", "Automotive", "car interior accessories", ["car hooks", "headrest hooks", "backseat organizer hooks"], 9.99, 2.0, 5, 4, 2, 21],
  ["Car Cup Holder Coasters (set)", "Automotive", "car interior accessories", ["car coasters", "cup holder insert", "silicone coaster"], 8.49, 1.6, 4, 4, 1, 23],
  ["Car Vent Clip Phone Holder", "Automotive", "car interior accessories", ["vent phone holder", "car phone mount", "vent clip"], 14.99, 3.0, 5, 4, 3, 19],
  ["Foldable Car Sunshade", "Automotive", "car interior accessories", ["car sunshade", "windshield shade", "foldable sun shade"], 17.99, 9.0, 12, 8, 1, 17],
  ["Car Seat Back Protector (2 pack)", "Automotive", "car interior accessories", ["seat back protector", "kick mat", "backseat cover"], 15.99, 7.0, 13, 11, 1, 16],
  ["Car Door Side Pocket Organizer", "Automotive", "car interior accessories", ["car door organizer", "side pocket storage", "door caddy"], 13.99, 4.0, 11, 6, 3, 18],

  // ── Phone/laptop accessories (no batteries/chargers) ──
  ["Aluminum Foldable Laptop Stand", "Office Products", "laptop accessories", ["laptop stand", "foldable laptop riser", "aluminum stand"], 24.99, 9.0, 10, 9, 1, 20],
  ["Phone Stand Desk Holder", "Office Products", "phone accessories", ["phone stand", "desk phone holder", "adjustable stand"], 12.99, 4.0, 5, 4, 3, 22],
  ["Adjustable Tablet Stand", "Office Products", "phone accessories", ["tablet stand", "ipad stand", "desk tablet holder"], 16.99, 6.0, 6, 5, 4, 19],
  ["Laptop Sleeve Case 13-inch", "Office Products", "laptop accessories", ["laptop sleeve", "13 inch case", "padded laptop bag"], 18.99, 7.0, 14, 10, 1, 18],
  ["Phone Grip Ring Holder (3 pack)", "Office Products", "phone accessories", ["phone ring holder", "finger grip", "kickstand ring"], 9.99, 1.0, 4, 3, 1, 24],
  ["Screen Cleaning Microfiber Pads (6 pack)", "Office Products", "phone accessories", ["screen cleaning pad", "microfiber screen wipe", "lens cloth"], 8.99, 1.2, 5, 4, 1, 21],
  ["Passive Laptop Cooling Stand", "Office Products", "laptop accessories", ["laptop cooling stand", "vented riser", "laptop cooler"], 21.99, 10.0, 11, 9, 2, 16],
  ["Stick-on Phone Card Wallet", "Office Products", "phone accessories", ["phone wallet", "stick on card holder", "adhesive wallet"], 9.49, 0.8, 4, 3, 1, 23],

  // ── Travel accessories ──
  ["Travel Packing Cubes (6 set)", "Luggage & Travel Accessories", "travel accessories", ["packing cubes", "travel organizer", "compression bags"], 22.99, 9.0, 14, 10, 4, 24],
  ["Hanging Toiletry Bag", "Luggage & Travel Accessories", "travel accessories", ["toiletry bag", "hanging travel bag", "dopp kit"], 19.99, 8.0, 11, 8, 4, 18],
  ["Luggage Tags (4 pack)", "Luggage & Travel Accessories", "travel accessories", ["luggage tags", "suitcase tags", "travel id tag"], 8.99, 1.6, 5, 3, 1, 22],
  ["Travel Shoe Bags (4 pack)", "Luggage & Travel Accessories", "travel accessories", ["shoe bags", "travel shoe pouch", "dust bags"], 11.49, 2.0, 14, 9, 1, 19],
  ["Compression Packing Bags (set)", "Luggage & Travel Accessories", "travel accessories", ["compression bags", "roll up bags", "travel space saver"], 17.99, 4.0, 13, 10, 2, 17],
  ["Leakproof Travel Bottle Set", "Luggage & Travel Accessories", "travel accessories", ["travel bottles", "refillable bottles", "tsa bottle set"], 13.99, 3.5, 8, 6, 3, 20],
  ["Memory Foam Neck Pillow", "Luggage & Travel Accessories", "travel accessories", ["neck pillow", "travel pillow", "memory foam pillow"], 21.99, 9.0, 12, 11, 5, 16],
  ["Passport Holder Cover", "Luggage & Travel Accessories", "travel accessories", ["passport holder", "passport cover", "travel wallet"], 10.99, 2.0, 6, 4, 1, 21],

  // ── Fitness accessories (no supplements) ──
  ["Resistance Bands Set (5 pack)", "Sports & Outdoors", "fitness accessories", ["resistance bands", "exercise bands", "workout bands"], 18.99, 7.0, 9, 6, 3, 23],
  ["Adjustable Jump Rope", "Sports & Outdoors", "fitness accessories", ["jump rope", "speed rope", "adjustable skipping rope"], 11.99, 4.0, 7, 5, 2, 22],
  ["Yoga Mat Strap Carrier", "Sports & Outdoors", "fitness accessories", ["yoga mat strap", "mat carrier", "yoga sling"], 9.49, 1.5, 10, 3, 1, 19],
  ["Core Exercise Sliders (2 pack)", "Sports & Outdoors", "fitness accessories", ["exercise sliders", "core sliders", "gliding discs"], 12.49, 3.0, 7, 7, 1, 20],
  ["Microfiber Gym Towel", "Sports & Outdoors", "fitness accessories", ["gym towel", "microfiber towel", "sweat towel"], 13.99, 5.0, 12, 8, 2, 18],
  ["Compact Foam Roller", "Sports & Outdoors", "fitness accessories", ["foam roller", "muscle roller", "massage roller"], 19.99, 9.0, 13, 6, 6, 17],
  ["Hand Grip Strengthener (set)", "Sports & Outdoors", "fitness accessories", ["hand grip strengthener", "forearm trainer", "grip set"], 14.99, 6.0, 7, 5, 3, 19],
  ["Cable Machine Ankle Straps (2 pack)", "Sports & Outdoors", "fitness accessories", ["ankle straps", "cable machine straps", "gym ankle cuff"], 12.99, 4.0, 8, 4, 2, 18],

  // ── Storage products / containers / cases ──
  ["Vacuum Storage Bags (set)", "Home & Kitchen", "storage products", ["vacuum storage bags", "space saver bags", "compression storage"], 23.99, 4.0, 14, 10, 2, 18],
  ["Clear Stackable Shoe Boxes (6 pack)", "Home & Kitchen", "storage products", ["shoe boxes", "clear shoe storage", "stackable shoe bins"], 26.99, 7.0, 14, 9, 6, 15],
  ["Cereal Storage Containers (4 pack)", "Home & Kitchen", "containers", ["cereal containers", "dry storage container", "airtight container"], 24.99, 6.0, 12, 7, 11, 16],
  ["Toy Storage Bins (3 pack)", "Home & Kitchen", "storage products", ["toy storage bins", "fabric toy bins", "playroom organizer"], 21.99, 5.0, 15, 11, 9, 15],
  ["Garage Wall Storage Hooks (set)", "Tools & Home Improvement", "hooks", ["garage hooks", "tool wall hooks", "utility hooks"], 17.99, 6.0, 10, 6, 4, 17],
  ["Storage Tote with Lid (2 pack)", "Home & Kitchen", "containers", ["storage tote", "lidded bin", "stackable tote"], 25.99, 9.0, 16, 12, 9, 14],

  // ── Hooks / clips / holders ──
  ["Adhesive Wall Hooks (20 pack)", "Home & Kitchen", "hooks", ["adhesive hooks", "wall hooks", "damage free hooks"], 11.99, 2.0, 6, 4, 2, 24],
  ["Bag Clips (20 pack)", "Home & Kitchen", "clips", ["bag clips", "chip clips", "sealing clips"], 9.99, 2.4, 7, 5, 2, 22],
  ["Curtain Clip Rings (40 pack)", "Home & Kitchen", "clips", ["curtain clip rings", "drapery rings", "curtain hooks"], 12.49, 3.0, 6, 5, 3, 19],
  ["Wall Mount Broom & Mop Holder", "Home & Kitchen", "holders", ["broom holder", "mop organizer", "wall mount holder"], 15.99, 3.4, 16, 3, 2, 18],
  ["Under-Desk Headphone Hook", "Office Products", "hooks", ["headphone hook", "under desk hook", "headset stand"], 10.49, 1.4, 5, 3, 2, 20],
  ["Wall Key Holder Organizer", "Home & Kitchen", "holders", ["key holder", "wall key rack", "entryway organizer"], 13.99, 2.6, 9, 4, 2, 19],

  // ── Racks / mats / trays / stands ──
  ["Microfiber Dish Drying Mat", "Home & Kitchen", "mats", ["dish drying mat", "absorbent mat", "kitchen mat"], 12.99, 5.0, 18, 16, 1, 20],
  ["Sink Protector Mat (2 pack)", "Home & Kitchen", "mats", ["sink protector mat", "sink grid mat", "silicone sink mat"], 14.49, 6.0, 13, 11, 1, 17],
  ["3-Tier Countertop Jar Rack", "Home & Kitchen", "racks", ["countertop rack", "jar organizer rack", "tiered shelf"], 22.99, 8.0, 14, 5, 9, 15],
  ["No-Drill Bathroom Shelf Organizer", "Home & Kitchen", "racks", ["bathroom shelf", "no drill shelf", "shower organizer"], 23.99, 9.0, 15, 5, 7, 16],
  ["Bamboo Serving Tray", "Home & Kitchen", "trays", ["serving tray", "bamboo tray", "ottoman tray"], 21.99, 10.0, 16, 12, 2, 15],
  ["Metal Plant Stand (set of 2)", "Home & Kitchen", "stands", ["plant stand", "pot stand", "indoor plant holder"], 25.99, 11.0, 10, 10, 12, 14],
  ["Cutting Board Rack", "Home & Kitchen", "racks", ["cutting board rack", "board organizer", "tray holder"], 14.99, 3.0, 8, 5, 6, 18],
  ["Cup Drying Rack Stand", "Home & Kitchen", "stands", ["cup drying rack", "bottle drying stand", "mug holder"], 16.49, 4.0, 11, 5, 12, 17],
  ["Adjustable Monitor Stand Riser", "Office Products", "stands", ["monitor stand", "desk riser", "screen stand"], 23.99, 12.0, 14, 9, 4, 16],
  ["Dish Cloth Hanging Rack", "Home & Kitchen", "racks", ["dish cloth rack", "towel bar", "over cabinet rack"], 11.49, 2.0, 9, 2, 3, 19],
  ["Laptop Lap Desk Tray", "Office Products", "trays", ["lap desk", "laptop tray", "bed desk"], 27.99, 14.0, 20, 12, 2, 14],
  ["Phone & Tablet Holder Stand", "Office Products", "stands", ["tablet holder stand", "phone dock", "desktop stand"], 13.99, 4.0, 6, 5, 4, 20],
];

function build([name, category, product_type, keywords, price, weight, l, w, h, sellers]: Row): ProductSeed {
  const restricted_check = checkRestriction(`${name} ${product_type} ${keywords.join(" ")}`);
  const supplierTerms = [
    `${keywords[0]} wholesale`,
    `${name} bulk supplier`,
    `${keywords[0]} alibaba`,
    `${keywords[0]} MOQ`,
  ];
  return {
    name,
    short_description: `${name} — a generic ${product_type} item.`,
    category,
    product_type,
    amazon_keywords: keywords,
    price_hint: price,
    target_unit_cost: Math.max(1.2, Math.round(price * 0.22 * 100) / 100),
    weight_oz: weight,
    dimensions_in: { length: l, width: w, height: h },
    seller_count_hint: sellers,
    why_generic: `Commodity ${product_type} sold under many sellers with no brand dependency; can be listed as Generic.`,
    restricted_check: { restricted: restricted_check.restricted, reasons: restricted_check.reasons },
    risk_notes: restricted_check.restricted
      ? `Restricted: ${restricted_check.reasons.join(" ")}`
      : "No restricted-category keywords detected. Still verify gating in Seller Central.",
    supplier_search_terms: supplierTerms,
    mock_demand_hint: sellers >= 20 ? "moderate-to-strong (mock)" : "moderate (mock)",
    mock_profit_hint: `~${Math.round(((price - price * 0.22 - 4) / price) * 100)}% gross of price (mock, pre-fees)`,
    mock_confidence: "low",
    citations: [makeCitation("Curated seed catalog", "internal://seed", "Generic product idea, unverified demand", "mock")],
  };
}

/** 100+ generic, low-risk seeds. Restricted items are excluded by construction. */
export const SEED_CATALOG: ProductSeed[] = ROWS.map(build).filter((s) => !s.restricted_check.restricted);
