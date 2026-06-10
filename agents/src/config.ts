import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* Load .env files — agents/.env first, then project root .env */
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  try {
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

/* agents/.env → project-root/.env */
loadEnvFile(resolve(__dirname, "../../.env"));
loadEnvFile(resolve(__dirname, "../../../.env"));

export const CONFIG = {
  anthropicKey:   process.env.ANTHROPIC_API_KEY ?? "",
  imessageTarget: process.env.IMESSAGE_RECIPIENT ?? "",
  azFindsRoot:    resolve(__dirname, process.env.AZ_FINDS_ROOT ?? "../../"),
  dryRun:         process.env.DRY_RUN === "true",

  models: {
    orchestrator: process.env.ORCHESTRATOR_MODEL ?? "claude-opus-4-8",
    maximus:      process.env.MAXIMUS_MODEL      ?? "claude-fable-5",
    herald:       process.env.HERALD_MODEL       ?? "claude-haiku-4-5-20251001",
  },
} as const;
