import { createHash } from "crypto";

import { walrus } from "@mysten/walrus";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { Secp256r1Keypair } from "@mysten/sui/keypairs/secp256r1";

type AnchorResult = {
  walrus_blob_id: string;
  content_hash: string;
  receipt_id: string | null;
};

type AnchorInput = {
  txDigest: string;
  explanationPayload: Record<string, unknown>;
  createdAtMs: number;
  network?: string;
};

type Keypair = Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;

function getSigner(): Keypair {
  const encoded = process.env.SUI_PRIVATE_KEY;
  if (!encoded) {
    throw new Error("SUI_PRIVATE_KEY is required to sign receipts");
  }

  const decoded = decodeSuiPrivateKey(encoded);
  switch (decoded.schema) {
    case "ED25519":
      return Ed25519Keypair.fromSecretKey(decoded.secretKey);
    case "Secp256k1":
      return Secp256k1Keypair.fromSecretKey(decoded.secretKey);
    case "Secp256r1":
      return Secp256r1Keypair.fromSecretKey(decoded.secretKey);
    default:
      throw new Error(`Unsupported key scheme: ${decoded.schema}`);
  }
}

function getRpcUrl(network: string): string {
  return process.env.SUI_RPC_URL || getFullnodeUrl(network as "devnet" | "testnet" | "mainnet" | "localnet");
}

function getWalrusClient(network: string) {
  const walrusNetwork = process.env.WALRUS_NETWORK || network || "testnet";
  const walrusRpcUrl =
    process.env.WALRUS_RPC_URL || getFullnodeUrl(walrusNetwork as "testnet" | "mainnet" | "devnet" | "localnet");
  const client = new SuiJsonRpcClient({
    url: walrusRpcUrl,
    network: walrusNetwork as "testnet" | "mainnet" | "devnet"
  });
  return client.$extend(walrus());
}

async function storeExplanation(
  explanationPayload: Record<string, unknown>,
  signer: Keypair,
  network: string
): Promise<{ blobId: string; contentHash: Uint8Array }> {
  const jsonBytes = Buffer.from(JSON.stringify(explanationPayload));
  const contentHash = createHash("sha256").update(jsonBytes).digest();

  const walrusClient = getWalrusClient(network);
  const epochs = Number(process.env.WALRUS_EPOCHS || "1");
  const deletable = (process.env.WALRUS_DELETABLE || "true").toLowerCase() !== "false";

  const result = await walrusClient.walrus.writeBlob({
    blob: jsonBytes,
    deletable,
    epochs,
    signer
  });

  return { blobId: result.blobId, contentHash };
}

async function createReceiptOnChain(
  txDigest: string,
  walrusBlobId: string,
  contentHash: Uint8Array,
  createdAtMs: number,
  signer: Keypair,
  network: string
): Promise<string | null> {
  const packageId = process.env.SUISENSE_PACKAGE_ID;
  if (!packageId) {
    throw new Error("SUISENSE_PACKAGE_ID is not set");
  }

  const suiClient = new SuiClient({ url: getRpcUrl(network) });

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::registry::create_receipt`,
    arguments: [
      tx.pure.string(txDigest),
      tx.pure.string(walrusBlobId),
      tx.pure.vector("u8", Array.from(contentHash)),
      tx.pure.u64(BigInt(createdAtMs))
    ]
  });

  const result = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer,
    options: { showObjectChanges: true }
  });

  const objectChanges = (result as any).objectChanges || [];
  for (const change of objectChanges) {
    if (change.type === "created" && typeof change.objectType === "string") {
      if (change.objectType.includes("::registry::ExplanationReceipt")) {
        return change.objectId || null;
      }
    }
  }

  return null;
}

export async function anchorExplanation(input: AnchorInput): Promise<AnchorResult> {
  const signer = getSigner();
  const network = input.network || process.env.SUI_NETWORK || "devnet";

  const { blobId, contentHash } = await storeExplanation(input.explanationPayload, signer, network);
  const receiptId = await createReceiptOnChain(
    input.txDigest,
    blobId,
    contentHash,
    input.createdAtMs,
    signer,
    network
  );

  return {
    walrus_blob_id: blobId,
    content_hash: Buffer.from(contentHash).toString("hex"),
    receipt_id: receiptId
  };
}
