/* ════════════════════════════════════════════════════════════
   ENV VALIDATOR  ·  Masks keys in logs, checks formats
════════════════════════════════════════════════════════════ */
import { existsSync } from "fs";
import path from "path";
import { agentLog } from "./logger.js";

export interface KeyStatus { key: string; present: boolean; valid: boolean; masked: string; }
export interface ValidationReport {
  allValid: boolean;
  keys:     KeyStatus[];
  warnings: string[];
}

const ANTHROPIC_RE = /^sk-ant-[a-zA-Z0-9\-_]{20,}$/;

function mask(value: string): string {
  if (!value || value.length < 12) return "****";
  return value.slice(0, 8) + "…" + value.slice(-4);
}

export function validateEnv(env: Record<string, string | undefined> = process.env): ValidationReport {
  const report: ValidationReport = { allValid: true, keys: [], warnings: [] };

  /* ANTHROPIC_API_KEY */
  const ak = env["ANTHROPIC_API_KEY"] ?? "";
  const akValid = ANTHROPIC_RE.test(ak);
  report.keys.push({ key: "ANTHROPIC_API_KEY", present: !!ak, valid: akValid, masked: mask(ak) });
  if (!ak)      { report.allValid = false; report.warnings.push("ANTHROPIC_API_KEY is missing"); }
  else if (!akValid) {
    report.allValid = false;
    report.warnings.push(`ANTHROPIC_API_KEY format looks wrong (expected sk-ant-…): ${mask(ak)}`);
  }

  /* IMESSAGE_RECIPIENT — optional, warn only */
  const im = env["IMESSAGE_RECIPIENT"] ?? "";
  report.keys.push({ key: "IMESSAGE_RECIPIENT", present: !!im, valid: true, masked: im ? mask(im) : "(not set)" });
  if (!im) report.warnings.push("IMESSAGE_RECIPIENT not set — iMessage briefings will be skipped");

  /* .env file presence check */
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    report.warnings.push(".env file not found in agents/ — copy agents/.env.example and fill in your keys");
  }

  return report;
}

export function logValidationReport(report: ValidationReport): void {
  agentLog("ENV-VALIDATOR", `Validation ${report.allValid ? "✓ passed" : "✗ FAILED"}`);
  for (const k of report.keys) {
    const mark = k.valid ? "✓" : k.present ? "!" : "✗";
    agentLog("ENV-VALIDATOR", `  ${mark} ${k.key}: ${k.masked}`);
  }
  for (const w of report.warnings) {
    agentLog("ENV-VALIDATOR", `  ⚠ ${w}`);
  }
}
