import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { OG_KNOWLEDGE } from "@/knowledge/og-docs";

// ─── RPC helpers (live on-chain reads) ────────────────────────────────────────

const RPC = {
  testnet: "https://evmrpc-testnet.0g.ai",
  mainnet: "https://evmrpc.0g.ai",
};

const EXPLORER = {
  testnet: "https://chainscan-galileo.0g.ai",
  mainnet: "https://chainscan.0g.ai",
};

async function rpcCall(network: "testnet" | "mainnet", method: string, params: unknown[]) {
  const res = await fetch(RPC[network], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

function hexToDecimal(hex: string): bigint {
  return BigInt(hex);
}

function formatBalance(wei: bigint): string {
  const whole = wei / BigInt(1e18);
  const frac = (wei % BigInt(1e18)).toString().padStart(18, "0").slice(0, 6);
  return `${whole}.${frac}`;
}

// ─── Docs builder ─────────────────────────────────────────────────────────────

function buildDocs(topic: string): string {
  let docs = "";
  if (topic === "chain" || topic === "all") {
    docs += `\n${"=".repeat(60)}\n0G CHAIN — Smart Contract Deployment\n${"=".repeat(60)}\n${OG_KNOWLEDGE.chain.overview}\n\nHardhat Config:\n${OG_KNOWLEDGE.chain.hardhatConfig}\n\nSample Contract:\n${OG_KNOWLEDGE.chain.sampleContract}\n\nDeploy Script:\n${OG_KNOWLEDGE.chain.deployScript}\n\nFoundry Deploy:\n${OG_KNOWLEDGE.chain.foundryDeploy}\n\nVerify:\n${OG_KNOWLEDGE.chain.verify}\n\nPrecompiles: ${JSON.stringify(OG_KNOWLEDGE.chain.precompiles)}\nDeployment Scripts: ${OG_KNOWLEDGE.chain.deploymentScripts}\n`;
  }
  if (topic === "storage" || topic === "all") {
    docs += `\n${"=".repeat(60)}\n0G STORAGE SDK\n${"=".repeat(60)}\n${OG_KNOWLEDGE.storage.overview}\nInstall: ${OG_KNOWLEDGE.sdks.storage_ts.install}\nStarter Kit: ${OG_KNOWLEDGE.sdks.storage_ts.starterKit}\n\nSetup:\n${OG_KNOWLEDGE.storage.setup}\n\nUpload:\n${OG_KNOWLEDGE.storage.upload}\n\nDownload:\n${OG_KNOWLEDGE.storage.download}\n\nKV Storage:\n${OG_KNOWLEDGE.storage.kvStorage}\n\nBrowser:\n${OG_KNOWLEDGE.storage.browser}\n\nStreams:\n${OG_KNOWLEDGE.storage.stream}\n`;
  }
  if (topic === "compute" || topic === "all") {
    docs += `\n${"=".repeat(60)}\n0G COMPUTE — AI Inference\n${"=".repeat(60)}\n${OG_KNOWLEDGE.compute.overview}\nInstall: ${OG_KNOWLEDGE.sdks.compute_broker.install}\nMarketplace: ${OG_KNOWLEDGE.networks.testnet.computeMarketplace}\n\nModels (Mainnet): ${JSON.stringify(OG_KNOWLEDGE.compute.services.mainnet, null, 2)}\n\nSDK Setup:\n${OG_KNOWLEDGE.compute.sdkSetup}\n\nChat Completion:\n${OG_KNOWLEDGE.compute.chatCompletion}\n\nText-to-Image:\n${OG_KNOWLEDGE.compute.textToImage}\n\nSpeech-to-Text:\n${OG_KNOWLEDGE.compute.speechToText}\n\nCLI:\n${OG_KNOWLEDGE.compute.cliCommands}\n\ncURL:\n${OG_KNOWLEDGE.compute.directApiCurl}\n`;
  }
  if (topic === "da" || topic === "all") {
    docs += `\n${"=".repeat(60)}\n0G DATA AVAILABILITY (DA)\n${"=".repeat(60)}\n${OG_KNOWLEDGE.da.overview}\nComponents: ${OG_KNOWLEDGE.da.components}\nClient: ${OG_KNOWLEDGE.da.clientRepo}\nEncoder: ${OG_KNOWLEDGE.da.encoderRepo}\nRetriever: ${OG_KNOWLEDGE.da.retrieverRepo}\nExample: ${OG_KNOWLEDGE.da.exampleRepo}\n\nDocker:\n${OG_KNOWLEDGE.da.dockerSetup}\n\nEnv:\n${OG_KNOWLEDGE.da.envConfig}\n\nRollups: ${OG_KNOWLEDGE.da.rollups.join(", ")}\n`;
  }
  if (topic === "infts" || topic === "all") {
    docs += `\n${"=".repeat(60)}\nINFTs — ERC-7857\n${"=".repeat(60)}\n${OG_KNOWLEDGE.infts.overview}\nFeatures: ${OG_KNOWLEDGE.infts.features.join(", ")}\nTransfer: ${OG_KNOWLEDGE.infts.transferFlow}\nUse Cases: ${OG_KNOWLEDGE.infts.useCases.join(", ")}\n\nSetup:\n${OG_KNOWLEDGE.infts.setupCode}\n\nDeploy:\n${OG_KNOWLEDGE.infts.contractExample}\n\nRepo: ${OG_KNOWLEDGE.infts.repo}\n`;
  }
  if (topic === "network" || topic === "all") {
    docs += `\n${"=".repeat(60)}\nNETWORK CONFIG\n${"=".repeat(60)}\n${JSON.stringify(OG_KNOWLEDGE.networks, null, 2)}\nSDKs: ${JSON.stringify(OG_KNOWLEDGE.sdks, null, 2)}\nLinks: ${JSON.stringify(OG_KNOWLEDGE.links, null, 2)}\n`;
  }
  docs += `\n${"=".repeat(60)}\nIMPORTANT NOTES\n${"=".repeat(60)}\n${OG_KNOWLEDGE.importantNotes.join("\n")}\n`;
  return docs;
}

// ─── Feature detector ─────────────────────────────────────────────────────────

function detectFeatures(idea: string): string[] {
  const lower = idea.toLowerCase();
  const features: string[] = [];
  if (/storage|upload|file|ipfs|decentralized storage|store|save|blob|media|image|video|document|photo/.test(lower)) features.push("storage");
  if (/ai|compute|inference|chatbot|chat|gpt|llm|model|text.to.image|speech|whisper|generate|predict|assistant/.test(lower)) features.push("compute");
  if (/nft|token|erc|contract|mint|deploy|smart contract|solidity|erc20|erc721|marketplace|coin/.test(lower)) features.push("chain");
  if (/inft|intelligent nft|ai agent nft|erc.7857|agent nft/.test(lower)) features.push("infts");
  if (/da|data availability|rollup|op.stack|arbitrum/.test(lower)) features.push("da");
  if (features.length === 0) features.push("storage", "compute");
  return features;
}

// ─── File content generators ──────────────────────────────────────────────────

function genPackageJson(name: string, features: string[], framework: string): string {
  const deps: Record<string, string> = { ethers: "^6.13.4", dotenv: "^16.4.0" };
  const devDeps: Record<string, string> = { typescript: "^5.7.2", "@types/node": "^22.0.0" };
  if (features.includes("storage")) deps["@0gfoundation/0g-ts-sdk"] = "latest";
  if (features.includes("compute")) { deps["@0glabs/0g-serving-broker"] = "latest"; deps["openai"] = "^4.0.0"; }
  if (features.includes("chain") || features.includes("infts")) {
    devDeps["hardhat"] = "^2.22.0";
    devDeps["@nomicfoundation/hardhat-toolbox"] = "^5.0.0";
    devDeps["@openzeppelin/contracts"] = "^5.0.0";
  }
  if (framework === "nextjs") {
    deps["next"] = "^15.0.0"; deps["react"] = "^19.0.0"; deps["react-dom"] = "^19.0.0";
    devDeps["@types/react"] = "^19.0.0";
  }
  if (framework === "express") deps["express"] = "^4.21.0";
  const scripts: Record<string, string> = framework === "nextjs"
    ? { dev: "next dev", build: "next build", start: "next start" }
    : framework === "express"
    ? { dev: "ts-node src/index.ts", build: "tsc", start: "node dist/index.js" }
    : { deploy: "npx hardhat run scripts/deploy.ts --network 0g-testnet", test: "npx hardhat test" };
  return JSON.stringify({ name, version: "0.1.0", private: true, scripts, dependencies: deps, devDependencies: devDeps }, null, 2);
}

function genEnv(features: string[]): string {
  let env = `# 0G Network — export your private key from MetaMask
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# 0G Testnet (Galileo) — ready to use, no changes needed
RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602
`;
  if (features.includes("storage")) {
    env += `
# 0G Storage Public Indexer
INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
# Mainnet: INDEXER_RPC=https://indexer-storage-turbo.0g.ai
`;
  }
  if (features.includes("compute")) {
    env += `
# 0G Compute — find providers at https://compute-marketplace.0g.ai/inference
COMPUTE_PROVIDER_ADDRESS=0xYOUR_PROVIDER_ADDRESS
`;
  }
  env += `
# Get free testnet tokens: https://faucet.0g.ai
`;
  return env;
}

function genNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`;
}

function genTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2017", lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true, skipLibCheck: true, strict: true,
      noEmit: true, esModuleInterop: true, module: "esnext",
      moduleResolution: "bundler", resolveJsonModule: true,
      isolatedModules: true, jsx: "preserve", incremental: true,
      paths: { "@/*": ["./*"] },
    },
    include: ["**/*.ts", "**/*.tsx"],
    exclude: ["node_modules"],
  }, null, 2);
}

function genHardhatConfig(): string {
  return `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      evmVersion: "cancun", // REQUIRED for 0G Chain
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    "0g-testnet": {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [process.env.PRIVATE_KEY!],
    },
    "0g-mainnet": {
      url: "https://evmrpc.0g.ai",
      chainId: 16661,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: { "0g-testnet": "placeholder" },
    customChains: [{
      network: "0g-testnet", chainId: 16602,
      urls: {
        apiURL: "https://chainscan-galileo.0g.ai/open/api",
        browserURL: "https://chainscan-galileo.0g.ai",
      },
    }],
  },
};

export default config;
`;
}

function genStorageLib(): string {
  return `import { ZgFile, Indexer } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://evmrpc-testnet.0g.ai";
const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC || "https://indexer-storage-testnet-turbo.0g.ai";

export function getIndexer() {
  return new Indexer(INDEXER_RPC);
}

export async function getSigner(privateKey: string) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(privateKey, provider);
}

