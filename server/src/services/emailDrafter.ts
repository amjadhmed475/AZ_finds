export type EmailType = "reorder" | "negotiate" | "quality";

export interface EmailDraftRequest {
  type: EmailType;
  supplier_name: string;
  contact_name?: string;
  product_name: string;
  qty?: number;
  current_price?: number;
  target_price?: number;
  delivery_date?: string;
  issue?: string;
}

export async function draftSupplierEmail(req: EmailDraftRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return `Dear ${req.contact_name ?? "Team"},\n\nI hope this message finds you well.\n\n[ANTHROPIC_API_KEY not set — add it to .env to enable AI drafts]\n\nBest regards,\nYamari Group`;

  const prompts: Record<EmailType, string> = {
    reorder: `Draft a professional, friendly reorder email to ${req.supplier_name}${req.contact_name ? ` (${req.contact_name})` : ""} for ${req.qty} units of ${req.product_name}. ${req.target_price ? `Target unit price: $${req.target_price}.` : ""} ${req.delivery_date ? `We need delivery by ${req.delivery_date}.` : ""} Keep it concise and business-like. Sign off as Yamari Group.`,
    negotiate: `Draft a price negotiation email to ${req.supplier_name}${req.contact_name ? ` (${req.contact_name})` : ""} for ${req.product_name}. Current price: $${req.current_price}/unit. Target price: $${req.target_price}/unit. We are a repeat buyer and can commit to regular orders. Be professional, firm but collaborative. Sign as Yamari Group.`,
    quality: `Draft a professional quality complaint email to ${req.supplier_name}${req.contact_name ? ` (${req.contact_name})` : ""} regarding ${req.product_name}. Issue: ${req.issue ?? "quality defects found upon inspection"}. Request resolution within 7 business days. Include a request for replacement or credit. Firm but professional tone. Sign as Yamari Group.`,
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-fable-5",
      max_tokens: 600,
      system: "You are a professional business email writer for an Amazon FBA company. Write clear, concise supplier emails. Return ONLY the email text, no commentary.",
      messages: [{ role: "user", content: prompts[req.type] }],
    }),
  });

  if (!response.ok) return "Email draft failed — check API key";
  const data = await response.json() as any;
  return data.content?.[0]?.text ?? "Draft unavailable";
}
