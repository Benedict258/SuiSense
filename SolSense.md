# SolSense — Solana Edge

SolSense is the Solana chain adapter for the SolSense intelligence platform.

## What It Will Do

SolSense (Solana edge) will provide the same AI-powered interpretation capabilities as SuiSense, but for the Solana ecosystem:

- **Transaction Explanation**: Given a Solana transaction signature, explain what it does in plain English (instructions called, accounts affected, SOL/SPL token movements, risk level).
- **Program Error Explainer**: Given a raw Solana program error or runtime log, explain the likely cause and suggest fixes.

## Planned Architecture

```
Solana Transaction Signature
↓
SolSense Backend (EDGE=solana)
  └── edges/solana adapter
        ├── Fetch tx via Solana RPC (getTransaction)
        ├── Extract facts (instructions, accounts, token transfers)
        ├── Build structured JSON summary
        └── LLM explanation (same shared explainer)
↓
Human-readable explanation
```

## Differences from Sui Edge

| | Sui Edge | Solana Edge |
|---|---|---|
| RPC method | `suix_getTransactionBlock` | `getTransaction` |
| Program model | Move (package::module::function) | Native programs / Anchor IDL |
| Error format | Move abort codes + stack | Program logs + error codes |
| On-chain anchoring | Walrus + Move receipt | TBD (optional) |
| Env var to activate | `EDGE=sui` | `EDGE=solana` |

## Status

🟡 **Planned** — adapter is a placeholder. Contributions welcome.

See `edges/solana/README.md` for the adapter interface spec.
