import { estimateMarket, type EstimateInput, type MarketEstimate } from "../services/amazonEstimateService.js";

/** Tool wrapper for analyze_amazon_market. */
export async function searchAmazonSignals(input: EstimateInput): Promise<MarketEstimate> {
  return estimateMarket(input);
}
