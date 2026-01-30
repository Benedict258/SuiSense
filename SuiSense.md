SuiSense — Intelligence & Interpretation Layer for the Sui Ecosystem
Role & Instruction to AI

You are acting as a senior blockchain engineer, AI systems architect, and full-stack product builder working on a hackathon project built on the Sui blockchain.

Your job is to help design and implement SuiSense, starting from a minimal working MVP and expanding progressively only after the MVP is validated.

This is a hackathon project — clarity, correctness, and demonstration matter more than completeness.

1. Project Overview
   What is SuiSense?

SuiSense is an AI-powered interpretation layer for the Sui blockchain.

It translates:

raw Sui transactions

Move execution behavior

object ownership changes

into clear, human-readable explanations.

SuiSense does not execute transactions.
It does not hold keys.
It does not modify blockchain state.

It only explains intent, behavior, and consequences.

2. Why This Project Exists
   Problem (Core Insight)

The Sui ecosystem has excellent tools for:

explorers (what already happened)

debugging (low-level traces)

AI code generation (writing Move)

However, there is no unified intelligence layer that explains:

what will happen — before execution — in human language.

This creates two major problems:

For Users

Signing screens are confusing

Users don’t understand what they approve

Fear causes onboarding failure

For Developers

Hard to reason about execution behavior

Ownership model is powerful but complex

Debugging requires expert-level intuition

3. What SuiSense Is NOT

SuiSense is not:

a wallet

a blockchain explorer

a Move compiler

a Copilot-style code generator

a debugger replacement

Those already exist.

4. What SuiSense IS

SuiSense is:

A semantic interpretation engine that explains Sui execution behavior in plain language.

It sits between blockchain execution and humans.

5. Core Principle

Existing tools show what happened.
SuiSense explains what will happen — and why.

6. Core Architecture
   Transaction or Move Context
   ↓
   ↓
   Human-readable understanding

AI never guesses.

AI explains facts extracted from Sui.

7. Core Capabilities (Vision)
   Transaction Interpretation

Detect function being called

Identify assets in / out

Classify risk level

Intent summary

Asset movement explanation

Developer Understanding

Clarify ownership flow

8. Products Built on SuiSense
   A. Transaction Explanation Layer
   onboarding flows

wallets (future)

Explains transactions before signing.

B. MoveLens (Future)
Developer-facing intelligence:

explain Move code

explain errors

visualize ownership flow

Built on the same engine.

9. MVP Philosophy (Critical)

This hackathon does NOT require building the entire system.

The goal is:

Prove that the SuiSense intelligence engine works once.

If it works once → the vision is believable.

10. MVP Definition (Vertical Slice)
    MVP Goal

Demonstrate:
Clear human explanation

That is enough.
Endpoint:

POST /explain/tx
transaction digest OR prepared tx block JSON

Processing:

fetch tx data from Sui RPC

object inputs

coin types

ownership changes

intent summary

assets in / out

explanation

risk note

Simple UI:

input field

“Explain transaction” button

explanation result card
No design complexity required. 12. What NOT to Build Now
Do not implement:

wallet integration

VS Code extension

Walrus

diagrams

These are roadmap items, not MVP requirements.

The demo must show:

Paste a real Sui transaction digest

Click “Explain”

Receive human-readable explanation

Transaction explanation

Phase 2 — Developer Support

IDE integration

Phase 4 — SDK

dApp embedding

The MVP is successful if:

explanation is understandable

transaction intent is clear

user feels safer
Not if it’s perfect.

16. Core Message for Judges

“This MVP proves the intelligence layer. Everything else builds on the same engine.”

This document is BOTH:

a system-level AI instruction

This is the prompt you now give to the AI to build first.

🚀 EXECUTION PROMPT — BUILD THIS FIRST

Your task is to implement the MVP vertical slice of SuiSense.

Do NOT build the full product.
Do NOT over-engineer.

Build a minimal system that:

Sui transaction digest
↓
SuiSense backend
↓
Human-readable explanation

Backend requirements

Create endpoint:

POST /explain/tx

Input:

Sui transaction digest

Logic:

Fetch transaction from Sui RPC

Extract:

function name

involved modules

object inputs

coin types

Send structured facts to LLM

Generate explanation in plain English

Output:

"intent": "...",
"assets": "...",
"explanation": "...",
}

Frontend requirements

Input box for tx digest

