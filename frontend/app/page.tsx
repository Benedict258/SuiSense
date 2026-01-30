"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PACKAGE_ID = process.env.NEXT_PUBLIC_SUISENSE_PACKAGE_ID || "";

type TxResponse = {
  tx_digest: string;
  intent: string;
  assets: {
    in: Array<{ coin_type: string; amount: string; owner: string }>;
    out: Array<{ coin_type: string; amount: string; owner: string }>;
    transfers: Array<{ object_id: string; object_type: string; from: string; to: string }>;
  };
  shared_objects: string[];
  explanation: string;
  risk: string;
  confidence: string;
  walrus_blob_id: string;
  content_hash: string;
  receipt_id: string | null;
  created_at?: string;
  explanation_payload?: Record<string, unknown>;
  called_functions?: string[];
  object_inputs?: Array<{ object_id: string; object_type: string; kind: string }>;
};

type ErrorResponse = {
  category: string;
  summary: string;
  likely_cause: string;
  fix_steps: string[];
  confidence: string;
  move_stack?: string[];
  abort_code?: string;
  modules?: string[];
};

export default function Home() {
  const [txDigest, setTxDigest] = useState("");
  const [network, setNetwork] = useState("devnet");
  const [txResult, setTxResult] = useState<TxResponse | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const [tool, setTool] = useState("sui move build");
  const [rawError, setRawError] = useState("");
  const [errResult, setErrResult] = useState<ErrorResponse | null>(null);
  const [errLoading, setErrLoading] = useState(false);
  const [errError, setErrError] = useState<string | null>(null);

  const explainTx = async () => {
    setTxLoading(true);
    setTxError(null);
    setTxResult(null);
    try {
      const response = await fetch(`${API_URL}/explain/tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_digest: txDigest.trim(), network })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fetch transaction");
      }

      const data = (await response.json()) as TxResponse;
      setTxResult(data);
    } catch (error) {
      setTxError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setTxLoading(false);
    }
  };

  const explainError = async () => {
    setErrLoading(true);
    setErrError(null);
    setErrResult(null);
    try {
      const response = await fetch(`${API_URL}/explain/error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, raw_error: rawError })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to explain error");
      }

      const data = (await response.json()) as ErrorResponse;
      setErrResult(data);
    } catch (error) {
      setErrError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setErrLoading(false);
    }
  };

  return (
    <main>
      <h1>SuiSense</h1>
      <p>Intelligence + interpretation for Sui transactions and Move errors.</p>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2>Transaction Explainer</h2>
          <span className="badge">MVP</span>
        </div>
        {PACKAGE_ID && <p className="small mono">Package: {PACKAGE_ID}</p>}
        <label className="label">Sui transaction digest</label>
        <input
          placeholder="Paste a Sui transaction digest"
          value={txDigest}
          onChange={(event) => setTxDigest(event.target.value)}
        />
        <div className="row" style={{ marginTop: 12 }}>
          <div style={{ minWidth: 180, flex: "0 0 180px" }}>
            <label className="label">Network</label>
            <select value={network} onChange={(event) => setNetwork(event.target.value)}>
              <option value="mainnet">mainnet</option>
              <option value="testnet">testnet</option>
              <option value="devnet">devnet</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={explainTx} disabled={txLoading || !txDigest.trim()}>
              {txLoading ? "Explaining..." : "Explain Transaction"}
            </button>
          </div>
        </div>

        {txError && <p className="small">Error: {txError}</p>}

        {txResult && (
          <div style={{ marginTop: 20 }}>
            <p className="small mono">Digest: {txResult.tx_digest}</p>
            <p className="small mono">Intent: {txResult.intent}</p>
            <p className="small">Risk: {txResult.risk} | Confidence: {txResult.confidence}</p>
            <p>{txResult.explanation}</p>
            {txResult.created_at && <p className="small">Created at: {txResult.created_at}</p>}

            {txResult.called_functions && txResult.called_functions.length > 0 && (
              <div>
                <span className="label">Called functions</span>
                <ul className="list mono">
                  {txResult.called_functions.map((fn) => (
                    <li key={fn}>{fn}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="row" style={{ marginTop: 16 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <span className="label">Assets in</span>
                {txResult.assets?.in?.length ? (
                  <ul className="list mono">
                    {txResult.assets.in.map((entry, index) => (
                      <li key={`in-${index}`}>{entry.amount} {entry.coin_type} ({entry.owner})</li>
                    ))}
                  </ul>
                ) : (
                  <p className="small">None detected</p>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <span className="label">Assets out</span>
                {txResult.assets?.out?.length ? (
                  <ul className="list mono">
                    {txResult.assets.out.map((entry, index) => (
                      <li key={`out-${index}`}>{entry.amount} {entry.coin_type} ({entry.owner})</li>
                    ))}
                  </ul>
                ) : (
                  <p className="small">None detected</p>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="label">Transfers</span>
              {txResult.assets?.transfers?.length ? (
                <ul className="list mono">
                  {txResult.assets.transfers.map((entry, index) => (
                    <li key={`tx-${index}`}>
                      {entry.object_id} -> {entry.to} ({entry.object_type})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small">None detected</p>
              )}
            </div>

            {txResult.shared_objects?.length ? (
              <div style={{ marginTop: 16 }}>
                <span className="label">Shared objects touched</span>
                <ul className="list mono">
                  {txResult.shared_objects.map((obj) => (
                    <li key={obj}>{obj}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div style={{ marginTop: 16 }}>
              <span className="label">Proof references</span>
              <ul className="list mono">
                <li>Receipt ID: {txResult.receipt_id || "unknown"}</li>
                <li>Walrus blob ID: {txResult.walrus_blob_id}</li>
                <li>Content hash (sha256): {txResult.content_hash}</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2>MoveLens Lite</h2>
          <span className="badge">Hackathon MVP</span>
        </div>
        <label className="label">Tool / context</label>
        <select value={tool} onChange={(event) => setTool(event.target.value)}>
          <option value="sui move build">sui move build</option>
          <option value="sui client call">sui client call</option>
          <option value="other">other</option>
        </select>
        <label className="label" style={{ marginTop: 12 }}>Raw Move error</label>
        <textarea
          placeholder="Paste the full error output, including any Move stack trace"
          value={rawError}
          onChange={(event) => setRawError(event.target.value)}
        />
        <div style={{ marginTop: 12 }}>
          <button onClick={explainError} disabled={errLoading || !rawError.trim()}>
            {errLoading ? "Explaining..." : "Explain Error"}
          </button>
        </div>

        {errError && <p className="small">Error: {errError}</p>}

        {errResult && (
          <div style={{ marginTop: 20 }}>
            <p className="small mono">Category: {errResult.category}</p>
            <p className="small">Confidence: {errResult.confidence}</p>
            <p>{errResult.summary}</p>
            <p className="small">Likely cause: {errResult.likely_cause}</p>

            <span className="label">Suggested fixes</span>
            <ul className="list">
              {errResult.fix_steps.map((step, index) => (
                <li key={`fix-${index}`}>{step}</li>
              ))}
            </ul>

            {errResult.move_stack && errResult.move_stack.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <span className="label">Move stack</span>
                <ul className="list mono">
                  {errResult.move_stack.map((frame) => (
                    <li key={frame}>{frame}</li>
                  ))}
                </ul>
              </div>
            )}

            {errResult.abort_code && errResult.abort_code !== "unknown" && (
              <p className="small">Abort code: {errResult.abort_code}</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
