/**
 * Solana edge adapter — placeholder implementation.
 *
 * This adapter is not yet implemented. See edges/solana/README.md for the spec.
 */
import type { EdgeAdapter } from "../index.js";

export const solanaEdge: EdgeAdapter = {
  async fetchTransaction(_id, _options) {
    throw new Error(
      "Solana edge is not yet implemented. " +
      "Set EDGE=sui to use the Sui edge, or contribute the Solana adapter. " +
      "See edges/solana/README.md for the spec."
    );
  },

  extractFacts(_rawTx) {
    throw new Error("Solana edge: extractFacts not yet implemented");
  },

  inferIntent(_facts) {
    return "Solana transaction (intent extraction not yet implemented)";
  },

  inferRisk(_facts) {
    return { risk: "unknown", confidence: "low" };
  }
};
