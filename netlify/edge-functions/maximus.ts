/* ════════════════════════════════════════════════════════════
   MAXIMUS  ·  Netlify Edge Function (Deno)
   Handles POST /api/maximus in production.
   Streams claude-fable-5 responses via SSE.
   ANTHROPIC_API_KEY is a Netlify environment variable — never in git.
════════════════════════════════════════════════════════════ */

const SYSTEM = `You are MAXIMUS — Chief Intelligence Officer of Yamari Group's Amazon FBA Intelligence Division.
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

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: Request): Promise<Response> {
  /* preflight */
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({ error: "ANTHROPIC_API_KEY not set in Netlify env vars" })}\n\ndata: [DONE]\n\n`,
      { headers: { "Content-Type": "text/event-stream", ...CORS } },
    );
  }

  let body: { message?: string; history?: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const { message, history = [] } = body;
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const messages = [
    ...history.slice(-12),
    { role: "user", content: message.trim() },
  ];

  /* Stream from Anthropic → transform → return */
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-fable-5",
      max_tokens: 2048,
      stream:     true,
      system:     SYSTEM,
      messages,
    }),
  });

  if (!anthropicRes.ok || !anthropicRes.body) {
    const err = await anthropicRes.text().catch(() => "upstream error");
    return new Response(
      `data: ${JSON.stringify({ error: err })}\n\ndata: [DONE]\n\n`,
      { headers: { "Content-Type": "text/event-stream", ...CORS } },
    );
  }

  /* TransformStream: Anthropic SSE → our `{ delta }` SSE format */
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer  = writable.getWriter();
  const enc     = new TextEncoder();
  const dec     = new TextDecoder();

  (async () => {
    const reader = anthropicRes.body!.getReader();
    let   buf    = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const p = JSON.parse(data);
            if (p.type === "content_block_delta" && p.delta?.type === "text_delta") {
              await writer.write(enc.encode(`data: ${JSON.stringify({ delta: p.delta.text })}\n\n`));
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } finally {
      await writer.write(enc.encode("data: [DONE]\n\n"));
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", ...CORS },
  });
}

export const config = { path: "/api/maximus" };
