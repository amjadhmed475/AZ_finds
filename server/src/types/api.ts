export type DataMode =
  | "estimate_engine_only"
  | "hybrid_low_cost"
  | "live_selected_only"
  | "full_live_scan";

export interface SourceStatus {
  name: string;
  connected: boolean;
  status: "live" | "locked";
}

export interface ApiUsageStatus {
  data_mode: DataMode;
  sources: SourceStatus[];
  api_calls_used_today: number;
  cache_hits: number;
  cache_misses: number;
  estimated_calls_saved: number;
  last_refresh: string;
  next_refresh: string;
  max_api_calls: number;
  warnings: string[];
}
