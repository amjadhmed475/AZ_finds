import { normalizeText } from "./normalize.js";
import type { RiskLevel } from "../types/product.js";

/**
 * Keyword-driven safety / compliance heuristics. These are conservative and
 * advisory only — they never confirm legality, only flag likely concerns so
 * the seller verifies in Seller Central and with counsel.
 */

export const RESTRICTED_KEYWORDS: Record<string, string[]> = {
  supplements: ["supplement", "vitamin", "probiotic", "collagen", "creatine", "protein powder", "gummies vitamin", "fish oil", "melatonin"],
  food: ["food", "snack", "candy", "tea", "coffee", "edible", "spice", "sauce", "seasoning", "honey", "syrup", "chocolate"],
  drinks: ["drink", "beverage", "juice", "soda", "energy drink", "water bottle drink", "kombucha", "electrolyte drink"],
  cosmetics: ["cosmetic", "makeup", "lipstick", "foundation", "mascara", "eyeshadow", "nail polish", "concealer"],
  skincare_liquid: ["serum", "cream", "lotion", "moisturizer", "sunscreen", "toner", "essential oil", "face oil", "ointment"],
  medical: ["medical", "thermometer", "blood pressure", "first aid", "brace", "orthopedic", "mask n95", "compression sleeve", "tens unit", "nebulizer"],
  baby: ["baby", "infant", "pacifier", "crib", "infant car seat", "baby car seat", "teether", "nursing", "diaper", "toddler safety"],
  battery: ["lithium", "battery", "power bank", "18650", "rechargeable cell", "battery pack", "aa battery", "coin cell"],
  hazmat: ["aerosol", "flammable", "lighter", "butane", "propane", "magnet set", "compressed gas"],
  pesticides: ["pesticide", "insecticide", "herbicide", "rodenticide", "bug killer", "ant killer", "weed killer"],
  chemicals: ["bleach", "ammonia", "drain cleaner", "industrial solvent", "acid cleaner", "pool chemical", "lye"],
  controlled: ["cbd", "thc", "hemp oil", "nicotine", "vape", "e-liquid", "alcohol", "wine", "kratom", "delta 8"],
  electronics_cert: ["charger", "adapter", "wall plug", "led driver", "transmitter", "power supply"],
  weapons: ["knife", "blade", "pepper spray", "taser", "stun gun", "self defense", "machete", "brass knuckle"],
  ip_brand: ["disney", "marvel", "nike", "apple", "lego", "stanley", "yeti", "pokemon", "nintendo", "gucci", "louis vuitton"],
};

export const REGULATORY_HINTS: Record<string, string> = {
  supplements: "FDA registration / supplement facts compliance likely required.",
  food: "FDA food-safety and labeling rules likely apply.",
  drinks: "FDA beverage / labeling rules and Amazon consumables gating likely apply.",
  cosmetics: "FDA cosmetic + MoCRA registration likely required.",
  skincare_liquid: "FDA cosmetic / ingredient + MoCRA rules likely apply to skin-contact liquids.",
  medical: "FDA medical-device classification may apply.",
  baby: "CPSIA + ASTM child-safety testing likely required.",
  battery: "UN38.3 / lithium hazmat + transport rules apply.",
  hazmat: "Amazon hazmat review and SDS likely required.",
  pesticides: "EPA registration + state pesticide rules likely required.",
  chemicals: "Hazmat handling, SDS, and Amazon chemical restrictions likely apply.",
  controlled: "CBD/THC/nicotine/alcohol are restricted or prohibited on Amazon.",
  electronics_cert: "FCC / UL / certification may be required for powered electronics.",
  weapons: "Restricted/prohibited in many Amazon categories and states.",
};

/** Categories that cause an automatic hard rejection (never surfaced as a buy). */
export const HARD_REJECT_GROUPS = [
  "supplements", "food", "drinks", "cosmetics", "skincare_liquid", "medical",
  "baby", "battery", "hazmat", "pesticides", "chemicals", "controlled", "weapons",
];

export interface SafetyFlags {
  matched: string[];
  hazmat_risk: RiskLevel;
  regulatory_risk: RiskLevel;
  safety_risk: RiskLevel;
  ip_risk: RiskLevel;
  regulatory_notes: string[];
  hard_reject: boolean;
}

export function scanSafety(text: string): SafetyFlags {
  const t = normalizeText(text);
  const matched: string[] = [];
  const notes: string[] = [];
  for (const [group, words] of Object.entries(RESTRICTED_KEYWORDS)) {
    if (words.some((w) => t.includes(normalizeText(w)))) {
      matched.push(group);
      if (REGULATORY_HINTS[group]) notes.push(REGULATORY_HINTS[group]);
    }
  }
  const has = (g: string) => matched.includes(g);
  const hazmat: RiskLevel = has("hazmat") || has("battery") || has("chemicals") || has("pesticides") ? "high" : "low";
  const regulatory: RiskLevel =
    has("supplements") || has("food") || has("drinks") || has("cosmetics") ||
    has("skincare_liquid") || has("medical") || has("baby") || has("controlled") || has("pesticides")
      ? "high"
      : has("electronics_cert")
        ? "medium"
        : "low";
  const safety: RiskLevel = has("baby") || has("medical") || has("weapons") || has("chemicals") ? "high" : "low";
  const ip: RiskLevel = has("ip_brand") ? "high" : "low";
  const hardReject = HARD_REJECT_GROUPS.some((g) => has(g));
  return {
    matched,
    hazmat_risk: hazmat,
    regulatory_risk: regulatory,
    safety_risk: safety,
    ip_risk: ip,
    regulatory_notes: notes,
    hard_reject: hardReject,
  };
}
