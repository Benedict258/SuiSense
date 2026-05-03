# Sui Edge (SuiSense)

This is the Sui chain adapter for the SolSense platform. It is the original SuiSense implementation.

## Status

✅ **Implemented** — Full MVP covering transaction explanation and Move error explanation.

## Capabilities

### Transaction Explanation (`POST /explain/tx`)

Input: Sui transaction digest (base58 string)

Extracts:
- Called Move functions (`package::module::function`)
- Involved modules
- Object inputs (owned + shared)
- Balance changes (coin in/out)
- Object transfers
- Shared objects touched

### Error Explanation (`POST /explain/error`)

Input: raw Move/Sui CLI error output

Detects:
- Move abort codes
- Gas errors
- Object not found
- Type mismatch
- Ability constraints
- Borrow errors
- Index out of bounds
- Permission errors

## On-Chain Anchoring (optional)

The Sui edge supports anchoring explanations on-chain via:
- **Walrus** — decentralised storage for the JSON explanation payload
- **Move receipt** — an `ExplanationReceipt` object created on Sui pointing to the Walrus blob

See `move/` for the Move package and `backend/src/anchor.ts` for the implementation.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EDGE` | Set to `sui` to activate this edge |
| `SUI_NETWORK` | `mainnet`, `testnet`, or `devnet` (default: `devnet`) |
| `SUI_RPC_URL` | Override Sui RPC endpoint |
| `SUI_PRIVATE_KEY` | Bech32 private key for signing receipts |
| `SUISENSE_PACKAGE_ID` | Deployed Move package ID |
| `WALRUS_NETWORK` | Walrus network (default: `testnet`) |
| `WALRUS_EPOCHS` | Walrus storage epochs (default: `1`) |

## Implementation Files

| File | Description |
|------|-------------|
| `backend/src/suiRpc.ts` | Sui RPC client, fact extraction, intent/risk inference |
| `backend/src/anchor.ts` | Walrus storage + Sui on-chain receipt creation |
| `backend/src/edges/sui/index.ts` | Edge adapter (wraps suiRpc.ts) |
| `move/sources/core.move` | Move receipt module (`suisense_core::registry`) |
| `move/Move.toml` | Move package manifest |