export async function uploadFile(file: File, privateKey: string) {
  const signer = await getSigner(privateKey);
  const indexer = getIndexer();

  // Convert browser File to ZgFile via ArrayBuffer
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  const zgFile = await ZgFile.fromBuffer(uint8, file.name);

  const [tree, treeErr] = await zgFile.merkleTree();
  if (treeErr) throw new Error(\`Merkle tree error: \${treeErr}\`);

  const rootHash = tree?.rootHash() ?? "";
  const [tx, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer);
  if (uploadErr) throw new Error(\`Upload error: \${uploadErr}\`);

  await zgFile.close();
  return { rootHash, txHash: tx };
}

export async function downloadFile(rootHash: string, outputPath: string) {
  const indexer = getIndexer();
  const err = await indexer.download(rootHash, outputPath, true);
  if (err) throw new Error(\`Download error: \${err}\`);
}
`;
}

function genComputeLib(): string {
  return `import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { BrowserProvider } from "ethers";
import OpenAI from "openai";

export async function getBroker() {
  if (!window.ethereum) throw new Error("MetaMask not found — install at https://metamask.io");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return createZGComputeNetworkBroker(signer);
}

export async function listProviders() {
  const broker = await getBroker();
  return broker.inference.listService();
}

export async function chat(providerAddress: string, userMessage: string) {
  const broker = await getBroker();
  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  const headers = await broker.inference.getRequestHeaders(providerAddress, userMessage);

  const client = new OpenAI({
    baseURL: endpoint + "/v1/proxy",
    apiKey: "placeholder",
    defaultHeaders: headers,
    dangerouslyAllowBrowser: true,
  });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: userMessage }],
  });

  await broker.inference.processResponse(providerAddress, completion, userMessage);
  return completion.choices[0].message.content ?? "";
}
`;
}

function genStoragePage(idea: string): string {
  return `"use client";
import { useState, useRef } from "react";
import { uploadFile, downloadFile } from "@/lib/storage";

// ${idea} — Built with Zaxxie + 0G Storage

export default function Home() {
  const [privateKey, setPrivateKey] = useState("");
  const [rootHash, setRootHash] = useState("");
  const [downloadHash, setDownloadHash] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus("Select a file first.");
    if (!privateKey) return setStatus("Enter your private key.");
    setLoading(true);
    try {
      setStatus("Uploading to 0G decentralized storage...");
      const result = await uploadFile(file, privateKey);
      setRootHash(result.rootHash);
      setStatus("✅ Uploaded! Save your root hash to retrieve this file later.");
    } catch (e: unknown) {
      setStatus("❌ " + (e as Error).message);
    } finally { setLoading(false); }
  }

  async function handleDownload() {
    if (!downloadHash) return setStatus("Enter a root hash.");
    setLoading(true);
    try {
      setStatus("Downloading from 0G storage...");
      await downloadFile(downloadHash, "./download");
      setStatus("✅ Downloaded!");
    } catch (e: unknown) {
      setStatus("❌ " + (e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 560, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>0G Storage App</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>${idea}</p>

      <div style={{ background: "#fff8e1", border: "1px solid #fcd34d", borderRadius: 8, padding: 12, marginBottom: 24, fontSize: 13 }}>
        ⚠️ Demo only — don't paste real private keys in production. Use a wallet connector instead.
      </div>

      <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Private Key</label>
      <input type="password" value={privateKey} onChange={e => setPrivateKey(e.target.value)}
        placeholder="0x..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 20, boxSizing: "border-box" }} />

      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Upload a File</label>
      <input type="file" ref={fileRef} style={{ display: "block", marginBottom: 10 }} />
      <button onClick={handleUpload} disabled={loading}
        style={{ background: "#6C3CE1", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 6, cursor: "pointer", marginBottom: 24 }}>
        {loading ? "Uploading..." : "Upload to 0G"}
      </button>

      {rootHash && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 14, marginBottom: 24 }}>
          <strong>Root Hash — save this!</strong>
          <code style={{ display: "block", wordBreak: "break-all", marginTop: 6, fontSize: 12 }}>{rootHash}</code>
        </div>
      )}

      <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Download by Root Hash</label>
      <input value={downloadHash} onChange={e => setDownloadHash(e.target.value)}
        placeholder="0x..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 10, boxSizing: "border-box" }} />
      <button onClick={handleDownload} disabled={loading}
        style={{ background: "#1e1e2e", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 6, cursor: "pointer" }}>
        {loading ? "Downloading..." : "Download from 0G"}
      </button>

      {status && <p style={{ marginTop: 20, fontSize: 14, color: "#444" }}>{status}</p>}

      <p style={{ marginTop: 48, fontSize: 12, color: "#aaa" }}>
        Powered by <a href="https://0g.ai" style={{ color: "#6C3CE1" }}>0G Zero Gravity</a> ·{" "}
        <a href="https://zaxxie.vercel.app" style={{ color: "#6C3CE1" }}>Built with Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genComputePage(idea: string): string {
  return `"use client";
import { useState } from "react";
import { listProviders, chat } from "@/lib/compute";

// ${idea} — Built with Zaxxie + 0G Compute

type Provider = { provider: string; model: string; inputPrice: string };

export default function Home() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function connect() {
    setLoading(true);
    try {
      setStatus("Connecting wallet and loading 0G AI providers...");
      setProviders(await listProviders());
      setStatus("");
    } catch (e: unknown) { setStatus("❌ " + (e as Error).message); }
    finally { setLoading(false); }
  }

  async function send() {
    if (!selected || !message) return setStatus("Choose a provider and type a message.");
    setLoading(true);
    try {
      setStatus("Sending to decentralized AI...");
      setResponse(await chat(selected, message));
      setStatus("");
    } catch (e: unknown) { setStatus("❌ " + (e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 580, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>0G AI App</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>${idea}</p>

      <button onClick={connect} disabled={loading}
        style={{ background: "#6C3CE1", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 6, cursor: "pointer", marginBottom: 24, fontWeight: 600 }}>
        {loading ? "Connecting..." : "Connect Wallet & Load AI Providers"}
      </button>

      {providers.length > 0 && (
        <>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Choose AI Model</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 16 }}>
            <option value="">-- Select model --</option>
            {providers.map(p => (
              <option key={p.provider} value={p.provider}>{p.model} — {p.inputPrice}</option>
            ))}
          </select>
        </>
      )}

      <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Your Message</label>
      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
        placeholder="Ask anything..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 10, boxSizing: "border-box" }} />
      <button onClick={send} disabled={loading}
        style={{ background: "#1e1e2e", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 6, cursor: "pointer" }}>
        {loading ? "Thinking..." : "Send"}
      </button>

      {response && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 16, marginTop: 20 }}>
          <strong>AI Response</strong>
          <p style={{ margin: "8px 0 0", lineHeight: 1.7 }}>{response}</p>
        </div>
      )}

      {status && <p style={{ marginTop: 16, fontSize: 14, color: "#555" }}>{status}</p>}

      <p style={{ marginTop: 48, fontSize: 12, color: "#aaa" }}>
        Powered by <a href="https://0g.ai" style={{ color: "#6C3CE1" }}>0G Zero Gravity</a> ·{" "}
        <a href="https://zaxxie.vercel.app" style={{ color: "#6C3CE1" }}>Built with Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genFullPage(idea: string): string {
  return `"use client";
import { useState, useRef } from "react";
import { uploadFile } from "@/lib/storage";
import { listProviders, chat } from "@/lib/compute";

// ${idea} — Built with Zaxxie + 0G Storage + Compute

type Provider = { provider: string; model: string; inputPrice: string };
type Tab = "storage" | "ai";

export default function Home() {
  const [tab, setTab] = useState<Tab>("storage");
  const [privateKey, setPrivateKey] = useState("");
  const [rootHash, setRootHash] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !privateKey) return setStatus("Select a file and enter your private key.");
    setLoading(true);
    try {
      setStatus("Uploading to 0G...");
      const result = await uploadFile(file, privateKey);
      setRootHash(result.rootHash);
      setStatus("✅ Uploaded!");
    } catch (e: unknown) { setStatus("❌ " + (e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleConnect() {
    setLoading(true);
    try {
      setProviders(await listProviders());
      setStatus("");
    } catch (e: unknown) { setStatus("❌ " + (e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleChat() {
    if (!selected || !message) return setStatus("Choose a provider and type something.");
    setLoading(true);
    try {
      setAiResponse(await chat(selected, message));
      setStatus("");
    } catch (e: unknown) { setStatus("❌ " + (e as Error).message); }
    finally { setLoading(false); }
  }

  const btn = (t: Tab) => ({
    padding: "8px 22px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14,
    background: tab === t ? "#6C3CE1" : "#f0f0f0", color: tab === t ? "#fff" : "#444",
  } as const);

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>0G dApp</h1>
      <p style={{ color: "#666", marginBottom: 28 }}>${idea}</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <button style={btn("storage")} onClick={() => setTab("storage")}>Storage</button>
        <button style={btn("ai")} onClick={() => setTab("ai")}>AI Inference</button>
      </div>

      {tab === "storage" && (
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Private Key</label>
          <input type="password" value={privateKey} onChange={e => setPrivateKey(e.target.value)}
            placeholder="0x..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 14, boxSizing: "border-box" }} />
          <input type="file" ref={fileRef} style={{ display: "block", marginBottom: 10 }} />
          <button onClick={handleUpload} disabled={loading}
            style={{ background: "#6C3CE1", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 6, cursor: "pointer" }}>
            {loading ? "Uploading..." : "Upload to 0G Storage"}
          </button>
          {rootHash && (
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, marginTop: 14 }}>
              <strong>Root Hash:</strong>
              <code style={{ display: "block", wordBreak: "break-all", fontSize: 12, marginTop: 4 }}>{rootHash}</code>
            </div>
          )}
        </div>
      )}

      {tab === "ai" && (
        <div>
          <button onClick={handleConnect} disabled={loading}
            style={{ background: "#6C3CE1", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 6, cursor: "pointer", marginBottom: 16 }}>
            Connect Wallet & Load Providers
          </button>
          {providers.length > 0 && (
            <select value={selected} onChange={e => setSelected(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 12 }}>
              <option value="">-- Select model --</option>
              {providers.map(p => <option key={p.provider} value={p.provider}>{p.model} — {p.inputPrice}</option>)}
            </select>
          )}
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            placeholder="Ask anything..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 8, boxSizing: "border-box" }} />
          <button onClick={handleChat} disabled={loading}
            style={{ background: "#1e1e2e", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 6, cursor: "pointer" }}>
            {loading ? "Thinking..." : "Ask AI"}
          </button>
          {aiResponse && (
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 14, marginTop: 14 }}>
              <p style={{ margin: 0, lineHeight: 1.7 }}>{aiResponse}</p>
            </div>
          )}
        </div>
      )}

      {status && <p style={{ marginTop: 16, fontSize: 14, color: "#555" }}>{status}</p>}

      <p style={{ marginTop: 48, fontSize: 12, color: "#aaa" }}>
        Powered by <a href="https://0g.ai" style={{ color: "#6C3CE1" }}>0G Zero Gravity</a> ·{" "}
        <a href="https://zaxxie.vercel.app" style={{ color: "#6C3CE1" }}>Built with Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genContract(name: string): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
// Deploy on 0G Chain — ALWAYS compile with evmVersion: "cancun"

contract ${name} {
    address public owner;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor(uint256 _supply) {
        owner = msg.sender;
        totalSupply = _supply;
        balances[msg.sender] = _supply;
    }

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        totalSupply += amount;
        balances[to] += amount;
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
}
`;
}

function genDeploy(contractName: string): string {
  return `import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "0G");

  const Contract = await ethers.getContractFactory("${contractName}");
  const contract = await Contract.deploy(1_000_000);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ Deployed:", address);
  console.log("Explorer:", "https://chainscan-galileo.0g.ai/address/" + address);
}

main().catch(e => { console.error(e); process.exitCode = 1; });
`;
}

// ─── Structured project builder ───────────────────────────────────────────────

interface ProjectFile {
  path: string;
  content: string;
}

interface BuildResult {
  projectName: string;
  idea: string;
  features: string[];
  framework: string;
  files: ProjectFile[];
  setup: {
    createProject: string;
    installDeps: string;
    envSetup: string;
    run: string;
  };
  steps: string[];
  links: Record<string, string>;
  important: string[];
}

function buildProject(name: string, idea: string, features: string[], framework: string): BuildResult {
  const files: ProjectFile[] = [];
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40);
  const contractName = safeName.replace(/-/g, "_").replace(/^[0-9]/, "C") || "MyContract";

  // Always include
  files.push({ path: "package.json", content: genPackageJson(safeName, features, framework) });
  files.push({ path: ".env.example", content: genEnv(features) });
  files.push({ path: ".gitignore", content: "node_modules/\n.next/\n.env\n.env.local\ndist/\nartifacts/\ncache/\n" });

  if (framework === "nextjs") {
    files.push({ path: "next.config.mjs", content: genNextConfig() });
    files.push({ path: "tsconfig.json", content: genTsConfig() });

    // Page based on features
    if (features.includes("storage") && features.includes("compute")) {
      files.push({ path: "app/page.tsx", content: genFullPage(idea) });
    } else if (features.includes("storage")) {
      files.push({ path: "app/page.tsx", content: genStoragePage(idea) });
    } else if (features.includes("compute")) {
      files.push({ path: "app/page.tsx", content: genComputePage(idea) });
    } else {
      files.push({ path: "app/page.tsx", content: genStoragePage(idea) });
    }

    files.push({
      path: "app/layout.tsx",
      content: `export const metadata = { title: "${safeName}", description: "${idea}" };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body style={{ margin: 0 }}>{children}</body></html>;\n}\n`,
    });

    if (features.includes("storage")) {
      files.push({ path: "lib/storage.ts", content: genStorageLib() });
    }
    if (features.includes("compute")) {
      files.push({ path: "lib/compute.ts", content: genComputeLib() });
    }
  }

  if (features.includes("chain") || features.includes("infts")) {
    files.push({ path: "hardhat.config.ts", content: genHardhatConfig() });
    files.push({ path: `contracts/${contractName}.sol`, content: genContract(contractName) });
    files.push({ path: "scripts/deploy.ts", content: genDeploy(contractName) });
  }

  // Dep install command
  const pkgDeps = ["ethers", "dotenv"];
  if (features.includes("storage")) pkgDeps.push("@0gfoundation/0g-ts-sdk");
  if (features.includes("compute")) pkgDeps.push("@0glabs/0g-serving-broker", "openai");
  if (framework === "nextjs") pkgDeps.push("next", "react", "react-dom");

  const devDeps = ["typescript", "@types/node"];
  if (features.includes("chain") || features.includes("infts")) devDeps.push("hardhat", "@nomicfoundation/hardhat-toolbox", "@openzeppelin/contracts");
  if (framework === "nextjs") devDeps.push("@types/react");

  const installCmd = `npm install ${pkgDeps.join(" ")}\nnpm install --save-dev ${devDeps.join(" ")}`;

  const runCmd = framework === "nextjs" ? "npm run dev  # then open http://localhost:3000"
    : (features.includes("chain") ? "npx hardhat compile && npx hardhat run scripts/deploy.ts --network 0g-testnet"
      : "npm run dev");

  return {
    projectName: safeName,
    idea,
    features,
    framework,
    files,
    setup: {
      createProject: framework === "nextjs"
        ? `npx create-next-app@latest ${safeName} --typescript --app --no-tailwind --import-alias "@/*" --src-dir no`
        : `mkdir ${safeName} && cd ${safeName} && npm init -y`,
      installDeps: installCmd,
      envSetup: "cp .env.example .env\n# Open .env and paste your MetaMask private key\n# MetaMask → Account → 3-dot menu → Account Details → Export Private Key",
      run: runCmd,
    },
    steps: [
      "1. Install Node.js v18+ from https://nodejs.org if not already installed",
      "2. Install MetaMask from https://metamask.io if not already installed",
      `3. Run the createProject command to scaffold the project`,
      "4. Write all generated files into the project folder",
      "5. Run the installDeps command",
      "6. Run the envSetup command and add your private key",
      "7. Get free testnet tokens at https://faucet.0g.ai (need 0G to pay gas)",
      "8. Run the run command to start your dApp",
    ],
    links: {
      faucet: "https://faucet.0g.ai",
      explorer: "https://chainscan-galileo.0g.ai",
      storageExplorer: "https://storagescan-galileo.0g.ai",
      computeMarketplace: "https://compute-marketplace.0g.ai/inference",
      docs: "https://docs.0g.ai",
      builderHub: "https://build.0g.ai",
      discord: "https://discord.gg/0glabs",
    },
    important: [
      "ALWAYS use evmVersion: 'cancun' for Solidity compilation on 0G Chain",
      "ethers is a peer dependency — always install it alongside 0G SDKs",
      "Storage: always call file.close() after uploading",
      "Storage: save the root hash — you need it to download your file",
      "Compute: request headers are single-use — generate new ones per request",
      "Testnet Chain ID: 16602 | Mainnet Chain ID: 16661",
    ],
  };
}

