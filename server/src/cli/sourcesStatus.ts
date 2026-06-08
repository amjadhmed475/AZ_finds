/**
 * Print data-source + API-usage status (mode, live/locked sources, cache, savings).
 *   npm run sources:status
 */
import { getApiUsageStatusTool } from "../tools/getApiUsageStatus.js";

async function main() {
  const s = await getApiUsageStatusTool({});
  console.error("=== Data sources & API usage ===");
  console.error(`Data mode        : ${s.data_mode}`);
  for (const src of s.sources) console.error(`  ${src.connected ? "● live  " : "🔒 locked"} ${src.name}`);
  const pex = process.env.PEXELS_API_KEY ? "● live" : "🔒 locked";
  console.error(`  ${pex} Pexels (product images)`);
  console.error(`API calls today  : ${s.api_calls_used_today}`);
  console.error(`Cache hits       : ${s.cache_hits}`);
  console.error(`Estimated saved  : ${s.estimated_calls_saved}`);
  console.error(`Last refresh     : ${s.last_refresh}`);
  console.error(`Next refresh     : ${s.next_refresh}`);
  if (s.warnings.length) console.error("Notes: " + s.warnings.join(" "));
}

main().catch((e) => { console.error(e); process.exit(1); });
