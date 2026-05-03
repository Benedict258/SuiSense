/**
 * Edge adapter interface.
 *
 * Each chain edge must implement this interface and be registered below.
 * The active edge is selected by the EDGE environment variable (default: "solana").
 */
export interface EdgeAdapter {
  /** Fetch a transaction by its ID/signature and return raw chain data. */
  fetchTransaction(id: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;

  /** Extract structured facts from raw chain data. */
  extractFacts(rawTx: Record<string, unknown>): Record<string, unknown>;

  /** Infer a human-readable intent string from extracted facts. */
  inferIntent(facts: Record<string, unknown>): string;

  /** Infer risk level and confidence from extracted facts. */
  inferRisk(facts: Record<string, unknown>): { risk: string; confidence: string };
}

export function getActiveEdge(): string {
  return (process.env.EDGE || "solana").toLowerCase();
}

/**
 * Returns the edge adapter for the currently active EDGE.
 * Import is deferred to avoid loading unused chain SDKs.
 */
export async function loadEdgeAdapter(): Promise<EdgeAdapter> {
  const edge = getActiveEdge();

  if (edge === "sui") {
    const { suiEdge } = await import("./sui/index.js");
    return suiEdge;
  }

  if (edge === "solana") {
    const { solanaEdge } = await import("./solana/index.js");
    return solanaEdge;
  }

  throw new Error(`Unknown EDGE value: "${edge}". Supported values: solana, sui`);
}
