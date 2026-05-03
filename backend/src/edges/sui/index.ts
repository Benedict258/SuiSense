/**
 * Sui edge adapter — wraps the existing suiRpc.ts implementation.
 */
import type { EdgeAdapter } from "../index.js";
import {
  fetchTransactionBlock,
  extractFacts,
  inferIntent,
  inferRisk
} from "../../suiRpc.js";

export const suiEdge: EdgeAdapter = {
  async fetchTransaction(id, options) {
    const network = options?.network as string | undefined;
    const rpcUrl = options?.rpcUrl as string | undefined;
    return fetchTransactionBlock(id, network, rpcUrl);
  },

  extractFacts(rawTx) {
    return extractFacts(rawTx);
  },

  inferIntent(facts) {
    return inferIntent(facts);
  },

  inferRisk(facts) {
    return inferRisk(facts);
  }
};
