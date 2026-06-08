export interface Citation {
  source_name: string;
  source_url: string;
  accessed_date: string; // ISO date
  claim_supported: string;
  /** 0..1 — higher means more reliable (official > marketplace > forum/anecdote). */
  reliability_score: number;
}
