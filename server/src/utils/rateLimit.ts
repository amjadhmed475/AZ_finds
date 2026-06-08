/** Minimal token-bucket limiter to keep external API calls polite. */
export class RateLimiter {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private last: number;

  constructor(ratePerSecond = 2, burst = 4) {
    this.capacity = burst;
    this.tokens = burst;
    this.refillPerMs = ratePerSecond / 1000;
    this.last = Date.now();
  }

  private refill() {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) * this.refillPerMs);
    this.last = now;
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitMs = Math.ceil((1 - this.tokens) / this.refillPerMs);
    await new Promise((r) => setTimeout(r, waitMs));
    this.refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }
}
