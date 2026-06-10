/* ════════════════════════════════════════════════════════════
   ERROR HUNTER  ·  Scan the runtime environment for issues
   Checks: .env, API key, node_modules, build, sample data,
           port conflicts
════════════════════════════════════════════════════════════ */
import { existsSync } from "fs";
import path           from "path";
import { createServer } from "net";
import { agentLog }   from "../utils/logger.js";

export interface Issue {
  code:     string;
  severity: "critical" | "warning" | "info";
  message:  string;
  fix?:     string;
}

export interface HuntReport {
  issues:  Issue[];
  healthy: boolean;
}

function portFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const srv = createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => { srv.close(() => resolve(true)); });
    srv.listen(port, "127.0.0.1");
  });
}

export class ErrorHunterAgent {
  readonly name = "ERROR-HUNTER";

  async run(): Promise<HuntReport> {
    agentLog(this.name, "Scanning environment for issues…");
    const root   = process.env.AZ_FINDS_ROOT ?? path.join(process.cwd(), "..");
    const issues: Issue[] = [];

    /* ── .env file ── */
    const envFile = path.join(process.cwd(), ".env");
    if (!existsSync(envFile)) {
      issues.push({
        code: "NO_ENV_FILE", severity: "critical",
        message: "agents/.env not found",
        fix:     "copy_env_from_example",
      });
    }

    /* ── API key ── */
    const ak = process.env.ANTHROPIC_API_KEY ?? "";
    if (!ak) {
      issues.push({
        code: "NO_API_KEY", severity: "critical",
        message: "ANTHROPIC_API_KEY is empty",
        fix:     "set_api_key",
      });
    } else if (!ak.startsWith("sk-ant-")) {
      issues.push({
        code: "BAD_API_KEY_FORMAT", severity: "warning",
        message: "ANTHROPIC_API_KEY does not start with sk-ant-",
      });
    }

    /* ── agents/node_modules ── */
    if (!existsSync(path.join(process.cwd(), "node_modules"))) {
      issues.push({
        code: "NO_AGENT_DEPS", severity: "critical",
        message: "agents/node_modules missing — run npm install",
        fix:     "npm_install_agents",
      });
    }

    /* ── artifact/app/node_modules ── */
    const appDeps = path.join(root, "artifact", "app", "node_modules");
    if (!existsSync(appDeps)) {
      issues.push({
        code: "NO_APP_DEPS", severity: "warning",
        message: "artifact/app/node_modules missing — frontend won't build",
        fix:     "npm_install_app",
      });
    }

    /* ── sample data ── */
    const samplePaths = [
      path.join(root, "server", "data", "batches"),
      path.join(root, "artifact", "app", "public", "sample-dashboard.json"),
      path.join(root, "sample-dashboard.json"),
    ];
    const hasData = samplePaths.some(p => existsSync(p));
    if (!hasData) {
      issues.push({
        code: "NO_SAMPLE_DATA", severity: "warning",
        message: "No batch data or sample-dashboard.json found",
      });
    }

    /* ── port conflicts ── */
    const port3001 = await portFree(3001);
    const port5174 = await portFree(5174);
    if (!port3001) {
      issues.push({ code: "PORT_3001_BUSY", severity: "info",
        message: "Port 3001 already in use — Maximus server may already be running" });
    }
    if (!port5174) {
      issues.push({ code: "PORT_5174_BUSY", severity: "info",
        message: "Port 5174 already in use — Vite dev server may already be running" });
    }

    const critical = issues.filter(i => i.severity === "critical").length;
    agentLog(this.name, `Scan complete — ${issues.length} issue(s), ${critical} critical`);
    for (const i of issues) {
      agentLog(this.name, `  [${i.severity.toUpperCase()}] ${i.code}: ${i.message}`);
    }

    return { issues, healthy: critical === 0 };
  }
}
