import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const repoRoot = path.resolve(process.cwd(), "..");
const moveDir = path.join(repoRoot, "move");
const backendEnvPath = path.join(process.cwd(), ".env");
const frontendEnvPath = path.join(repoRoot, "frontend", ".env.local");

function run(command: string, cwd?: string): string {
  return execSync(command, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function writeEnvVar(filePath: string, key: string, value: string) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lines = existing.split(/\r?\n/).filter((line) => line.trim().length > 0);
  let updated = false;
  const nextLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      updated = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!updated) {
    nextLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, nextLines.join(os.EOL) + os.EOL, "utf8");
}

function findPackageId(payload: any): string | null {
  if (!payload) return null;
  if (typeof payload === "object") {
    if (typeof payload.packageId === "string") return payload.packageId;
    if (Array.isArray(payload)) {
      for (const entry of payload) {
        const found = findPackageId(entry);
        if (found) return found;
      }
    } else {
      for (const value of Object.values(payload)) {
        const found = findPackageId(value);
        if (found) return found;
      }
    }
  }
  return null;
}

function extractPackageId(output: string): string | null {
  try {
    const json = JSON.parse(output);
    const found = findPackageId(json);
    if (found) return found;
  } catch {
    // ignore JSON parse errors
  }

  const match = output.match(/(0x[a-fA-F0-9]{40,})/);
  return match ? match[1] : null;
}

try {
  console.log("Switching Sui client to devnet...");
  run("sui client switch --env devnet");

  console.log("Publishing Move package...");
  const output = run("sui client publish --gas-budget 100000000 --json", moveDir);
  const packageId = extractPackageId(output);

  if (!packageId) {
    console.error(output);
    throw new Error("Failed to parse packageId from publish output");
  }

  writeEnvVar(backendEnvPath, "SUISENSE_PACKAGE_ID", packageId);
  writeEnvVar(backendEnvPath, "SUI_NETWORK", "devnet");
  writeEnvVar(frontendEnvPath, "NEXT_PUBLIC_SUISENSE_PACKAGE_ID", packageId);

  console.log(`Published packageId: ${packageId}`);
  console.log(`Updated backend env: ${backendEnvPath}`);
  console.log(`Updated frontend env: ${frontendEnvPath}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
