import { scanSafety, REGULATORY_HINTS, HARD_REJECT_GROUPS } from "../utils/safety.js";

const GROUP_LABEL: Record<string, string> = {
  supplements: "Supplements / vitamins",
  food: "Food",
  drinks: "Drinks / beverages",
  cosmetics: "Cosmetics",
  skincare_liquid: "Skin-care liquids",
  medical: "Medical products",
  baby: "Baby products",
  battery: "Batteries / lithium",
  hazmat: "Hazmat",
  pesticides: "Pesticides",
  chemicals: "Chemicals",
  controlled: "CBD / THC / nicotine / alcohol",
  weapons: "Weapons / self-defense",
  electronics_cert: "Powered electronics (certification)",
  ip_brand: "Brand / IP term",
};

export interface RestrictionResult {
  restricted: boolean;            // hard-reject?
  matched_groups: string[];       // every group that matched (hard + soft)
  reject_groups: string[];        // only hard-reject groups
  reasons: string[];              // human-readable reasons
  regulatory_notes: string[];
}

/**
 * Restricted-category rejection engine. Hard-rejects the categories the project
 * forbids for new generic sellers and explains WHY. This is advisory: it does
 * not confirm legality, only flags likely-restricted items so they never get
 * surfaced as a buy recommendation.
 */
export function checkRestriction(text: string): RestrictionResult {
  const flags = scanSafety(text);
  const rejectGroups = flags.matched.filter((g) => HARD_REJECT_GROUPS.includes(g));
  const reasons = flags.matched.map((g) => {
    const label = GROUP_LABEL[g] || g;
    const hard = HARD_REJECT_GROUPS.includes(g);
    const hint = REGULATORY_HINTS[g] ? ` ${REGULATORY_HINTS[g]}` : "";
    return `${hard ? "Hard-rejected" : "Flagged"}: ${label}.${hint}`;
  });
  return {
    restricted: flags.hard_reject,
    matched_groups: flags.matched,
    reject_groups: rejectGroups,
    reasons,
    regulatory_notes: flags.regulatory_notes,
  };
}

export function restrictionLabel(group: string): string {
  return GROUP_LABEL[group] || group;
}
