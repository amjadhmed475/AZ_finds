/* ════════════════════════════════════════════════════════════
   MAXIMUS HTTP SERVER  ·  Port 3001
   Runs alongside the MCP stdio server.
   Provides the React frontend with:
     POST /api/maximus  — SSE streaming chat (claude-fable-5)
     GET  /api/batch/latest — serve latest batch JSON
     GET  /health
   API key never reaches the browser.
════════════════════════════════════════════════════════════ */
import { config as dotenvConfig } from "dotenv";
import { resolve, dirname }       from "path";
import { fileURLToPath }          from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
/* load root .env first, then server/.env as optional override */
dotenvConfig({ path: resolve(__dir, "../../.env") });
dotenvConfig({ path: resolve(__dir, "../.env") });

import express         from "express";
import cors            from "cors";
import Anthropic       from "@anthropic-ai/sdk";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join }        from "path";

const app    = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_ORIGINS = [
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:3000",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || /\.netlify\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error("CORS blocked"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

/* ── Health ────────────────────────────────────────────── */
app.get("/health", (_req, res) => {
  res.json({
    status:  "online",
    agent:   "MAXIMUS",
    model:   "claude-fable-5",
    mcp:     "stdio — run: cd server && npm start",
    key_set: !!process.env.ANTHROPIC_API_KEY,
    time:    new Date().toISOString(),
  });
});

/* ── Latest batch data ──────────────────────────────────── */
app.get("/api/batch/latest", (_req, res) => {
  const batchDir = resolve(__dir, "../../server/data/batches");
  if (existsSync(batchDir)) {
    const files = readdirSync(batchDir)
      .filter(f => f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length > 0) {
      const raw = readFileSync(join(batchDir, files[0]), "utf8");
      return res.json(JSON.parse(raw));
    }
  }
  const fallbacks = [
    resolve(__dir, "../../artifact/app/public/sample-dashboard.json"),
    resolve(__dir, "../../sample-dashboard.json"),
  ];
  for (const p of fallbacks) {
    if (existsSync(p)) return res.json(JSON.parse(readFileSync(p, "utf8")));
  }
  res.status(404).json({ error: "No batch data found" });
});

/* ── MAXIMUS chat — SSE streaming ──────────────────────── */
const MAXIMUS_SYSTEM = `You are MAXIMUS — Chief Intelligence Officer of Yamari Group's Amazon FBA Intelligence Division.
You are the definitive intersection of JARVIS-class AI reasoning and deep Amazon marketplace mastery.

Mission:
- Provide strategic intelligence on FBA product opportunities, supplier chains, pricing, and market dynamics
- Analyse products, competition, and profit with precision using data from the AZ Finds dashboard
- Give actionable, capital-efficient, execution-ready recommendations
- Think several moves ahead — risk-adjusted, always honest about estimate-level data

Character:
- Speak with authority, clarity, and strategic depth — like a world-class CIO briefing the board
- Concise but never shallow. Dense with insight.
- Use structured formatting (bullets, headers) when it improves comprehension
- Never refuse relevant Amazon, commerce, sourcing, or market questions
- Distinguish clearly between live data and estimates

Context: The user runs AZ Finds — a React dashboard showing Amazon FBA product research graded A5–D1,
with supplier sourcing, PPC, capital planning, and market analysis. An MCP server with 20 research tools
powers the intelligence pipeline.`;

app.post("/api/maximus", async (req, res) => {
  const { message, history = [] } = req.body as {
    message?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.setHeader("Content-Type", "text/event-stream");
    res.write(`data: ${JSON.stringify({ error: "ANTHROPIC_API_KEY not set — add it to your root .env file" })}\n\n`);
    return res.end();
  }

  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const messages: Anthropic.MessageParam[] = [
    ...((history as any[]).slice(-12)),
    { role: "user", content: message.trim() },
  ];

  try {
    const stream = await client.messages.stream({
      model:      "claude-fable-5",
      max_tokens: 2048,
      system:     MAXIMUS_SYSTEM,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

const PORT = Number(process.env.MAXIMUS_PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`\n[MAXIMUS] Intelligence server → http://localhost:${PORT}`);
  console.log(`[MAXIMUS] Model:  claude-fable-5`);
  console.log(`[MAXIMUS] Chat:   POST  /api/maximus`);
  console.log(`[MAXIMUS] Batch:  GET   /api/batch/latest`);
  console.log(`[MAXIMUS] Health: GET   /health\n`);
});
