// Static fallback rates (relative to USD). Real mode can override via an API.
// These are approximate and only used to normalize supplier quotes for display.
const RATES: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, CNY: 0.14, CAD: 0.73, AUD: 0.66, INR: 0.012,
};

export function toUSD(amount: number, currency = "USD"): number {
  const r = RATES[currency.toUpperCase()] ?? 1;
  return Math.round(amount * r * 100) / 100;
}

export function fmtUSD(amount: number): string {
  return `$${(Math.round(amount * 100) / 100).toFixed(2)}`;
}

export function isSupportedCurrency(c: string): boolean {
  return Boolean(RATES[c.toUpperCase()]);
}
