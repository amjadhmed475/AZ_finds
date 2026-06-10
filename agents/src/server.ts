/* ════════════════════════════════════════════════════════════
   AZ FINDS AGENT SERVER  ·  Port 3001
   Provides local API endpoints for the agent pipeline
   (health checks, batch data relay, dry-run testing).

   NOTE: The MAXIMUS AI system lives at https://themaximus.netlify.app
   This server is the background agent pipeline only — NOT a
   Maximus replacement.
════════════════════════════════════════════════════════════ */
import express from "express";
import cors    from "cors";
import { CONFIG }   from "./config.js";
import { agentLog } from "./utils/logger.js";

const app = express();

app.use(cors({ origin: ["http://localhost:5174", "http://localhost:5173"] }));
app.use(express.json());

/* ── Health ── */
app.get("/health", (_req, res) => {
  res.json({
    status: "online",
    service: "AZ Finds Agent Pipeline",
    note:    "MAXIMUS AI is at https://themaximus.netlify.app",
    time:    new Date().toISOString(),
  });
});

/* ── Start ── */
const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  agentLog("AGENT-SERVER", `Agent pipeline server online — http://localhost:${PORT}`);
  agentLog("AGENT-SERVER", `MAXIMUS AI: https://themaximus.netlify.app`);
});
