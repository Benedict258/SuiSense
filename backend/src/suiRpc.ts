const DEFAULT_NETWORKS = {
  mainnet: "https://fullnode.mainnet.sui.io:443",
  testnet: "https://fullnode.testnet.sui.io:443",
  devnet: "https://fullnode.devnet.sui.io:443"
};

export class RpcError extends Error {
  code?: number;
  data?: Record<string, unknown>;

  constructor(message: string, code?: number, data?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

export function resolveRpcUrl(network?: string, rpcUrl?: string): string {
  if (rpcUrl) return rpcUrl;
  if (process.env.SUI_RPC_URL) return process.env.SUI_RPC_URL;
  const net = (network || process.env.SUI_NETWORK || "devnet").toLowerCase();
  return DEFAULT_NETWORKS[net as keyof typeof DEFAULT_NETWORKS] || DEFAULT_NETWORKS.testnet;
}

async function rpcCall(rpcUrl: string, method: string, params: unknown[]): Promise<Record<string, unknown>> {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params
  };

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new RpcError(text || `HTTP ${response.status}`, response.status);
  }

  const data = (await response.json()) as { result?: Record<string, unknown>; error?: any };
  if (data.error) {
    const err = data.error;
    throw new RpcError(err?.message || "RPC error", err?.code, err);
  }
  return data.result || {};
}

export async function fetchTransactionBlock(
  txDigest: string,
  network?: string,
  rpcUrl?: string
): Promise<Record<string, unknown>> {
  const resolved = resolveRpcUrl(network, rpcUrl);
  const options = {
    showInput: true,
    showEffects: true,
    showEvents: true,
    showBalanceChanges: true,
    showObjectChanges: true
  };

  try {
    return await rpcCall(resolved, "suix_getTransactionBlock", [txDigest, options]);
  } catch (error) {
    if (error instanceof RpcError && error.code === -32601) {
      return await rpcCall(resolved, "sui_getTransactionBlock", [txDigest, options]);
    }
    throw error;
  }
}

function formatOwner(owner: any): string {
  if (!owner) return "unknown";
  if (typeof owner === "string") return owner;
  if (owner.AddressOwner) return owner.AddressOwner;
  if (owner.ObjectOwner) return `object:${owner.ObjectOwner}`;
  if (owner.Shared) return "shared";
  if (owner.Immutable) return "immutable";
  return "unknown";
}

function extractMoveCalls(transaction: any): Array<Record<string, any>> {
  const calls: Array<Record<string, any>> = [];
  if (!transaction) return calls;

  if (Array.isArray(transaction.transactions)) {
    for (const entry of transaction.transactions) {
      if (entry && entry.MoveCall) {
        calls.push(entry.MoveCall);
      }
    }
  } else if (transaction.MoveCall) {
    calls.push(transaction.MoveCall);
  }

  return calls;
}

export function extractFacts(tx: Record<string, any>): Record<string, any> {
  const transaction = tx.transaction || {};
  const data = transaction.data || {};
  const sender = data.sender || tx.sender || "unknown";
  const pt = data.transaction || {};

  const moveCalls = extractMoveCalls(pt);
  const calledFunctions: string[] = [];
  const involvedModules: string[] = [];

  for (const call of moveCalls) {
    const pkg = call.package;
    const module = call.module;
    const fn = call.function;
    if (pkg && module && fn) {
      calledFunctions.push(`${pkg}::${module}::${fn}`);
      involvedModules.push(`${pkg}::${module}`);
    }
  }

  const objectChanges = tx.objectChanges || [];
  const objectTypeById: Record<string, string> = {};
  for (const change of objectChanges) {
    const objectId = change.objectId;
    const objectType = change.objectType;
    if (objectId && objectType) {
      objectTypeById[objectId] = objectType;
    }
  }

  const objectInputs: Array<Record<string, string>> = [];
  const sharedObjects: string[] = [];

  for (const input of pt.inputs || []) {
    const obj = input?.Object;
    if (!obj) continue;

    let objectId: string | undefined;
    let kind: string | undefined;

    if (obj.ImmOrOwnedObject) {
      objectId = obj.ImmOrOwnedObject.objectId;
      kind = "imm_or_owned";
    } else if (obj.SharedObject) {
      objectId = obj.SharedObject.objectId;
      kind = "shared";
      if (objectId) sharedObjects.push(objectId);
    }

    if (objectId) {
      objectInputs.push({
        object_id: objectId,
        object_type: objectTypeById[objectId] || "unknown",
        kind: kind || "unknown"
      });
    }
  }

  for (const change of objectChanges) {
    if (change.owner && change.owner.Shared) {
      const objectId = change.objectId;
      if (objectId && !sharedObjects.includes(objectId)) {
        sharedObjects.push(objectId);
      }
    }
  }

  const balanceChanges = tx.balanceChanges || [];
  const assetsIn: Array<Record<string, string>> = [];
  const assetsOut: Array<Record<string, string>> = [];

  for (const change of balanceChanges) {
    const amountRaw = change.amount;
    const coinType = change.coinType;
    const owner = formatOwner(change.owner);
    let amountInt: number | null = null;

    if (amountRaw !== undefined && amountRaw !== null) {
      const parsed = Number(amountRaw);
      amountInt = Number.isNaN(parsed) ? null : parsed;
    }

    const entry = {
      coin_type: coinType || "unknown",
      amount: amountRaw !== undefined && amountRaw !== null ? String(amountRaw) : "unknown",
      owner
    };

    if (amountInt === null || amountInt < 0) {
      assetsOut.push(entry);
    } else {
      assetsIn.push(entry);
    }
  }

  const transfers: Array<Record<string, string>> = [];
  for (const change of objectChanges) {
    if (change.type === "transferred") {
      transfers.push({
        object_id: change.objectId,
        object_type: change.objectType || "unknown",
        from: change.sender || "unknown",
        to: change.recipient || formatOwner(change.owner)
      });
    }
  }

  return {
    sender,
    called_functions: calledFunctions,
    involved_modules: Array.from(new Set(involvedModules)).sort(),
    object_inputs: objectInputs,
    assets: {
      in: assetsIn,
      out: assetsOut,
      transfers
    },
    shared_objects: sharedObjects,
    raw: {
      status: tx.effects?.status?.status,
      tx_digest: tx.digest
    }
  };
}

export function inferIntent(facts: Record<string, any>): string {
  const functions: string[] = facts.called_functions || [];
  if (functions.length === 1) {
    return `Calls ${functions[0]}`;
  }
  if (functions.length > 1) {
    return `Calls Move functions: ${functions.slice(0, 4).join(", ")}`;
  }
  if (facts.assets?.transfers?.length) {
    return "Transfers objects";
  }
  if (facts.assets?.out?.length || facts.assets?.in?.length) {
    return "Moves assets";
  }
  return "Intent unknown (insufficient data)";
}

export function inferRisk(facts: Record<string, any>): { risk: string; confidence: string } {
  const assets = facts.assets || {};
  const hasOut = Array.isArray(assets.out) && assets.out.length > 0;
  const hasTransfers = Array.isArray(assets.transfers) && assets.transfers.length > 0;
  const hasShared = Array.isArray(facts.shared_objects) && facts.shared_objects.length > 0;

  let risk = "low";
  if (hasOut || hasTransfers) risk = "medium";
  if (hasShared && (hasOut || hasTransfers)) risk = "high";

  const confidence = facts.called_functions?.length
    ? (hasOut || hasTransfers || (assets.in && assets.in.length) ? "high" : "medium")
    : "low";

  return { risk, confidence };
}
