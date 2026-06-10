/* ════════════════════════════════════════════════════════════
   MAXIMUS API SERVER  ·  Port 3001
   All Anthropic calls live here — key never reaches the browser
════════════════════════════════════════════════════════════ */
import express from "express";
import cors    from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { CONFIG }    from "./config.js";
import { agentLog }  from "./utils/logger.js";

const app    = express();
const client = new Anthropic({ apiKey: CONFIG.anthropicKey });

app.use(cors({ origin: ["http://localhost:5174", "http://localhost:5173", "http://localhost:3000"] }));
app.use(express.json());

/* ── Health ── */
app.get("/health", (_req, res) => {
  res.json({
    status:  "online",
    agent:   "MAXIMUS",
    model:   CONFIG.models.maximus,
    time:    new Date().toISOString(),
  });
});

/* ── MAXIMUS Chat — SSE streaming ── */
app.post("/api/maximus", async (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message?.trim()) {
    return res.status(400).json({ error: "message required" });
  }

  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  agentLog("MAXIMUS", `Query: "${message.slice(0, 60)}…"`);

  try {
    const stream = await client.messages.stream({
      model:      CONFIG.models.maximus,
      max_tokens: 1024,
      system: `You are MAXIMUS, the Chief Intelligence Officer of Yamari Group's Amazon FBA Intelligence Division.
You combine the analytical precision of JARVIS with deep Amazon marketplace expertise.
You advise on product opportunities, sourcing strategy, competitive positioning, PPC, and capital allocation.
You speak with authority, clarity, and strategic depth. Never refuse relevant commerce questions.
Keep answers concise and actionable. Use structured formatting when helpful (bullet points, sections).
Current context: Amazon FBA seller dashboard showing product research, supplier data, and market analysis.`,
      messages: [{ role: "user", content: message }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
    agentLog("MAXIMUS", "Stream complete");
  } catch (err: any) {
    agentLog("MAXIMUS", `Stream error: ${err.message}`);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

/* ── Start ── */
const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  agentLog("MAXIMUS", `Intelligence server online — http://localhost:${PORT}`);
  agentLog("MAXIMUS", `Model: ${CONFIG.models.maximus}`);
});