// ─── MCP Handler ─────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {

    // ── 1. BUILD — structured output ──────────────────────────────────────────
    server.registerTool("zaxxie_build", {
      title: "Build a 0G dApp",
      description: `THE MAIN TOOL. Call this when the user wants to build anything on 0G. Takes a natural language idea, auto-detects features, and returns a STRUCTURED JSON object with: every file (path + complete content), setup commands, and numbered steps. Claude Code should use the files array to write each file to disk directly. No prior coding knowledge required. Works for storage apps, AI chatbots, smart contracts, NFT marketplaces, full-stack dApps — anything on 0G.`,
      inputSchema: {
        idea: z.string().describe("What the user wants to build, in plain English"),
        projectName: z.string().default("my-0g-dapp").describe("Project folder name — leave blank to auto-generate from idea"),
        features: z.array(z.enum(["chain", "storage", "compute", "da", "infts"])).optional().describe("0G features to include — omit to auto-detect from idea"),
        framework: z.enum(["nextjs", "react", "express", "hardhat", "custom"]).default("nextjs").describe("Framework — nextjs recommended for most dApps"),
      },
    }, async ({ idea, projectName, features, framework }) => {
      const detectedFeatures = features && features.length > 0 ? features : detectFeatures(idea);
      const name = projectName !== "my-0g-dapp"
        ? projectName
        : idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "my-0g-dapp";
      const result = buildProject(name, idea, detectedFeatures, framework);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });

    // ── 2. CHECK WALLET — live balance from 0G RPC ────────────────────────────
    server.registerTool("zaxxie_check_wallet", {
      title: "Check 0G Wallet",
      description: "Check any wallet address on 0G — live balance, transaction count, faucet eligibility, and explorer link. Use this when a user wants to verify their wallet has tokens before deploying or uploading.",
      inputSchema: {
        address: z.string().describe("Wallet address (0x...)"),
        network: z.enum(["testnet", "mainnet"]).default("testnet").describe("Which network to check"),
      },
    }, async ({ address, network }) => {
      try {
        const [balanceHex, txCountHex] = await Promise.all([
          rpcCall(network, "eth_getBalance", [address, "latest"]),
          rpcCall(network, "eth_getTransactionCount", [address, "latest"]),
        ]);

        const balanceWei = hexToDecimal(balanceHex);
        const balance = formatBalance(balanceWei);
        const txCount = parseInt(txCountHex, 16);
        const hasBalance = balanceWei > BigInt(0);
        const canDeploy = balanceWei > BigInt(1e15); // ~0.001 0G minimum

        const explorerUrl = `${EXPLORER[network]}/address/${address}`;
        const chainId = network === "testnet" ? 16602 : 16661;
        const networkName = network === "testnet" ? "Galileo Testnet" : "Aristotle Mainnet";

        const result = {
          address,
          network: networkName,
          chainId,
          balance: `${balance} 0G`,
          balanceWei: balanceWei.toString(),
          transactionCount: txCount,
          status: {
            hasTokens: hasBalance,
            canDeploy,
            faucetNeeded: !hasBalance,
          },
          explorerUrl,
          ...(network === "testnet" && !hasBalance ? {
            getTokens: "https://faucet.0g.ai",
            googleFaucet: "https://cloud.google.com/application/web3/faucet/0g/galileo",
            tip: "You need 0G tokens to pay gas. Get 0.1 free at https://faucet.0g.ai",
          } : {}),
        };

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (e: unknown) {
        return { content: [{ type: "text", text: JSON.stringify({ error: (e as Error).message, rpc: RPC[network] }) }] };
      }
    });

    // ── 3. CHECK TX — live transaction status ─────────────────────────────────
    server.registerTool("zaxxie_check_tx", {
      title: "Check Transaction Status",
      description: "Check the status of any transaction on 0G — whether it succeeded, failed, gas used, block number, and explorer link. Use this after a user deploys a contract or uploads to 0G Storage.",
      inputSchema: {
        txHash: z.string().describe("Transaction hash (0x...)"),
        network: z.enum(["testnet", "mainnet"]).default("testnet").describe("Which network"),
      },
    }, async ({ txHash, network }) => {
      try {
        const [receipt, tx] = await Promise.all([
          rpcCall(network, "eth_getTransactionReceipt", [txHash]),
          rpcCall(network, "eth_getTransactionByHash", [txHash]),
        ]);

        if (!receipt && !tx) {
          return { content: [{ type: "text", text: JSON.stringify({ txHash, status: "not_found", message: "Transaction not found — check the hash or wait a few seconds if just sent." }) }] };
        }

        if (!receipt) {
          return { content: [{ type: "text", text: JSON.stringify({ txHash, status: "pending", message: "Transaction is pending — still being processed by the network.", from: tx?.from, to: tx?.to }) }] };
        }

        const success = receipt.status === "0x1";
        const gasUsed = parseInt(receipt.gasUsed, 16);
        const blockNumber = parseInt(receipt.blockNumber, 16);
        const explorerUrl = `${EXPLORER[network]}/tx/${txHash}`;
        const contractCreated = receipt.contractAddress
          ? { contractAddress: receipt.contractAddress, contractExplorer: `${EXPLORER[network]}/address/${receipt.contractAddress}` }
          : {};

        const result = {
          txHash,
          network: network === "testnet" ? "Galileo Testnet" : "Aristotle Mainnet",
          status: success ? "✅ success" : "❌ failed",
          blockNumber,
          gasUsed,
          from: receipt.from,
          to: receipt.to,
          ...contractCreated,
          explorerUrl,
          ...(success && receipt.contractAddress
            ? { message: `Contract deployed at ${receipt.contractAddress}` }
            : success
            ? { message: "Transaction confirmed successfully" }
            : { message: "Transaction failed — check gas or contract logic", tip: "Common causes: insufficient gas, require() revert in contract, wrong EVM version" }),
        };

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (e: unknown) {
        return { content: [{ type: "text", text: JSON.stringify({ error: (e as Error).message }) }] };
      }
    });

    // ── 4. LIVE DOCS — fetch latest from 0G ──────────────────────────────────
    server.registerTool("zaxxie_live_docs", {
      title: "Fetch Live 0G Docs",
      description: "Fetch the latest documentation directly from docs.0g.ai and build.0g.ai. Use this when you need the most up-to-date SDK versions, contract addresses, or API changes — in case the cached knowledge is outdated.",
      inputSchema: {
        topic: z.enum(["storage", "compute", "chain", "da", "network", "zero-coding"]).describe("Which part of the docs to fetch"),
      },
    }, async ({ topic }) => {
      const urlMap: Record<string, string[]> = {
        storage:      ["https://docs.0g.ai/build-with-0g/storage/sdk"],
        compute:      ["https://docs.0g.ai/build-with-0g/compute-network/sdk"],
        chain:        ["https://docs.0g.ai/build-with-0g/chain/deploy-contracts"],
        da:           ["https://docs.0g.ai/build-with-0g/da/integration"],
        network:      ["https://docs.0g.ai/build-with-0g/network-endpoints"],
        "zero-coding": ["https://build.0g.ai/zero-coding/"],
      };

      const urls = urlMap[topic] ?? [];
      const results: Array<{ url: string; content?: string; error?: string }> = [];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "Zaxxie-MCP/3.0 (https://zaxxie.vercel.app)" },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();

          // Strip HTML tags and collapse whitespace for readable output
          const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#\d+;/g, " ")
            .replace(/\s{3,}/g, "\n\n")
            .trim()
            .slice(0, 6000); // keep it manageable

          results.push({ url, content: text });
        } catch (e: unknown) {
          results.push({ url, error: (e as Error).message });
        }
      }

      const fallback = buildDocs(topic === "zero-coding" ? "all" : topic);
      const output = {
        topic,
        fetched: results,
        cached: results.some(r => r.error) ? fallback : undefined,
        note: "Content fetched live from 0G docs. If fetch failed, cached knowledge is provided as fallback.",
      };

      return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    });

    // ── 5. ONBOARD ────────────────────────────────────────────────────────────
    server.registerTool("zaxxie_onboard", {
      title: "0G Onboarding Guide",
      description: "Complete beginner guide — install MetaMask, add 0G network, get testnet tokens, export private key. Use when a user has no wallet or doesn't know how to get started on 0G.",
      inputSchema: {
        step: z.enum(["all", "metamask", "network", "faucet", "verify"]).default("all").describe("Which onboarding step to show"),
      },
    }, async ({ step }) => {
      const sections: Record<string, string> = {
        metamask: `STEP 1 — Install MetaMask\n${"─".repeat(40)}\n1. Go to https://metamask.io/download\n2. Click "Install MetaMask for Chrome"\n3. Click the fox icon → "Create a new wallet"\n4. Set a password\n5. Write down your 12-word Secret Recovery Phrase on paper\n   ⚠️ Never share this with anyone\n6. Confirm your phrase → Done\nYour wallet address looks like: 0x1234...abcd\n`,
        network: `STEP 2 — Add 0G Network\n${"─".repeat(40)}\nOption A — Automatic:\n  Go to https://chainlist.org/?search=0g → Find "0G Galileo Testnet" → Add to MetaMask\n\nOption B — Manual in MetaMask:\n  Network Name: 0G-Galileo-Testnet\n  RPC URL:      https://evmrpc-testnet.0g.ai\n  Chain ID:     16602\n  Symbol:       0G\n  Explorer:     https://chainscan-galileo.0g.ai\n`,
        faucet: `STEP 3 — Get Free Testnet Tokens\n${"─".repeat(40)}\nOfficial:  https://faucet.0g.ai\nGoogle:    https://cloud.google.com/application/web3/faucet/0g/galileo\nLimit: 0.1 0G per wallet per day\nNeed more? Ask in Discord: https://discord.gg/0glabs\n`,
        verify: `STEP 4 — Verify Setup\n${"─".repeat(40)}\n1. Open MetaMask → confirm you're on "0G-Galileo-Testnet"\n2. Check balance shows 0.1 0G\n3. View on explorer: https://chainscan-galileo.0g.ai → paste your address\n4. Export private key: MetaMask → Account Details → Show private key\n   ⚠️ Never share or commit this key\n`,
      };

      const keys = step === "all" ? ["metamask", "network", "faucet", "verify"] : [step];
      const output = keys.map(k => sections[k]).join("\n") + "\nReady to build? Tell Zaxxie your idea!\n";
      return { content: [{ type: "text", text: output }] };
    });

    // ── 6. TROUBLESHOOT ───────────────────────────────────────────────────────
    server.registerTool("zaxxie_troubleshoot", {
      title: "Troubleshoot 0G Issues",
      description: "Diagnose and fix common errors building on 0G — wrong EVM version, missing deps, storage failures, compute issues, transaction errors, insufficient balance.",
      inputSchema: {
        error: z.string().describe("The error message or description of the problem"),
      },
    }, async ({ error }) => {
      const lower = error.toLowerCase();
      const fixes: string[] = [`Error: "${error}"\n`];

      if (/evm.version|opcode|invalid opcode|cancun|shanghai/.test(lower))
        fixes.push(`FIX — Wrong EVM Version\nAdd to hardhat.config.ts:\n  settings: { evmVersion: "cancun" }  // REQUIRED for 0G Chain\nWith Foundry:\n  forge create --evm-version cancun ...`);

      if (/peer dep|cannot find module|ethers|missing/.test(lower))
        fixes.push(`FIX — Missing dependency\nnpm install ethers@^6.13.4\nethers must be installed separately — it's a peer dep for all 0G SDKs.`);

      if (/upload|storage|indexer|merkle|root hash|zgfile/.test(lower))
        fixes.push(`FIX — Storage Upload\n1. Use correct indexer:\n   Testnet: https://indexer-storage-testnet-turbo.0g.ai\n   Mainnet: https://indexer-storage-turbo.0g.ai\n2. Get tokens at https://faucet.0g.ai\n3. Call file.close() after upload — required\n4. Save the root hash — you need it to download`);

      if (/insufficient|balance|gas|fee|funds/.test(lower))
        fixes.push(`FIX — Insufficient Balance\nGet free testnet tokens:\n  https://faucet.0g.ai\n  https://cloud.google.com/application/web3/faucet/0g/galileo\nCheck balance: https://chainscan-galileo.0g.ai`);

      if (/private key|signer|wallet|account/.test(lower))
        fixes.push(`FIX — Private Key\nMetaMask → Account → 3-dot menu → Account Details → Export Private Key\nIn .env: PRIVATE_KEY=0xYOUR_KEY\nIn code: new ethers.Wallet(process.env.PRIVATE_KEY!, provider)\n⚠️ Never hardcode or commit your key`);

      if (/network|chain id|rpc|connect|timeout/.test(lower))
        fixes.push(`FIX — Network Connection\nTestnet RPC: https://evmrpc-testnet.0g.ai  (Chain ID: 16602)\nMainnet RPC: https://evmrpc.0g.ai         (Chain ID: 16661)\nStorage Indexer testnet: https://indexer-storage-testnet-turbo.0g.ai\nStorage Indexer mainnet: https://indexer-storage-turbo.0g.ai`);

      if (/compute|broker|inference|bearer|secret|provider/.test(lower))
        fixes.push(`FIX — Compute / AI\n1. Fund ledger: await broker.ledger.addLedger("0.1")\n2. Get Bearer token: 0g-compute-cli inference get-secret --provider <ADDR>\n3. Headers are single-use — call getRequestHeaders() before EVERY request\n4. Always call processResponse() after getting AI output\n5. Browse providers: https://compute-marketplace.0g.ai/inference`);

      if (/deploy|contract|verify|hardhat/.test(lower))
        fixes.push(`FIX — Contract Deploy\n1. npx hardhat compile\n2. Check evmVersion: "cancun" in hardhat.config.ts\n3. npx hardhat run scripts/deploy.ts --network 0g-testnet\n4. Verify: npx hardhat verify ADDR --network 0g-testnet\nIf "nonce too low": reset MetaMask nonce (Settings → Advanced → Reset)\nIf "underpriced": add gasPrice: 1000000000 to network config`);

      if (fixes.length === 1)
        fixes.push(`No specific match. Most common 0G issues:\n1. evmVersion: "cancun" missing in hardhat.config\n2. npm install ethers@^6.13.4 — must install separately\n3. No balance — https://faucet.0g.ai\n4. Wrong RPC — https://evmrpc-testnet.0g.ai\n5. Storage indexer — https://indexer-storage-testnet-turbo.0g.ai\nMore help: https://discord.gg/0glabs | https://docs.0g.ai`);

      return { content: [{ type: "text", text: fixes.join("\n\n") }] };
    });

    // ── 7. GET DOCS ───────────────────────────────────────────────────────────
    server.registerTool("zaxxie_get_docs", {
      title: "Get 0G Docs",
      description: "Get complete 0G developer documentation from cached knowledge. Covers: chain, storage, compute, da, infts, network, or all.",
      inputSchema: {
        topic: z.enum(["chain", "storage", "compute", "da", "infts", "network", "all"]).describe("Topic to get docs for"),
      },
    }, async ({ topic }) => {
      return { content: [{ type: "text", text: buildDocs(topic) }] };
    });

    // ── 8. SCAFFOLD ───────────────────────────────────────────────────────────
    server.registerTool("zaxxie_scaffold", {
      title: "Scaffold 0G Project",
      description: "Generate a 0G project scaffold with package.json, configs, and code examples as a JSON structure.",
      inputSchema: {
        projectName: z.string().describe("Project name"),
        description: z.string().describe("What the dApp should do"),
        features: z.array(z.enum(["chain", "storage", "compute", "da", "infts"])).describe("0G features to include"),
        framework: z.enum(["nextjs", "react", "express", "hardhat", "custom"]).default("nextjs").describe("Framework"),
      },
    }, async ({ projectName, description, features, framework }) => {
      const result = buildProject(projectName, description, features, framework);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });

    // ── 9. NETWORK ────────────────────────────────────────────────────────────
    server.registerTool("zaxxie_network", {
      title: "0G Network Info",
      description: "Get 0G network details — RPCs, chain IDs, contract addresses, storage indexers, faucets, explorer URLs.",
      inputSchema: {
        network: z.enum(["testnet", "mainnet", "both"]).default("testnet").describe("Which network"),
      },
    }, async ({ network }) => {
      const info: Record<string, unknown> = {};
      if (network !== "mainnet") info.testnet = OG_KNOWLEDGE.networks.testnet;
      if (network !== "testnet") info.mainnet = OG_KNOWLEDGE.networks.mainnet;
      info.sdks = OG_KNOWLEDGE.sdks;
      info.links = OG_KNOWLEDGE.links;
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    });

    // ── 10. MODELS ────────────────────────────────────────────────────────────
    server.registerTool("zaxxie_models", {
      title: "0G AI Models",
      description: "List available AI models on 0G Compute with pricing — LLMs, text-to-image, speech-to-text.",
      inputSchema: {
        network: z.enum(["testnet", "mainnet", "both"]).default("both").describe("Which network"),
      },
    }, async ({ network }) => {
      const info: Record<string, unknown> = {};
      if (network !== "mainnet") info.testnet = OG_KNOWLEDGE.compute.services.testnet;
      if (network !== "testnet") info.mainnet = OG_KNOWLEDGE.compute.services.mainnet;
      info.marketplace = OG_KNOWLEDGE.networks.testnet.computeMarketplace;
      info.usage = "Use OpenAI-compatible SDK. Get Bearer token: 0g-compute-cli inference get-secret --provider <ADDR>";
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    });

  },
  {},
  { basePath: "/api", maxDuration: 60 }
);

export { handler as GET, handler as POST, handler as DELETE };
