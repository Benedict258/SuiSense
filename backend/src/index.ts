import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";

import {
  extractFacts,
  fetchTransactionBlock,
  inferIntent,
  inferRisk,
  resolveRpcUrl
} from "./suiRpc.js";
import {
  explainErrorFallback,
  explainErrorWithLLM,
  explainTxFallback,
  explainTxWithLLM
} from "./explainers.js";
import { parseMoveError } from "./movelens.js";
import { anchorExplanation } from "./anchor.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const explainTxSchema = z.object({
  tx_digest: z.string().min(20),
  network: z.string().optional(),
  rpc_url: z.string().optional()
});

const explainErrorSchema = z.object({
  tool: z.string(),
  raw_error: z.string().min(1)
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/explain/tx", async (req, res) => {
  const parsed = explainTxSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { tx_digest, network, rpc_url } = parsed.data;

  try {
    const tx = await fetchTransactionBlock(tx_digest, network, rpc_url);
    const facts = extractFacts(tx);
    const intent = inferIntent(facts);
    const { risk, confidence } = inferRisk(facts);

    facts.intent = intent;
    facts.risk = risk;
    facts.confidence = confidence;
    facts.rpc_url = resolveRpcUrl(network, rpc_url);

    const explanation = (await explainTxWithLLM(facts)) || explainTxFallback(facts);

    const createdAtMs = Date.now();
    const createdAtIso = new Date(createdAtMs).toISOString();
    const explanationPayload = {
      tx_digest,
      intent,
      assets: facts.assets || { in: [], out: [], transfers: [] },
      shared_objects: facts.shared_objects || [],
      explanation,
      risk,
      confidence,
      facts,
      created_at: createdAtIso
    };

    const anchor = await anchorExplanation({
      txDigest: tx_digest,
      explanationPayload,
      createdAtMs,
      network: network || process.env.SUI_NETWORK
    });

    return res.json({
      tx_digest,
      intent,
      assets: facts.assets || { in: [], out: [], transfers: [] },
      shared_objects: facts.shared_objects || [],
      explanation,
      risk,
      confidence,
      called_functions: facts.called_functions || [],
      object_inputs: facts.object_inputs || [],
      walrus_blob_id: anchor.walrus_blob_id,
      content_hash: anchor.content_hash,
      receipt_id: anchor.receipt_id,
      created_at: createdAtIso,
      explanation_payload: explanationPayload
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RPC error";
    return res.status(502).json({ error: message });
  }
});

app.post("/explain/error", async (req, res) => {
  const parsed = explainErrorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const summary = parseMoveError(parsed.data.raw_error);
  summary.tool = parsed.data.tool;

  const explanation = (await explainErrorWithLLM(summary)) || explainErrorFallback(summary);

  return res.json({
    category: summary.category,
    summary: explanation,
    likely_cause: summary.likely_cause,
    fix_steps: summary.fix_steps,
    confidence: summary.confidence,
    move_stack: summary.move_stack,
    abort_code: summary.abort_code,
    modules: summary.modules
  });
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`SuiSense API listening on ${port}`);
});
