interface Entry<T> {
  value: T;
  expires: number;
}

/** In-memory TTL cache. TTL hours come from CACHE_TTL_HOURS (default 24). */
export class TTLCache {
  private store = new Map<string, Entry<unknown>>();
  private readonly ttlMs: number;

  constructor(ttlHours = Number(process.env.CACHE_TTL_HOURS) || 24) {
    this.ttlMs = ttlHours * 3600 * 1000;
  }

  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expires) {
      this.store.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return Promise.resolve(hit);
    return fn().then((v) => {
      this.set(key, v);
      return v;
    });
  }
}

export const globalCache = new TTLCache();
