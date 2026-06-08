/**
 * Enrich the latest daily batch with REAL product photos (top 50 only) when an
 * image source is configured (PEXELS_API_KEY, or OPENVERSE_ENABLED=true), then
 * rewrite the batch file + dashboard JSON. Falls back to premium illustrations.
 *   npm run images:enrich
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadLatestBatch, BATCH_DIR } from "../services/batchService.js";
import { resolveProductImage } from "../services/imageService.js";
import { buildBatchDashboard, writeDashboard } from "./lib.js";

async function main() {
  const batch = await loadLatestBatch();
  if (!batch) { console.error("No batch found. Run npm run research:daily first."); process.exit(1); }

  let real = 0;
  for (const bp of batch.products.slice(0, 50)) {
    const c = bp.candidate;
    const img = await resolveProductImage(c.id, c.name, (c as any).product_type || "", c.category, { allow_supplier_images: true });
    c.image = img;
    if (!img.fallback_used) real += 1;
  }

  await writeFile(join(BATCH_DIR, `${batch.batch_date}.json`), JSON.stringify(batch, null, 2), "utf8");
  const dashboard = await buildBatchDashboard(batch);
  await writeDashboard(dashboard);

  console.error(`Image enrichment: ${real} real photo(s), ${batch.products.length - real} premium illustration(s).`);
  if (real === 0) console.error("No image source connected — set PEXELS_API_KEY (or OPENVERSE_ENABLED=true) and re-run for real photos.");
}

main().catch((e) => { console.error(e); process.exit(1); });
