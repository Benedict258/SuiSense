# SolSense — Multi-Chain Intelligence & Interpretation Layer

> **SuiSense** is now **SolSense**: a multi-edge agentic intelligence platform that explains blockchain transactions and Move/program errors in plain language. The platform supports multiple chain "edges" — starting with **Solana** (default) and **Sui**.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture: Multi-Edge Design](#architecture-multi-edge-design)
3. [Getting Started](#getting-started)
   - [Running SolSense (Solana edge)](#running-solsense-solana-edge)
   - [Running SuiSense (Sui edge)](#running-suisense-sui-edge)
4. [Configuration](#configuration)
5. [Project Structure](#project-structure)
6. [Repository Rename Guide](#repository-rename-guide)

---

## Overview

SolSense is an AI-powered interpretation layer for blockchain ecosystems. It translates raw transactions, program execution behaviour, and errors into clear, human-readable explanations.

- **Does not** execute transactions or hold private keys.
- **Only** explains intent, behaviour, and consequences.

Current edges:
| Edge | Status | Description |
|------|--------|-------------|
| `solana` | 🟡 Planned | Solana transaction + program error explainer |
| `sui` | ✅ MVP | Sui transaction + Move error explainer (original SuiSense) |

---

## Architecture: Multi-Edge Design

```
SolSense (core platform)
├── edges/
│   ├── solana/   ← SolSense (Solana adapter — planned)
│   └── sui/      ← SuiSense (Sui adapter — implemented)
├── backend/      ← Shared Express/TypeScript API
├── frontend/     ← Shared Next.js UI
└── move/         ← Sui on-chain receipt anchor (Sui edge only)
```

The active edge is controlled by the `EDGE` environment variable (default: `solana`).

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or pnpm
- (Sui edge only) Sui CLI + a funded wallet

### Running SolSense (Solana edge)

```bash
# backend
cd backend
cp .env.example .env        # set EDGE=solana (already default)
npm install
npm run dev

# frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running SuiSense (Sui edge)

```bash
# backend
cd backend
cp .env.example .env
# Edit .env and set:
#   EDGE=sui
#   SUI_PRIVATE_KEY=<your bech32 key>
#   SUISENSE_PACKAGE_ID=<deployed package id>
#   OPENAI_API_KEY=<optional>
npm install
npm run dev

# frontend (separate terminal)
cd frontend
cp .env.example .env.local
# Edit .env.local and set:
#   NEXT_PUBLIC_SUISENSE_PACKAGE_ID=<deployed package id>
npm install
npm run dev
```

To deploy the Sui Move package:

```bash
cd backend
npm run deploy:move:devnet
```

---

## Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `EDGE` | `solana` | Active chain edge: `solana` or `sui` |
| `PORT` | `8000` | API server port |
| `OPENAI_API_KEY` | — | OpenAI key for LLM explanations (optional) |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model |
| `SUI_NETWORK` | `devnet` | Sui network (sui edge) |
| `SUI_RPC_URL` | — | Override Sui RPC URL (sui edge) |
| `SUI_PRIVATE_KEY` | — | Bech32 Sui private key for anchoring (sui edge) |
| `SUISENSE_PACKAGE_ID` | — | Deployed Sui Move package ID (sui edge) |
| `WALRUS_NETWORK` | `testnet` | Walrus network (sui edge) |
| `WALRUS_EPOCHS` | `1` | Walrus storage epochs (sui edge) |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |
| `NEXT_PUBLIC_SUISENSE_PACKAGE_ID` | — | Sui package ID shown in UI (sui edge) |

---

## Project Structure

```
SolSense/
├── README.md
├── SolSense.md          ← Solana edge design doc
├── SuiSense.md          ← Sui edge design doc (original)
├── edges/
│   ├── README.md        ← Edge adapter overview
│   ├── solana/
│   │   └── README.md    ← Solana adapter spec
│   └── sui/
│       └── README.md    ← Sui adapter overview
├── backend/
│   ├── src/
│   │   ├── edges/
│   │   │   ├── index.ts      ← Edge selector (reads EDGE env var)
│   │   │   ├── solana/       ← Solana edge adapter (placeholder)
│   │   │   └── sui/          ← Sui edge adapter
│   │   ├── index.ts
│   │   ├── suiRpc.ts
│   │   ├── explainers.ts
│   │   ├── movelens.ts
│   │   └── anchor.ts
│   └── package.json
├── frontend/
│   ├── app/
│   └── package.json
└── move/                ← Sui on-chain receipt (Sui edge only)
```

---

## Repository Rename Guide

> ⚠️ **Manual step required** — GitHub repository renames cannot be performed via a pull request.

To rename this repository from **Benedict258/SuiSense** to **Benedict258/SolSense**:

1. Go to **https://github.com/Benedict258/SuiSense/settings**
2. Under **Repository name**, type `SolSense`
3. Click **Rename**

After renaming:
- Old URL `https://github.com/Benedict258/SuiSense` will redirect to `https://github.com/Benedict258/SolSense` automatically (GitHub handles this).
- Update your local remote: `git remote set-url origin https://github.com/Benedict258/SolSense`
- Update any CI secrets or deployment configs that reference the old repo name.
- Update any external links in docs/websites pointing to the old URL.

