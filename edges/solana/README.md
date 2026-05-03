# Solana Edge (SolSense)

This is the Solana chain adapter for the SolSense platform.

## Status

🟡 **Planned** — The adapter interface is defined; implementation is a work in progress.

## Planned Capabilities

### Transaction Explanation (`POST /explain/tx`)

Input: Solana transaction signature (base58 string)

Extraction targets:
- Program IDs invoked
- Instruction data (parsed where possible via known program IDLs)
- Account keys and roles (signer, writable, read-only)
- SOL balance changes (pre/post balances)
- SPL token balance changes
- Inner instruction calls

### Error Explanation (`POST /explain/error`)

Input: raw Solana program error log or runtime output

Extraction targets:
- Program error codes
- `AnchorError` / `ProgramError` patterns
- Log messages and call stack

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EDGE` | Set to `solana` to activate this edge |
| `SOLANA_RPC_URL` | Solana RPC endpoint (default: mainnet-beta public RPC) |
| `SOLANA_NETWORK` | `mainnet-beta`, `devnet`, or `testnet` (default: `mainnet-beta`) |

## Adapter Interface

The adapter will implement the `EdgeAdapter` interface (see `edges/README.md`):

```typescript
// backend/src/edges/solana/index.ts (planned)
import type { EdgeAdapter } from "../index.js";

export const solanaEdge: EdgeAdapter = {
  async fetchTransaction(signature, _options) {
    // call getTransaction via Solana JSON-RPC
    throw new Error("Solana edge: not yet implemented");
  },

  extractFacts(rawTx) {
    // parse instructions, accounts, balance changes
    throw new Error("Solana edge: not yet implemented");
  },

  inferIntent(facts) {
    return "Solana transaction (intent extraction not yet implemented)";
  },

  inferRisk(_facts) {
    return { risk: "unknown", confidence: "low" };
  }
};
```

## Contributing

To implement this adapter:

1. Use `@solana/web3.js` or `@solana/rpc` to call `getTransaction`.
2. Parse the `message.instructions` array and match against known program IDs.
3. Use token metadata for SPL token amounts where available.
4. Export the adapter from `backend/src/edges/solana/index.ts`.
