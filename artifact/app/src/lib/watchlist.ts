// Local persistence for watchlist + per-product verification actions (no backend).
const WKEY = "azf_watchlist_v1";
const SKEY = "azf_product_state_v1";

export type ProductStatus =
  | "not_checked" | "checked" | "failed_check" | "supplier_contacted"
  | "sample_ordered" | "ready_for_test" | "avoid";

export interface ProductState {
  status?: ProductStatus;
  notes?: string;
  follow_up?: string;
  verified?: {
    seller_central?: boolean; fee_checked?: boolean; supplier_quote?: boolean;
    sample_ordered?: boolean; image_confirmed?: boolean; ppc_uploaded?: boolean; keepa?: boolean;
  };
}

function read<T>(k: string, fb: T): T { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return fb; } }
function write(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }

export const getWatchlist = (): string[] => read<string[]>(WKEY, []);
export function toggleWatch(id: string): string[] {
  const list = getWatchlist();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  write(WKEY, next);
  return next;
}
export const isWatched = (id: string): boolean => getWatchlist().includes(id);

export const getStates = (): Record<string, ProductState> => read(SKEY, {});
export const getState = (id: string): ProductState => getStates()[id] ?? {};
export function setState(id: string, patch: Partial<ProductState>): ProductState {
  const all = getStates();
  const next = { ...(all[id] ?? {}), ...patch, verified: { ...(all[id]?.verified ?? {}), ...(patch.verified ?? {}) } };
  all[id] = next; write(SKEY, all);
  return next;
}

/** Count of verification items the user has confirmed — drives data-quality upgrades. */
export function verifiedCount(id: string): number {
  const v = getState(id).verified ?? {};
  return Object.values(v).filter(Boolean).length;
}