Button: “Explain Transaction”

Display explanation clearly

Important rules

The AI must NOT guess

The explanation must be based on extracted Sui data

Keep the system readable and demo-friendly

Goal

When a real transaction digest is pasted:

→ the system explains what the transaction does in human language.

That alone is success.

Stop once this works.

🧊 FINAL WORD (VERY IMPORTANT)

You are doing this exactly right.

This approach wins hackathons.

If there’s time after MVP:

we extend

we polish

we add MoveLens logic

But first — make someone say:

“Ohhh… that’s actually useful.”

You’re on the right path.
Now execute 🚀🧊

UPDATED EXECUTION PROMPT (Tx + MoveLens Lite)

Copy-paste this into your AI builder tool:

You are now acting as a senior full-stack blockchain engineer.
Your task is to implement the MVP vertical slice of SuiSense + MoveLens Lite.

Do NOT build the full product. Do NOT over-engineer. 2. Explain a Move build/runtime error in human language.

---

## A) SUISENSE MVP — TRANSACTION EXPLANATION

Build a minimal system:

Sui tx digest
↓
SuiSense backend
↓
Human-readable explanation (intent, assets, risk)

Backend requirements (FastAPI, Python):

- Endpoint:
  POST /explain/tx

Input:

- tx_digest: string

Logic:

- Fetch transaction details from Sui RPC (network configurable; default devnet/testnet/mainnet).
- Extract structured facts:
  - called function(s) (package/module/function)
  - involved modules/packages
  - object inputs and their types
  - coin types and amounts in/out if derivable
  - ownership changes (transfers) if present
  - shared object interactions (shared objects touched)
- Build a structured JSON summary from facts.
- Send ONLY structured facts to the LLM to generate explanation.
- The model must not invent missing amounts; if unknown, say “unknown”.

Output JSON:
{
"intent": "...",
"assets": {
"in": [...],
"out": [...],
"transfers": [...]
},
"shared_objects": [...],
"explanation": "...",
"risk": "low|medium|high",
"confidence": "high|medium|low"
}

Frontend requirements (Next.js):

- Simple page: input box for tx digest, button “Explain Transaction”
- Display response clearly.

---

## B) MOVELENS LITE — MOVE ERROR EXPLAINER

Goal:
Turn cryptic Move errors into plain English + likely cause + suggested fix.

Backend endpoint:
POST /explain/error

Input:
{
"tool": "sui move build|sui client call|other",
"raw_error": "string"
}

Logic:

- Parse the raw error text to identify:
  - Move abort codes (if present)
  - common failure patterns (object not found, insufficient gas, type mismatch, ability constraint, borrow errors, etc.)
- Create a structured error summary JSON:
  - category
  - probable root cause
  - recommended fix steps (2-4)
  - if info missing, ask for the missing details in the response (e.g. “include full output”)
- Use LLM ONLY to rewrite/explain the structured summary in human terms.
- Do not hallucinate; if unknown, state uncertainty.

Output JSON:
{
"category": "...",
"summary": "...",
"likely_cause": "...",
"fix_steps": ["...", "..."],
"confidence": "high|medium|low"
}

Frontend:

- Add a second tab or section called “MoveLens Lite”
- Textarea to paste error
- Button “Explain Error”
- Show result in clean bullets

---

## C) OPTIONAL ONLY IF TIME — VS CODE EXTENSION SHELL

If time remains:

- Create a minimal VS Code extension that adds two commands:
  - “MoveLens: Explain Error” (prompts user to paste error, calls /explain/error, shows result)
  - “MoveLens: Explain Selection” (reads selected text, calls /analyze/move if implemented)
    But this is OPTIONAL. Focus on A + B first.

---

## RULES

- Do not build wallet integration.
- Do not build Walrus/DeepBook.
- Do not build complex diagrams.
- Keep code readable and demo-friendly.
- The AI must not guess: explanations must be grounded in extracted facts.
- Stop once A and B work end-to-end.

Deliverables:

- FastAPI backend with /explain/tx and /explain/error
- Next.js frontend with 2 sections: Transaction Explainer + MoveLens Lite
- README with how to run and demo.

✅ EXTRA: If you REALLY want “MoveLens” to be called MoveLens (even in MVP)

In UI and docs:

Label the error explainer tab: MoveLens

Subtitle: “Lite (Hackathon MVP)”

So the brand is consistent.
