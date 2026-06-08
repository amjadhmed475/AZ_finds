import { getApiUsageStatus } from "../services/apiUsageService.js";
import { loadLatestBatch } from "../services/batchService.js";
import type { ApiUsageStatus, DataMode } from "../types/api.js";

export interface ApiStatusInput {
  date?: string;
  data_mode?: DataMode;
  include_cache_details?: boolean;
}

export async function getApiUsageStatusTool(i: ApiStatusInput): Promise<ApiUsageStatus> {
  const latest = await loadLatestBatch();
  return getApiUsageStatus({
    data_mode: i.data_mode ?? latest?.data_mode ?? "hybrid_low_cost",
    product_count: latest?.products_generated ?? 50,
    max_api_calls: latest?.api_usage.max_api_calls ?? 20,
    date: i.date ?? new Date().toISOString().slice(0, 10),
  });
}
