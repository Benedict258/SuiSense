const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com";

async function callOpenAI(systemPrompt: string, userPayload: Record<string, any>): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;

  const response = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : null;
}

export async function explainTxWithLLM(facts: Record<string, any>): Promise<string | null> {
  const systemPrompt =
    "You are a transaction explainer for Sui. Only use the provided JSON facts. " +
    "Do not invent amounts or objects. If a value is unknown, say it is unknown. " +
    "Return a concise paragraph.";
  return await callOpenAI(systemPrompt, facts);
}

export async function explainErrorWithLLM(summary: Record<string, any>): Promise<string | null> {
  const systemPrompt =
    "You explain Move errors in plain English. Only use the provided JSON. " +
    "Do not invent details. Return 2-4 sentences maximum.";
  return await callOpenAI(systemPrompt, summary);
}

export function explainTxFallback(facts: Record<string, any>): string {
  const intent = facts.intent || "Intent unknown";
  const functions = facts.called_functions || [];
  const assetIn = facts.assets?.in || [];
  const assetOut = facts.assets?.out || [];
  const transfers = facts.assets?.transfers || [];
  const shared = facts.shared_objects || [];

  const parts = [`Intent: ${intent}.`];
  if (functions.length) {
    parts.push(`Functions called: ${functions.join(", ")}.`);
  }
  if (assetIn.length || assetOut.length) {
    parts.push(`Balance changes observed (in: ${assetIn.length}, out: ${assetOut.length}).`);
  }
  if (transfers.length) {
    parts.push(`Object transfers: ${transfers.length}.`);
  }
  if (shared.length) {
    parts.push(`Shared objects touched: ${shared.length}.`);
  }
  if (!functions.length && !assetIn.length && !assetOut.length && !transfers.length) {
    parts.push("Insufficient data to determine detailed behavior.");
  }
  return parts.join(" ");
}

export function explainErrorFallback(summary: Record<string, any>): string {
  const parts = [`${summary.summary || "Move error detected"}.`];
  if (summary.likely_cause) {
    parts.push(summary.likely_cause);
  }
  if (summary.move_stack?.length) {
    parts.push(`Stack frames detected: ${summary.move_stack.length}.`);
  }
  if (summary.abort_code && summary.abort_code !== "unknown") {
    parts.push(`Abort code: ${summary.abort_code}.`);
  }
  return parts.join(" ");
}
