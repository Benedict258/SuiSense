# Edges

This directory contains chain-specific adapter specifications and implementations for the SolSense multi-edge intelligence platform.

## What is an Edge?

An **edge** is a chain-specific adapter that provides:

1. **Transaction fetching** – retrieve raw transaction data from the chain's RPC.
2. **Fact extraction** – parse the raw data into a structured JSON summary (functions/instructions called, accounts/objects involved, asset movements, risk signals).
3. **Error parsing** – parse chain-specific error messages into structured categories.

The shared backend (`backend/src/`) handles LLM explanation, API routing, and response formatting. Edges only implement the chain-specific parts.

## Available Edges

| Edge | Directory | Status | Env var |
|------|-----------|--------|---------|
| Solana | `edges/solana/` | 🟡 Planned | `EDGE=solana` |
| Sui | `edges/sui/` | ✅ Implemented | `EDGE=sui` |

## Selecting an Edge

Set the `EDGE` environment variable in `backend/.env`:

```env
# Use the Solana edge (default)
EDGE=solana

# Use the Sui edge
EDGE=sui
```

## Adding a New Edge

1. Create `edges/<chain>/README.md` describing the adapter.
2. Implement `backend/src/edges/<chain>/index.ts` with the following exports:

```typescript
export interface EdgeAdapter {
  /** Fetch a transaction by its ID/signature and return raw chain data */
  fetchTransaction(id: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;

  /** Extract structured facts from raw chain data */
  extractFacts(rawTx: Record<string, unknown>): Record<string, unknown>;

  /** Infer human intent from extracted facts */
  inferIntent(facts: Record<string, unknown>): string;

  /** Infer risk level from extracted facts */
  inferRisk(facts: Record<string, unknown>): { risk: string; confidence: string };
}
```

3. Register the new edge in `backend/src/edges/index.ts`.
