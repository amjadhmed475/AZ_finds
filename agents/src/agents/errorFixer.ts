/* ════════════════════════════════════════════════════════════
   ERROR FIXER  ·  Auto-resolve issues found by ErrorHunter
════════════════════════════════════════════════════════════ */
import { execSync }   from "child_process";
import { existsSync, copyFileSync } from "fs";
import path           from "path";
import { agentLog }   from "../utils/logger.js";
import type { HuntReport, Issue } from "./errorHunter.js";

export interface FixResult {
  issue:   Issue;
  fixed:   boolean;
  detail?: string;
}

export class ErrorFixerAgent {
  readonly name = "ERROR-FIXER";

  async run(report: HuntReport): Promise<FixResult[]> {
    if (report.healthy) {
      agentLog(this.name, "No critical issues to fix — environment is healthy");
      return [];
    }
    agentLog(this.name, `Attempting to fix ${report.issues.filter(i => i.fix).length} fixable issue(s)…`);
    const results: FixResult[] = [];
    const root = process.env.AZ_FINDS_ROOT ?? path.join(process.cwd(), "..");

    for (const issue of report.issues) {
      if (!issue.fix) continue;
      let fixed  = false;
      let detail = "";

      try {
        switch (issue.fix) {
          case "copy_env_from_example": {
            const example = path.join(process.cwd(), ".env.example");
            const target  = path.join(process.cwd(), ".env");
            if (existsSync(example)) {
              copyFileSync(example, target);
              detail = "Copied .env.example → .env (fill in your ANTHROPIC_API_KEY)";
              fixed  = true;
            } else {
              detail = ".env.example not found — create agents/.env manually";
            }
            break;
          }
          case "npm_install_agents": {
            agentLog(this.name, "Running npm install in agents/…");
            execSync("npm install", { cwd: process.cwd(), stdio: "inherit" });
            detail = "npm install complete";
            fixed  = true;
            break;
          }
          case "npm_install_app": {
            const appDir = path.join(root, "artifact", "app");
            agentLog(this.name, "Running npm install in artifact/app/…");
            execSync("npm install", { cwd: appDir, stdio: "inherit" });
            detail = "npm install complete";
            fixed  = true;
            break;
          }
          case "set_api_key":
            detail = "Cannot auto-set API key — edit agents/.env manually";
            break;
        }
      } catch (err: any) {
        detail = `Fix failed: ${err.message}`;
      }

      agentLog(this.name, `  ${fixed ? "✓" : "✗"} ${issue.code}: ${detail}`);
      results.push({ issue, fixed, detail });
    }

    return results;
  }
}
