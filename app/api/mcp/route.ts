// Performance: solc (9.6MB) and @0gfoundation/0g-ts-sdk (5.5MB) are excluded
// from the webpack bundle via next.config.mjs externals — loaded at runtime only.

// Vercel function config (Next.js 15 route segment config)
export const maxDuration = 120;

import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { ethers } from "ethers";
import { OG_KNOWLEDGE } from "@/knowledge/og-docs";

// ─── Network constants ────────────────────────────────────────────────────────

const RPC = {
  testnet: "https://evmrpc-testnet.0g.ai",
  mainnet: "https://evmrpc.0g.ai",
} as const;

const INDEXER = {
  testnet: "https://indexer-storage-testnet-turbo.0g.ai",
  mainnet: "https://indexer-storage-turbo.0g.ai",
} as const;

const EXPLORER = {
  testnet: "https://chainscan-galileo.0g.ai",
  mainnet: "https://chainscan.0g.ai",
} as const;

const CHAIN_ID = { testnet: 16602, mainnet: 16661 } as const;

// ─── RPC helpers ──────────────────────────────────────────────────────────────

async function rpc(
  network: keyof typeof RPC,
  method: string,
  params: unknown[]
): Promise<unknown> {
  const res = await fetch(RPC[network], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? JSON.stringify(json.error));
  return json.result ?? null;
}

function hexToEth(hex: string | null | undefined): string {
  if (!hex || hex === "0x") return "0.000000";
  const wei = BigInt(hex);
  const whole = wei / BigInt(1e18);
  const frac = (wei % BigInt(1e18)).toString().padStart(18, "0").slice(0, 6);
  return `${whole}.${frac}`;
}

function hexToInt(hex: string | null | undefined): number {
  if (!hex || hex === "0x") return 0;
  return parseInt(hex, 16);
}

// ─── In-process response cache (survives warm invocations, resets on cold start) ─
// Static tools (network info, docs, models) cache their output for 60s so
// repeated calls within the same warm instance return instantly.
const _cache = new Map<string, { data: string; expires: number }>();
function cacheGet(key: string): string | null {
  const entry = _cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}
function cacheSet(key: string, data: string, ttlMs = 60_000): void {
  _cache.set(key, { data, expires: Date.now() + ttlMs });
}

// ─── Memory helpers (Vercel KV) ───────────────────────────────────────────────

const KV_CONFIGURED = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

type MemoryEntry = { label: string; data: Record<string, unknown>; createdAt: string };
type WalletMemory = { contracts: MemoryEntry[]; uploads: MemoryEntry[]; projects: MemoryEntry[]; notes: MemoryEntry[] };

async function memGet<T>(key: string): Promise<T | null> {
  if (!KV_CONFIGURED) return null;
  try {
    const { kv } = await import("@vercel/kv");
    return kv.get<T>(key);
  } catch { return null; }
}

async function memSet(key: string, value: unknown): Promise<void> {
  if (!KV_CONFIGURED) return;
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value, { ex: 60 * 60 * 24 * 90 }); // 90-day TTL
  } catch { /* silent — KV optional */ }
}

async function appendMemory(wallet: string, type: keyof WalletMemory, entry: MemoryEntry): Promise<void> {
  const existing = await memGet<WalletMemory>(`zaxxie:${wallet.toLowerCase()}`) ?? { contracts: [], uploads: [], projects: [], notes: [] };
  existing[type] = [...(existing[type] ?? []), entry].slice(-50); // keep last 50 per type
  await memSet(`zaxxie:${wallet.toLowerCase()}`, existing);
}

// ─── Solidity compiler (solc-js) ─────────────────────────────────────────────

interface CompileResult { abi: unknown[]; bytecode: string; contractName: string }

async function compileSolidity(source: string): Promise<CompileResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const solc = require("solc") as { compile: (input: string) => string };

  const nameMatch = source.match(/contract\s+(\w+)/);
  const contractName = nameMatch?.[1] ?? "Contract";

  const input = JSON.stringify({
    language: "Solidity",
    sources: { [`${contractName}.sol`]: { content: source } },
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  });

  const raw = solc.compile(input);
  const output = JSON.parse(raw) as {
    errors?: Array<{ severity: string; formattedMessage?: string; message: string }>;
    contracts: Record<string, Record<string, { abi: unknown[]; evm: { bytecode: { object: string } } }>>;
  };

  const errors = (output.errors ?? []).filter(e => e.severity === "error");
  if (errors.length) throw new Error("Compilation failed:\n" + errors.map(e => e.formattedMessage ?? e.message).join("\n"));

  const fileContracts = output.contracts[`${contractName}.sol`];
  if (!fileContracts) throw new Error("No contracts compiled — check your Solidity source");

  const name = Object.keys(fileContracts)[0];
  const compiled = fileContracts[name];
  if (!compiled.evm.bytecode.object) throw new Error("Empty bytecode — contract may be abstract or interface-only");

  return { contractName: name, abi: compiled.abi, bytecode: "0x" + compiled.evm.bytecode.object };
}

// ─── Docs builder ─────────────────────────────────────────────────────────────

function buildDocs(topic: string): string {
  let d = "";
  const hr = "=".repeat(60);
  if (topic === "chain" || topic === "all")
    d += `\n${hr}\n0G CHAIN\n${hr}\n${OG_KNOWLEDGE.chain.overview}\n\nHardhat Config:\n${OG_KNOWLEDGE.chain.hardhatConfig}\n\nSample Contract:\n${OG_KNOWLEDGE.chain.sampleContract}\n\nDeploy Script:\n${OG_KNOWLEDGE.chain.deployScript}\n\nFoundry:\n${OG_KNOWLEDGE.chain.foundryDeploy}\n\nVerify:\n${OG_KNOWLEDGE.chain.verify}\n`;
  if (topic === "storage" || topic === "all")
    d += `\n${hr}\n0G STORAGE\n${hr}\n${OG_KNOWLEDGE.storage.overview}\nInstall: ${OG_KNOWLEDGE.sdks.storage_ts.install}\n\nSetup:\n${OG_KNOWLEDGE.storage.setup}\n\nUpload:\n${OG_KNOWLEDGE.storage.upload}\n\nDownload:\n${OG_KNOWLEDGE.storage.download}\n\nKV:\n${OG_KNOWLEDGE.storage.kvStorage}\n`;
  if (topic === "compute" || topic === "all")
    d += `\n${hr}\n0G COMPUTE\n${hr}\n${OG_KNOWLEDGE.compute.overview}\nInstall: ${OG_KNOWLEDGE.sdks.compute_broker.install}\n\nSDK Setup:\n${OG_KNOWLEDGE.compute.sdkSetup}\n\nChat:\n${OG_KNOWLEDGE.compute.chatCompletion}\n\nImage:\n${OG_KNOWLEDGE.compute.textToImage}\n\nSpeech:\n${OG_KNOWLEDGE.compute.speechToText}\n`;
  if (topic === "da" || topic === "all")
    d += `\n${hr}\n0G DA\n${hr}\n${OG_KNOWLEDGE.da.overview}\n\nDocker:\n${OG_KNOWLEDGE.da.dockerSetup}\n\nEnv:\n${OG_KNOWLEDGE.da.envConfig}\n`;
  if (topic === "infts" || topic === "all")
    d += `\n${hr}\nINFTs (ERC-7857)\n${hr}\n${OG_KNOWLEDGE.infts.overview}\n\nSetup:\n${OG_KNOWLEDGE.infts.setupCode}\n\nDeploy:\n${OG_KNOWLEDGE.infts.contractExample}\n`;
  if (topic === "network" || topic === "all")
    d += `\n${hr}\nNETWORK\n${hr}\n${JSON.stringify(OG_KNOWLEDGE.networks, null, 2)}\n\nSDKs:\n${JSON.stringify(OG_KNOWLEDGE.sdks, null, 2)}\n`;
  d += `\n${hr}\nNOTES\n${hr}\n${OG_KNOWLEDGE.importantNotes.join("\n")}\n`;
  return d;
}

// ─── Feature detector ─────────────────────────────────────────────────────────

function detectFeatures(idea: string): string[] {
  const s = idea.toLowerCase();
  const f: string[] = [];
  if (/storage|upload|file|save|blob|media|image|video|document|photo|ipfs|decentralized storage/.test(s)) f.push("storage");
  if (/ai|compute|inference|chatbot|chat|gpt|llm|model|text.to.image|speech|whisper|generate|predict|assistant/.test(s)) f.push("compute");
  if (/nft|token|erc|contract|mint|deploy|smart contract|solidity|erc20|erc721|marketplace|coin/.test(s)) f.push("chain");
  if (/inft|intelligent nft|ai agent nft|erc.7857|agent nft/.test(s)) f.push("infts");
  if (/\bda\b|data availability|rollup|op.stack|arbitrum/.test(s)) f.push("da");
  return f.length ? f : ["storage", "compute"];
}

// ─── Generated file content ───────────────────────────────────────────────────

function genPackageJson(name: string, features: string[], framework: string): string {
  const deps: Record<string, string> = { ethers: "^6.13.4", dotenv: "^16.4.0" };
  const dev: Record<string, string> = { typescript: "^5.7.2", "@types/node": "^22.0.0" };
  if (features.includes("storage")) deps["@0gfoundation/0g-ts-sdk"] = "latest";
  if (features.includes("compute")) { deps["@0glabs/0g-serving-broker"] = "latest"; deps["openai"] = "^4.0.0"; }
  if (features.includes("chain") || features.includes("infts")) {
    dev["hardhat"] = "^2.22.0";
    dev["@nomicfoundation/hardhat-toolbox"] = "^5.0.0";
    dev["@openzeppelin/contracts"] = "^5.0.0";
  }
  if (framework === "nextjs") {
    deps["next"] = "^15.0.0"; deps["react"] = "^19.0.0"; deps["react-dom"] = "^19.0.0"; dev["@types/react"] = "^19.0.0";
    // RainbowKit wallet connect + Tailwind
    deps["@rainbow-me/rainbowkit"] = "^2.0.0";
    deps["wagmi"] = "^2.0.0";
    deps["viem"] = "^2.0.0";
    deps["@tanstack/react-query"] = "^5.0.0";
  }
  if (framework === "express") deps["express"] = "^4.21.0";
  const scripts: Record<string, string> = framework === "nextjs"
    ? { dev: "next dev", build: "next build", start: "next start" }
    : { deploy: "npx hardhat run scripts/deploy.ts --network 0g-testnet", test: "npx hardhat test" };
  return JSON.stringify({ name, version: "0.1.0", private: true, scripts, dependencies: deps, devDependencies: dev }, null, 2);
}

function genEnv(features: string[]): string {
  return [
    "# ─── 0G Network ─────────────────────────────────────────",
    "# Get your private key: MetaMask → Account → 3-dot menu → Account Details → Export Private Key",
    "PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE",
    "",
    "# Testnet (Galileo) — ready to use",
    "RPC_URL=https://evmrpc-testnet.0g.ai",
    "CHAIN_ID=16602",
    "",
    ...(features.includes("storage") ? [
      "# 0G Storage public indexer",
      "INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai",
      "# Mainnet: INDEXER_RPC=https://indexer-storage-turbo.0g.ai",
      "",
    ] : []),
    ...(features.includes("compute") ? [
      "# 0G Compute — browse providers at https://compute-marketplace.0g.ai/inference",
      "COMPUTE_PROVIDER_ADDRESS=0xYOUR_PROVIDER_ADDRESS",
      "",
    ] : []),
    "# WalletConnect — get a free projectId at https://cloud.walletconnect.com",
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here",
    "",
    "# Get free testnet tokens: https://faucet.0g.ai (0.1 0G/day)",
  ].join("\n");
}

// Storage lib — browser-compatible, works with RainbowKit/wagmi signer
function genStorageLib(): string {
  return `// 0G Storage helper — works with RainbowKit/wagmi
// Pass the ethers Signer from useWalletClient() — no raw private key needed
import { Blob as ZgBlob, Indexer } from "@0gfoundation/0g-ts-sdk/browser";
import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai";

// IMPORTANT: indexer URL must be HTTPS — http:// is blocked by browsers (Mixed Content)
const INDEXER_RPC = (() => {
  const url = process.env.NEXT_PUBLIC_INDEXER_RPC ?? "https://indexer-storage-testnet-turbo.0g.ai";
  return url.replace(/^http:\\/\\//, "https://");
})();

export function getIndexer() {
  return new Indexer(INDEXER_RPC);
}

// Upload a file — signer comes from wagmi: const { data: wc } = useWalletClient()
// then: const signer = await new BrowserProvider(wc.transport).getSigner()
export async function uploadFile(file: File, signer: ethers.Signer): Promise<{ rootHash: string; txHash: string }> {
  const indexer = getIndexer();
  const zgBlob = new ZgBlob([file], file.name);
  const [tree, treeErr] = await zgBlob.merkleTree();
  if (treeErr) throw new Error(\`Merkle tree failed: \${treeErr}\`);

  const rootHash = tree?.rootHash() ?? "";
  if (!rootHash) throw new Error("Upload failed: could not compute rootHash from file");

  const [tx, uploadErr] = await indexer.upload(zgBlob, RPC_URL, signer);
  if (uploadErr) throw new Error(\`Upload failed: \${uploadErr}\`);

  return { rootHash, txHash: String(tx) };
}

// Upload JSON metadata (for NFTs/INFTs) — validates rootHash before minting
export async function uploadMetadata(metadata: object, signer: ethers.Signer): Promise<{ rootHash: string; txHash: string }> {
  const json = JSON.stringify(metadata);
  const file = new File([json], "metadata.json", { type: "application/json" });
  const result = await uploadFile(file, signer);
  if (!result.rootHash || result.rootHash === "0x") {
    throw new Error("Metadata upload returned empty rootHash — do not proceed to mint");
  }
  return result;
}

export async function downloadFile(rootHash: string, outputPath: string) {
  const indexer = getIndexer();
  const err = await indexer.download(rootHash, outputPath, true);
  if (err) throw new Error(\`Download failed: \${err}\`);
}
`;
}

function genComputeLib(): string {
  return `// 0G Compute helper — connects MetaMask and calls decentralized AI
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { BrowserProvider } from "ethers";
import OpenAI from "openai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

export async function getBroker() {
  if (typeof window === "undefined" || !window.ethereum)
    throw new Error("MetaMask not found — install at https://metamask.io");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return createZGComputeNetworkBroker(signer);
}

export type Provider = { provider: string; model: string; url: string; inputPrice: string; verifiability: string };

export async function listProviders(): Promise<Provider[]> {
  const broker = await getBroker();
  return broker.inference.listService() as Promise<Provider[]>;
}

export async function chat(providerAddress: string, userMessage: string): Promise<string> {
  const broker = await getBroker();
  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  // Headers are single-use — generate fresh for every request
  const headers = await broker.inference.getRequestHeaders(providerAddress, userMessage);

  const client = new OpenAI({
    baseURL: endpoint + "/v1/proxy",
    apiKey: "placeholder",
    defaultHeaders: headers as Record<string, string>,
    dangerouslyAllowBrowser: true,
  });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: userMessage }],
  });

  // Required: process response for billing
  await broker.inference.processResponse(providerAddress, completion, userMessage);
  return completion.choices[0]?.message?.content ?? "";
}
`;
}

function genGlobalsCss(): string {
  return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --primary: #7C5CFC;
    --accent:  #00D4FF;
    --success: #00D68F;
    --error:   #FF5C7A;
    --warn:    #FFB400;
  }

  html, body {
    @apply bg-[#0a0a12] text-[#E8E8F0] antialiased min-h-screen;
    font-family: 'Inter', system-ui, sans-serif;
  }

  body {
    background-image: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,92,252,0.13), transparent);
  }

  ::selection { @apply bg-[#7C5CFC]/30; }

  ::-webkit-scrollbar       { @apply w-1.5; }
  ::-webkit-scrollbar-track { @apply bg-transparent; }
  ::-webkit-scrollbar-thumb { @apply bg-white/10 rounded; }

  a { @apply text-[#7C5CFC] no-underline; }
  a:hover { @apply opacity-80; }
}
`;
}

function genTailwindConfig(): string {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7C5CFC",
        accent:  "#00D4FF",
        success: "#00D68F",
        error:   "#FF5C7A",
        warn:    "#FFB400",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
`;
}

function genProvidersTsx(appName: string): string {
  return `"use client";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// 0G Galileo Testnet — add more chains here (e.g. aristotle mainnet) as needed
const galileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: ["https://evmrpc-testnet.0g.ai"] } },
  blockExplorers: { default: { name: "0G Explorer", url: "https://chainscan-galileo.0g.ai" } },
  testnet: true,
});

// Get a free WalletConnect projectId at https://cloud.walletconnect.com
const config = getDefaultConfig({
  appName: "${appName}",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "placeholder",
  chains: [galileo],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#7C5CFC", borderRadius: "medium" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
`;
}

function genLayoutTsx(title: string, description: string): string {
  return `import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "${title}",
  description: "${description}",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;
}

function genStoragePage(idea: string): string {
  return `"use client";
import { useState, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { uploadFile, downloadFile } from "@/lib/storage";

// ${idea}
// Built with Zaxxie — https://zaxxie.vercel.app

export default function Home() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [rootHash, setRootHash] = useState("");
  const [dlHash, setDlHash] = useState("");
  const [status, setStatus] = useState<{ type: "idle"|"loading"|"success"|"error"; msg: string }>({ type: "idle", msg: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function getSigner() {
    if (!walletClient) throw new Error("Wallet not connected");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new BrowserProvider((walletClient as any).transport);
    return provider.getSigner();
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus({ type: "error", msg: "Select a file first." });
    setStatus({ type: "loading", msg: "Uploading to 0G decentralized storage..." });
    try {
      const signer = await getSigner();
      const r = await uploadFile(file, signer);
      setRootHash(r.rootHash);
      setStatus({ type: "success", msg: "Uploaded! Save your root hash." });
    } catch (e) { setStatus({ type: "error", msg: (e as Error).message }); }
  }

  async function handleDownload() {
    if (!dlHash) return setStatus({ type: "error", msg: "Enter a root hash." });
    setStatus({ type: "loading", msg: "Downloading from 0G..." });
    try {
      await downloadFile(dlHash, "./download");
      setStatus({ type: "success", msg: "Downloaded successfully!" });
    } catch (e) { setStatus({ type: "error", msg: (e as Error).message }); }
  }

  const busy = status.type === "loading";
  const statusCls = {
    success: "bg-success/10 border-success/20 text-success",
    error:   "bg-error/10 border-error/20 text-error",
    loading: "bg-white/5 border-white/10 text-white/50",
    idle:    "hidden",
  }[status.type];

  return (
    <main className="min-h-screen px-5 py-16 flex flex-col items-center">
      <div className="text-center mb-12 max-w-lg">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-3.5 py-1 text-[11px] text-primary font-bold uppercase tracking-widest mb-5">
          ◈ 0G Decentralized Storage
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent mb-3">
          0G Storage App
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">${idea}</p>
      </div>

      <div className="mb-8"><ConnectButton /></div>

      {isConnected && (
        <div className="w-full max-w-lg bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 backdrop-blur-xl space-y-5">
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">File to Upload</label>
            <div className="bg-white/[0.03] border border-dashed border-white/10 rounded-xl p-4 text-center">
              <input type="file" ref={fileRef} className="text-white/50 text-sm w-full cursor-pointer" />
            </div>
          </div>

          <button onClick={handleUpload} disabled={busy}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-[#5B3FDB] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
            {busy ? "⟳  Uploading..." : "↑  Upload to 0G Storage"}
          </button>

          {rootHash && (
            <div className="bg-success/10 border border-success/20 rounded-xl p-4">
              <div className="text-[11px] font-bold text-success uppercase tracking-wider mb-2">✓ Root Hash — Save This</div>
              <code className="text-[11px] text-green-200 break-all leading-relaxed">{rootHash}</code>
            </div>
          )}

          <div className="border-t border-white/[0.06] pt-5 space-y-3">
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">Download by Root Hash</label>
            <input value={dlHash} onChange={e => setDlHash(e.target.value)} placeholder="0x..."
              className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white/90 text-sm placeholder:text-white/25 outline-none focus:border-primary/50 transition-colors" />
            <button onClick={handleDownload} disabled={busy}
              className="w-full py-3.5 bg-accent/10 border border-accent/25 text-accent font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/15 transition-colors">
              {busy ? "⟳  Downloading..." : "↓  Download from 0G"}
            </button>
          </div>

          {status.msg && (
            <div className={\`p-3 rounded-xl text-sm border \${statusCls}\`}>{status.msg}</div>
          )}
        </div>
      )}

      <p className="mt-12 text-xs text-white/20 text-center">
        Powered by <a href="https://0g.ai">0G Zero Gravity</a>{" · "}
        <a href="https://zaxxie.vercel.app">Built with Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genComputePage(idea: string): string {
  return `"use client";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { listProviders, chat, type Provider } from "@/lib/compute";

// ${idea}
// Built with Zaxxie — https://zaxxie.vercel.app

export default function Home() {
  const { isConnected } = useAccount();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState("");
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<{ type: "idle"|"loading"|"error"; msg: string }>({ type: "idle", msg: "" });

  async function loadProviders() {
    setStatus({ type: "loading", msg: "Loading AI providers..." });
    try { setProviders(await listProviders()); setStatus({ type: "idle", msg: "" }); }
    catch (e) { setStatus({ type: "error", msg: (e as Error).message }); }
  }

  async function send() {
    if (!selected || !msg) return setStatus({ type: "error", msg: "Choose a provider and type a message." });
    setStatus({ type: "loading", msg: "Thinking..." });
    try { setReply(await chat(selected, msg)); setStatus({ type: "idle", msg: "" }); }
    catch (e) { setStatus({ type: "error", msg: (e as Error).message }); }
  }

  const busy = status.type === "loading";

  return (
    <main className="min-h-screen px-5 py-16 flex flex-col items-center">
      <div className="text-center mb-12 max-w-lg">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3.5 py-1 text-[11px] text-accent font-bold uppercase tracking-widest mb-5">
          ✦ 0G Decentralized AI
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent mb-3">
          0G AI App
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">${idea}</p>
      </div>

      <div className="mb-8"><ConnectButton /></div>

      {isConnected && (
        <div className="w-full max-w-lg bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 backdrop-blur-xl space-y-5">
          {providers.length === 0 ? (
            <button onClick={loadProviders} disabled={busy}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-[#5B3FDB] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
              {busy ? "⟳  Loading providers..." : "Load AI Providers"}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-success font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              {providers.length} providers available
            </div>
          )}

          {providers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">AI Model</label>
              <select value={selected} onChange={e => setSelected(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white/90 text-sm outline-none focus:border-primary/50 transition-colors appearance-none">
                <option value="">— Choose a model —</option>
                {providers.map(p => <option key={p.provider} value={p.provider}>{p.model} · {p.inputPrice}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Your Message</label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Ask anything..."
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white/90 text-sm placeholder:text-white/25 outline-none focus:border-primary/50 transition-colors resize-y" />
          </div>

          <button onClick={send} disabled={busy}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-[#5B3FDB] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
            {busy ? "⟳  Thinking..." : "→  Send to Decentralized AI"}
          </button>

          {reply && (
            <div className="bg-accent/[0.06] border border-accent/20 rounded-xl p-5">
              <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-3">AI Response</div>
              <p className="text-white/80 text-sm leading-relaxed">{reply}</p>
            </div>
          )}

          {status.msg && (
            <div className={\`p-3 rounded-xl text-sm border \${status.type === "error" ? "bg-error/10 border-error/20 text-error" : "bg-white/5 border-white/10 text-white/50"}\`}>
              {status.msg}
            </div>
          )}
        </div>
      )}

      <p className="mt-12 text-xs text-white/20 text-center">
        Powered by <a href="https://0g.ai">0G Zero Gravity</a>{" · "}
        <a href="https://zaxxie.vercel.app">Built with Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genFullPage(idea: string): string {
  return `"use client";
import { useState, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { uploadFile } from "@/lib/storage";
import { listProviders, chat, type Provider } from "@/lib/compute";

// ${idea}
// Built with Zaxxie — https://zaxxie.vercel.app

type Tab = "storage" | "ai";

export default function Home() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [tab, setTab] = useState<Tab>("storage");
  const [rootHash, setRootHash] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState("");
  const [msg, setMsg] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [status, setStatus] = useState<{ type: "idle"|"loading"|"success"|"error"; msg: string }>({ type: "idle", msg: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function getSigner() {
    if (!walletClient) throw new Error("Wallet not connected");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new BrowserProvider((walletClient as any).transport);
    return provider.getSigner();
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus({ type: "error", msg: "Select a file first." });
    setStatus({ type: "loading", msg: "Uploading to 0G..." });
    try {
      const signer = await getSigner();
      const r = await uploadFile(file, signer);
      setRootHash(r.rootHash);
      setStatus({ type: "success", msg: "Uploaded! Save your root hash." });
    } catch (e) { setStatus({ type: "error", msg: (e as Error).message }); }
  }

  async function handleLoadProviders() {
    setStatus({ type: "loading", msg: "Loading AI providers..." });
    try { setProviders(await listProviders()); setStatus({ type: "idle", msg: "" }); }
    catch (e) { setStatus({ type: "error", msg: (e as Error).message }); }
  }

  async function handleChat() {
    if (!selected || !msg) return setStatus({ type: "error", msg: "Choose a provider and type something." });
    setStatus({ type: "loading", msg: "Thinking..." });
    try { setAiReply(await chat(selected, msg)); setStatus({ type: "idle", msg: "" }); }
    catch (e) { setStatus({ type: "error", msg: (e as Error).message }); }
  }

  const busy = status.type === "loading";
  const statusCls = {
    success: "bg-success/10 border-success/20 text-success",
    error:   "bg-error/10 border-error/20 text-error",
    loading: "bg-white/5 border-white/10 text-white/50",
    idle:    "hidden",
  }[status.type];

  return (
    <main className="min-h-screen px-5 py-16 flex flex-col items-center">
      <div className="text-center mb-10 max-w-lg">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-3.5 py-1 text-[11px] text-primary font-bold uppercase tracking-widest mb-5">
          ◈ Storage + AI on 0G
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent mb-3">
          0G dApp
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">${idea}</p>
      </div>

      <div className="mb-7"><ConnectButton /></div>

      {isConnected && (
        <>
          {/* Tab switcher */}
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 mb-6">
            {(["storage", "ai"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={\`px-6 py-2 rounded-lg text-sm font-bold transition-all \${tab === t ? "bg-primary text-white" : "text-white/40 hover:text-white/70"}\`}>
                {t === "storage" ? "↑ Storage" : "✦ AI Inference"}
              </button>
            ))}
          </div>

          <div className="w-full max-w-lg bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 backdrop-blur-xl space-y-5">
            {tab === "storage" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">File to Upload</label>
                  <div className="bg-white/[0.03] border border-dashed border-white/10 rounded-xl p-4 text-center">
                    <input type="file" ref={fileRef} className="text-white/50 text-sm w-full cursor-pointer" />
                  </div>
                </div>
                <button onClick={handleUpload} disabled={busy}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-[#5B3FDB] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                  {busy ? "⟳  Uploading..." : "↑  Upload to 0G Storage"}
                </button>
                {rootHash && (
                  <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                    <div className="text-[11px] font-bold text-success uppercase tracking-wider mb-2">✓ Root Hash — Save This</div>
                    <code className="text-[11px] text-green-200 break-all leading-relaxed">{rootHash}</code>
                  </div>
                )}
              </>
            )}

            {tab === "ai" && (
              <>
                {providers.length === 0 ? (
                  <button onClick={handleLoadProviders} disabled={busy}
                    className="w-full py-3.5 bg-gradient-to-r from-primary to-[#5B3FDB] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                    {busy ? "⟳  Loading..." : "Load AI Providers"}
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-success font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                      {providers.length} providers available
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">AI Model</label>
                      <select value={selected} onChange={e => setSelected(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white/90 text-sm outline-none appearance-none">
                        <option value="">— Choose a model —</option>
                        {providers.map(p => <option key={p.provider} value={p.provider}>{p.model} · {p.inputPrice}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Your Message</label>
                  <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Ask anything..."
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white/90 text-sm placeholder:text-white/25 outline-none resize-y" />
                </div>
                <button onClick={handleChat} disabled={busy}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-[#5B3FDB] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                  {busy ? "⟳  Thinking..." : "→  Send to Decentralized AI"}
                </button>
                {aiReply && (
                  <div className="bg-accent/[0.06] border border-accent/20 rounded-xl p-5">
                    <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-3">AI Response</div>
                    <p className="text-white/80 text-sm leading-relaxed">{aiReply}</p>
                  </div>
                )}
              </>
            )}

            {status.msg && (
              <div className={\`p-3 rounded-xl text-sm border \${statusCls}\`}>{status.msg}</div>
            )}
          </div>
        </>
      )}

      <p className="mt-12 text-xs text-white/20 text-center">
        Powered by <a href="https://0g.ai">0G Zero Gravity</a>{" · "}
        <a href="https://zaxxie.vercel.app">Built with Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genContract(name: string): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
// 0G Chain — MUST compile with evmVersion: "cancun"

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

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

function genDeploy(name: string): string {
  return `import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(bal), "0G");

  const C = await ethers.getContractFactory("${name}");
  const c = await C.deploy(1_000_000);
  await c.waitForDeployment();

  const addr = await c.getAddress();
  console.log("✅ ${name} deployed:", addr);
  console.log("Explorer:", "https://chainscan-galileo.0g.ai/address/" + addr);
}

main().catch(e => { console.error(e); process.exitCode = 1; });
// npx hardhat run scripts/deploy.ts --network 0g-testnet
`;
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
      evmVersion: "cancun", // REQUIRED for 0G Chain — never skip this
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    "0g-testnet": { url: "https://evmrpc-testnet.0g.ai", chainId: 16602, accounts: [process.env.PRIVATE_KEY!] },
    "0g-mainnet": { url: "https://evmrpc.0g.ai", chainId: 16661, accounts: [process.env.PRIVATE_KEY!] },
  },
  etherscan: {
    apiKey: { "0g-testnet": "placeholder" },
    customChains: [{
      network: "0g-testnet", chainId: 16602,
      urls: { apiURL: "https://chainscan-galileo.0g.ai/open/api", browserURL: "https://chainscan-galileo.0g.ai" },
    }],
  },
};
export default config;
`;
}

// ─── Project builder ──────────────────────────────────────────────────────────

interface ProjectFile { path: string; content: string; }

interface BuildResult {
  projectName: string;
  idea: string;
  features: string[];
  framework: string;
  files: ProjectFile[];
  setup: { createProject: string; installDeps: string; envSetup: string; run: string; };
  steps: string[];
  links: Record<string, string>;
  warnings: string[];
}

function buildProject(name: string, idea: string, features: string[], framework: string): BuildResult {
  const safe = name.replace(/[^a-zA-Z0-9-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "my-0g-dapp";
  const contractName = safe.replace(/-/g, "_").replace(/^[0-9]/, "C").replace(/_+/g, "_");
  const files: ProjectFile[] = [];

  // Core files
  files.push({ path: "package.json", content: genPackageJson(safe, features, framework) });
  files.push({ path: ".env.example", content: genEnv(features) });
  files.push({ path: ".gitignore", content: "node_modules/\n.next/\n.env\n.env.local\ndist/\nartifacts/\ncache/\n" });

  if (framework === "nextjs") {
    files.push({ path: "next.config.mjs", content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nexport default nextConfig;\n` });
    files.push({ path: "tsconfig.json", content: JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom","dom.iterable","esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, paths: { "@/*": ["./*"] } }, include: ["**/*.ts","**/*.tsx"], exclude: ["node_modules"] }, null, 2) });
    files.push({ path: "app/globals.css", content: genGlobalsCss() });
    files.push({ path: "app/layout.tsx", content: genLayoutTsx(safe, idea.slice(0, 100)) });
    files.push({ path: "app/providers.tsx", content: genProvidersTsx(safe) });
    files.push({ path: "tailwind.config.ts", content: genTailwindConfig() });

    const hasStorage = features.includes("storage");
    const hasCompute = features.includes("compute");
    const page = hasStorage && hasCompute ? genFullPage(idea) : hasCompute ? genComputePage(idea) : genStoragePage(idea);
    files.push({ path: "app/page.tsx", content: page });

    if (hasStorage) files.push({ path: "lib/storage.ts", content: genStorageLib() });
    if (hasCompute) files.push({ path: "lib/compute.ts", content: genComputeLib() });
  }

  if (features.includes("chain") || features.includes("infts")) {
    files.push({ path: "hardhat.config.ts", content: genHardhatConfig() });
    files.push({ path: `contracts/${contractName}.sol`, content: genContract(contractName) });
    files.push({ path: "scripts/deploy.ts", content: genDeploy(contractName) });
  }

  // Build install command
  const pkgs = ["ethers", "dotenv"];
  if (features.includes("storage")) pkgs.push("@0gfoundation/0g-ts-sdk");
  if (features.includes("compute")) pkgs.push("@0glabs/0g-serving-broker", "openai");
  if (framework === "nextjs") pkgs.push("next", "react", "react-dom");

  const devPkgs = ["typescript", "@types/node"];
  if (framework === "nextjs") devPkgs.push("@types/react");
  if (features.includes("chain") || features.includes("infts")) devPkgs.push("hardhat", "@nomicfoundation/hardhat-toolbox", "@openzeppelin/contracts");

  const create = framework === "nextjs"
    ? `npx create-next-app@latest ${safe} --typescript --app --tailwind --import-alias "@/*" --no-src-dir`
    : `mkdir ${safe} && cd ${safe} && npm init -y`;

  return {
    projectName: safe,
    idea,
    features,
    framework,
    files,
    setup: {
      createProject: create,
      installDeps: `npm install ${pkgs.join(" ")}\nnpm install --save-dev ${devPkgs.join(" ")}`,
      envSetup: "cp .env.example .env\n# Edit .env — paste your MetaMask private key into PRIVATE_KEY",
      run: framework === "nextjs" ? "npm run dev\n# Open http://localhost:3000"
        : features.includes("chain") ? "npx hardhat compile\nnpx hardhat run scripts/deploy.ts --network 0g-testnet"
        : "npm run dev",
    },
    steps: [
      "1. Install Node.js 18+ from https://nodejs.org",
      "2. Install MetaMask from https://metamask.io",
      "3. Run setup.createProject in your terminal",
      "4. Copy all generated files into the project folder",
      "5. Run setup.installDeps",
      "6. Run setup.envSetup — add your MetaMask private key",
      "7. Get free testnet tokens at https://faucet.0g.ai (need 0G for gas)",
      "8. Run setup.run to start your dApp",
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
    warnings: [
      "ALWAYS set evmVersion: 'cancun' for Solidity on 0G Chain",
      "ethers must be installed as a peer dep alongside 0G SDKs",
      "Storage: call file.close() after upload; save the root hash",
      "Compute: request headers are single-use — call getRequestHeaders() per request",
      "Testnet Chain ID: 16602 | Mainnet Chain ID: 16661",
    ],
  };
}

// ─── MCP handler ─────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {

    // ══════════════════════════════════════════════════════
    // TIER 1
    // ══════════════════════════════════════════════════════

    // 1. BUILD — structured file output
    server.registerTool("zaxxie_build", {
      title: "Build a 0G dApp",
      description: "MAIN TOOL. Takes any plain-English idea, auto-detects 0G features, and returns a structured JSON with every file (path + complete content), install commands, and numbered steps. Claude Code should write each file in the 'files' array directly to disk. Works for storage apps, AI chatbots, smart contracts, NFTs, full-stack dApps — anything on 0G.",
      inputSchema: {
        idea: z.string().describe("What to build, in plain English"),
        projectName: z.string().default("my-0g-dapp").describe("Project folder name — auto-generated from idea if omitted"),
        features: z.array(z.enum(["chain","storage","compute","da","infts"])).optional().describe("0G features — auto-detected from idea if omitted"),
        framework: z.enum(["nextjs","react","express","hardhat","custom"]).default("nextjs").describe("Framework"),
      },
    }, async ({ idea, projectName, features, framework }) => {
      const f = features?.length ? features : detectFeatures(idea);
      const n = projectName !== "my-0g-dapp" ? projectName
        : idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "my-0g-dapp";
      return { content: [{ type: "text", text: JSON.stringify(buildProject(n, idea, f, framework), null, 2) }] };
    });

    // 2. CHECK WALLET — live balance
    server.registerTool("zaxxie_check_wallet", {
      title: "Check 0G Wallet",
      description: "Live wallet balance and transaction count from the 0G RPC. Returns balance in 0G, faucet links if empty, and explorer URL. Use before deploying or uploading.",
      inputSchema: {
        address: z.string().describe("Wallet address (0x...)"),
        network: z.enum(["testnet","mainnet"]).default("testnet"),
      },
    }, async ({ address, network }) => {
      try {
        const [balHex, txHex] = await Promise.all([
          rpc(network, "eth_getBalance", [address, "latest"]) as Promise<string>,
          rpc(network, "eth_getTransactionCount", [address, "latest"]) as Promise<string>,
        ]);
        const balance = hexToEth(balHex);
        const txCount = hexToInt(txHex);
        const wei = BigInt(balHex ?? "0x0");
        const canDeploy = wei >= BigInt(1e15);
        return { content: [{ type: "text", text: JSON.stringify({
          address, network, chainId: CHAIN_ID[network],
          balance: `${balance} 0G`, txCount,
          canDeploy, needsTokens: wei === BigInt(0),
          explorerUrl: `${EXPLORER[network]}/address/${address}`,
          ...(wei === BigInt(0) && network === "testnet" ? {
            faucet: "https://faucet.0g.ai",
            googleFaucet: "https://cloud.google.com/application/web3/faucet/0g/galileo",
            tip: "Get 0.1 free 0G at https://faucet.0g.ai — needed to pay gas fees",
          } : {}),
        }, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: (e as Error).message, rpc: RPC[network] }) }] };
      }
    });

    // 3. CHECK TX — live transaction status
    server.registerTool("zaxxie_check_tx", {
      title: "Check Transaction",
      description: "Live transaction status from 0G — confirmed/pending/failed, gas used, block number, contract address if it was a deploy, and explorer link.",
      inputSchema: {
        txHash: z.string().describe("Transaction hash (0x...)"),
        network: z.enum(["testnet","mainnet"]).default("testnet"),
      },
    }, async ({ txHash, network }) => {
      try {
        const [receipt, tx] = await Promise.all([
          rpc(network, "eth_getTransactionReceipt", [txHash]),
          rpc(network, "eth_getTransactionByHash", [txHash]),
        ]) as [Record<string,string> | null, Record<string,string> | null];

        if (!receipt && !tx)
          return { content: [{ type: "text", text: JSON.stringify({ txHash, status: "not_found", message: "Not found — check the hash or wait a moment if just sent." }) }] };
        if (!receipt)
          return { content: [{ type: "text", text: JSON.stringify({ txHash, status: "pending", from: tx?.from, to: tx?.to, message: "Transaction is pending." }) }] };

        const success = receipt.status === "0x1";
        const result: Record<string, unknown> = {
          txHash, network, status: success ? "✅ confirmed" : "❌ failed",
          blockNumber: hexToInt(receipt.blockNumber),
          gasUsed: hexToInt(receipt.gasUsed),
          from: receipt.from, to: receipt.to,
          explorerUrl: `${EXPLORER[network]}/tx/${txHash}`,
        };
        if (receipt.contractAddress) {
          result.contractAddress = receipt.contractAddress;
          result.contractExplorer = `${EXPLORER[network]}/address/${receipt.contractAddress}`;
          result.message = `Contract deployed at ${receipt.contractAddress}`;
        } else {
          result.message = success ? "Transaction confirmed" : "Transaction failed — check gas or contract logic";
        }
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: (e as Error).message }) }] };
      }
    });

    // 4. LIVE DOCS — fetch from docs.0g.ai
    server.registerTool("zaxxie_live_docs", {
      title: "Fetch Live 0G Docs",
      description: "Fetch the latest documentation directly from docs.0g.ai. Use when you need up-to-date SDK versions, contract addresses, or API changes. Falls back to cached knowledge on failure.",
      inputSchema: {
        topic: z.enum(["storage","compute","chain","da","network","zero-coding"]).describe("Topic to fetch"),
      },
    }, async ({ topic }) => {
      const urls: Record<string, string> = {
        storage:       "https://docs.0g.ai/build-with-0g/storage",
        compute:       "https://docs.0g.ai/build-with-0g/compute-network/sdk",
        chain:         "https://docs.0g.ai/build-with-0g/chain",
        da:            "https://docs.0g.ai/build-with-0g/da",
        network:       "https://docs.0g.ai/build-with-0g/network-endpoints",
        "zero-coding": "https://build.0g.ai/zero-coding/",
      };
      const url = urls[topic];
      // Check KV cron cache first (populated by /api/cron nightly)
      if (KV_CONFIGURED && topic !== "zero-coding") {
        try {
          const cached = await memGet<string>(`zaxxie:docs:${topic}`);
          if (cached) {
            const lastRefresh = await memGet<string>("zaxxie:docs:last_refresh");
            return { content: [{ type: "text", text: JSON.stringify({
              source: "kv-cache", topic, url,
              cachedAt: lastRefresh ?? "unknown",
              content: cached,
            }, null, 2) }] };
          }
        } catch { /* fall through to live fetch */ }
      }

      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Zaxxie-MCP/4.0 zaxxie.vercel.app" },
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#\d+;/g, " ")
          .replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 8000);
        return { content: [{ type: "text", text: JSON.stringify({ source: "live", topic, url, content: text }, null, 2) }] };
      } catch (e) {
        const fallback = buildDocs(topic === "zero-coding" ? "all" : topic);
        return { content: [{ type: "text", text: JSON.stringify({ source: "cached-static", topic, fetchError: (e as Error).message, content: fallback }) }] };
      }
    });

    // ══════════════════════════════════════════════════════
    // TIER 2
    // ══════════════════════════════════════════════════════

    // 5. FAUCET — get testnet tokens
    server.registerTool("zaxxie_faucet", {
      title: "Get Testnet Tokens",
      description: "Check if a wallet needs testnet tokens and provide exact faucet instructions. Checks the live balance first — if already funded, confirms they're ready to build.",
      inputSchema: {
        address: z.string().describe("Wallet address (0x...)"),
      },
    }, async ({ address }) => {
      try {
        const balHex = await rpc("testnet", "eth_getBalance", [address, "latest"]) as string;
        const balance = hexToEth(balHex);
        const wei = BigInt(balHex ?? "0x0");
        const hasFunds = wei >= BigInt(1e16); // >= 0.01 0G

        return { content: [{ type: "text", text: JSON.stringify({
          address, network: "Galileo Testnet", chainId: 16602,
          currentBalance: `${balance} 0G`,
          status: hasFunds ? "✅ Ready — you have enough 0G to build" : "⚠️ Needs tokens",
          ...(hasFunds ? {} : {
            instructions: {
              step1: { label: "Option A — Official Faucet (easiest)", url: "https://faucet.0g.ai", action: "Paste your address → complete captcha → receive 0.1 0G" },
              step2: { label: "Option B — Google Cloud Faucet", url: "https://cloud.google.com/application/web3/faucet/0g/galileo", action: "Sign in with Google → paste address → receive tokens" },
              step3: { label: "Need more? Join Discord", url: "https://discord.gg/0glabs", action: "Ask in #faucet channel for extra tokens" },
              limit: "0.1 0G per wallet per day — enough for dozens of transactions",
            },
          }),
          explorerUrl: `${EXPLORER.testnet}/address/${address}`,
        }, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: (e as Error).message, faucet: "https://faucet.0g.ai" }) }] };
      }
    });

    // 6. VERIFY CONTRACT — check on explorer
    server.registerTool("zaxxie_verify_contract", {
      title: "Verify Contract on 0G",
      description: "Check if a smart contract is verified on the 0G explorer and return its ABI if available. Also returns the hardhat verify command if not yet verified.",
      inputSchema: {
        address: z.string().describe("Contract address (0x...)"),
        network: z.enum(["testnet","mainnet"]).default("testnet"),
      },
    }, async ({ address, network }) => {
      try {
        // Check if contract exists on-chain
        const code = await rpc(network, "eth_getCode", [address, "latest"]) as string;
        if (!code || code === "0x") {
          return { content: [{ type: "text", text: JSON.stringify({ address, error: "No contract found at this address on " + network, explorerUrl: `${EXPLORER[network]}/address/${address}` }) }] };
        }

        // Try the chainscan API for verification info
        const apiBase = network === "testnet"
          ? "https://chainscan-galileo.0g.ai/open/api"
          : "https://chainscan.0g.ai/open/api";

        let verificationInfo: Record<string, unknown> = { verified: false };
        try {
          const apiRes = await fetch(`${apiBase}?module=contract&action=getsourcecode&address=${address}`, {
            signal: AbortSignal.timeout(6_000),
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data?.result?.[0]?.ABI && data.result[0].ABI !== "Contract source code not verified") {
              verificationInfo = { verified: true, contractName: data.result[0].ContractName, abi: data.result[0].ABI, sourceCode: data.result[0].SourceCode ? "available" : "not available" };
            }
          }
        } catch { /* explorer API optional */ }

        return { content: [{ type: "text", text: JSON.stringify({
          address, network, onChain: true,
          bytecodeSize: Math.floor((code.length - 2) / 2) + " bytes",
          ...verificationInfo,
          explorerUrl: `${EXPLORER[network]}/address/${address}`,
          ...(!verificationInfo.verified ? {
            verifyCommand: `npx hardhat verify ${address} --network 0g-${network}`,
            note: "Run this in your project directory after npx hardhat compile",
          } : {}),
        }, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: (e as Error).message }) }] };
      }
    });

    // 7. PREFLIGHT — health check before building/deploying
    server.registerTool("zaxxie_preflight", {
      title: "Pre-Deploy Health Check",
      description: "Run a complete health check before building or deploying — checks wallet balance, RPC connectivity, storage indexer, and compute marketplace. Returns go/no-go for each with fix instructions.",
      inputSchema: {
        walletAddress: z.string().describe("Your wallet address (0x...)"),
        features: z.array(z.enum(["chain","storage","compute","da","infts"])).describe("What you're about to build"),
        network: z.enum(["testnet","mainnet"]).default("testnet"),
      },
    }, async ({ walletAddress, features, network }) => {
      const checks: Record<string, unknown> = {};
      let allGood = true;

      // Check RPC
      try {
        const block = await rpc(network, "eth_blockNumber", []) as string;
        checks.rpc = { status: "✅", message: `Connected — block ${hexToInt(block)}`, url: RPC[network] };
      } catch (e) {
        checks.rpc = { status: "❌", message: (e as Error).message, url: RPC[network] };
        allGood = false;
      }

      // Check wallet balance
      try {
        const balHex = await rpc(network, "eth_getBalance", [walletAddress, "latest"]) as string;
        const balance = hexToEth(balHex);
        const wei = BigInt(balHex ?? "0x0");
        const ok = wei >= BigInt(1e16);
        checks.wallet = { status: ok ? "✅" : "⚠️", balance: `${balance} 0G`, canDeploy: ok, address: walletAddress, ...(!ok ? { fix: "Get tokens at https://faucet.0g.ai" } : {}) };
        if (!ok) allGood = false;
      } catch (e) {
        checks.wallet = { status: "❌", message: (e as Error).message };
        allGood = false;
      }

      // Check storage indexer
      if (features.includes("storage")) {
        try {
          const res = await fetch(INDEXER[network], { method: "HEAD", signal: AbortSignal.timeout(5_000) });
          checks.storageIndexer = { status: res.ok || res.status < 500 ? "✅" : "⚠️", url: INDEXER[network], httpStatus: res.status };
        } catch (e) {
          checks.storageIndexer = { status: "⚠️", message: (e as Error).message, url: INDEXER[network], note: "Indexer may still work — HEAD requests sometimes rejected" };
        }
      }

      // Check compute marketplace
      if (features.includes("compute")) {
        try {
          const res = await fetch("https://compute-marketplace.0g.ai/inference", { method: "HEAD", signal: AbortSignal.timeout(5_000) });
          checks.compute = { status: res.ok || res.status < 500 ? "✅" : "⚠️", url: "https://compute-marketplace.0g.ai/inference" };
        } catch (e) {
          checks.compute = { status: "⚠️", message: (e as Error).message };
        }
      }

      return { content: [{ type: "text", text: JSON.stringify({
        summary: allGood ? "✅ All checks passed — ready to build!" : "⚠️ Some checks need attention",
        network, chainId: CHAIN_ID[network], checks,
        nextStep: allGood ? "Run zaxxie_build with your idea" : "Fix the issues above, then run zaxxie_preflight again",
      }, null, 2) }] };
    });

    // ══════════════════════════════════════════════════════
    // TIER 3
    // ══════════════════════════════════════════════════════

    // 8. DEPLOY CONTRACT — server-side deployment with optional inline compilation
    server.registerTool("zaxxie_deploy_contract", {
      title: "Deploy Contract to 0G",
      description: "Deploy a smart contract directly to 0G testnet. Two modes: (A) paste raw Solidity source → Zaxxie compiles + deploys in one step — no local tooling needed; (B) provide pre-compiled ABI + bytecode. Returns contract address, tx hash, and explorer link. TESTNET ONLY.",
      inputSchema: {
        privateKey: z.string().describe("Your private key (0x...) — TESTNET ONLY, never use mainnet key here"),
        soliditySource: z.string().optional().describe("Raw Solidity source code — Zaxxie compiles it server-side (recommended, no local tools needed)"),
        abi: z.string().optional().describe("Pre-compiled ABI as JSON string — only needed if NOT using soliditySource"),
        bytecode: z.string().optional().describe("Pre-compiled bytecode (0x...) — only needed if NOT using soliditySource"),
        constructorArgs: z.array(z.union([z.string(), z.number(), z.boolean()])).default([]).describe("Constructor arguments in order"),
        contractName: z.string().default("Contract").describe("Contract name — auto-detected from source if using soliditySource"),
        walletAddress: z.string().optional().describe("Your wallet address — if provided, deployed contract is saved to memory"),
      },
    }, async ({ privateKey, soliditySource, abi, bytecode, constructorArgs, contractName, walletAddress }) => {
      const network = "testnet" as const;
      try {
        if (!privateKey.startsWith("0x") || privateKey.length < 64)
          throw new Error("Invalid private key — must start with 0x and be 64+ hex chars");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedAbi: any[];
        let finalBytecode: string;
        let finalName = contractName;

        if (soliditySource) {
          // Mode A: compile on-server with solc-js
          const compiled = await compileSolidity(soliditySource);
          parsedAbi = compiled.abi as typeof parsedAbi;
          finalBytecode = compiled.bytecode;
          finalName = compiled.contractName;
        } else {
          // Mode B: pre-compiled ABI + bytecode
          if (!abi) throw new Error("Provide either soliditySource (recommended) or both abi + bytecode");
          if (!bytecode?.startsWith("0x")) throw new Error("Bytecode must start with 0x");
          try { parsedAbi = JSON.parse(abi); }
          catch { throw new Error("Invalid ABI — must be valid JSON"); }
          finalBytecode = bytecode;
        }

        const provider = new ethers.JsonRpcProvider(RPC[network]);
        const wallet = new ethers.Wallet(privateKey, provider);

        const balance = await provider.getBalance(wallet.address);
        if (balance < BigInt(1e15))
          throw new Error(`Insufficient balance: ${ethers.formatEther(balance)} 0G. Get tokens at https://faucet.0g.ai`);

        const factory = new ethers.ContractFactory(parsedAbi, finalBytecode, wallet);
        const contract = await factory.deploy(...constructorArgs);
        await contract.waitForDeployment();

        const address = await contract.getAddress();
        const txHash = contract.deploymentTransaction()?.hash ?? "";

        // Auto-save to memory if wallet address provided
        if (walletAddress) {
          await appendMemory(walletAddress, "contracts", {
            label: finalName,
            data: { address, txHash, network: "testnet", chainId: 16602, explorerUrl: `${EXPLORER[network]}/address/${address}` },
            createdAt: new Date().toISOString(),
          });
        }

        return { content: [{ type: "text", text: JSON.stringify({
          success: true,
          contractName: finalName,
          address,
          txHash,
          compiledOnServer: !!soliditySource,
          network: "Galileo Testnet",
          chainId: 16602,
          explorerUrl: `${EXPLORER[network]}/address/${address}`,
          txUrl: `${EXPLORER[network]}/tx/${txHash}`,
          verifyCommand: `npx hardhat verify ${address} --network 0g-testnet`,
          message: `✅ ${finalName} deployed at ${address}${soliditySource ? " (compiled + deployed server-side)" : ""}`,
        }, null, 2) }] };
      } catch (e) {
        const msg = (e as Error).message;
        return { content: [{ type: "text", text: JSON.stringify({
          success: false, error: msg,
          tip: msg.includes("Compilation failed") ? "Check your Solidity source for syntax errors. Note: inline compilation does not support external imports like @openzeppelin — use zaxxie_build to generate a full Hardhat project instead"
            : msg.includes("insufficient") ? "Get tokens at https://faucet.0g.ai"
            : msg.includes("bytecode") ? "Bytecode is empty — contract may be abstract. Add soliditySource instead."
            : "Run zaxxie_troubleshoot with this error for help",
          hint: "Try passing soliditySource instead of abi+bytecode — Zaxxie compiles it for you",
        }) }] };
      }
    });

    // ══════════════════════════════════════════════════════
    // CORE TOOLS
    // ══════════════════════════════════════════════════════

    // 9. ONBOARD
    server.registerTool("zaxxie_onboard", {
      title: "0G Onboarding Guide",
      description: "Complete beginner guide — MetaMask install, add 0G network to MetaMask, get testnet tokens, export private key. Use when a user has no wallet or doesn't know how to get started.",
      inputSchema: {
        step: z.enum(["all","metamask","network","faucet","verify"]).default("all"),
      },
    }, async ({ step }) => {
      const s = {
        metamask: `STEP 1 — Install MetaMask\n${"─".repeat(40)}\n1. Go to https://metamask.io/download\n2. Click "Install MetaMask for Chrome"\n3. Click the fox icon in your browser toolbar → "Create a new wallet"\n4. Set a strong password\n5. WRITE DOWN your 12-word Secret Recovery Phrase on paper — never digital\n6. Confirm your phrase → Done\n\nYour wallet address looks like: 0x1a2b3c...`,
        network: `STEP 2 — Add 0G Network to MetaMask\n${"─".repeat(40)}\nOption A — Automatic (recommended):\n  Go to https://chainlist.org/?search=0g\n  Find "0G Galileo Testnet" → Add to MetaMask → Approve\n\nOption B — Manual:\n  MetaMask → network dropdown → Add network → Add manually\n  Network Name: 0G-Galileo-Testnet\n  RPC URL:      https://evmrpc-testnet.0g.ai\n  Chain ID:     16602\n  Symbol:       0G\n  Explorer:     https://chainscan-galileo.0g.ai`,
        faucet: `STEP 3 — Get Free Testnet Tokens\n${"─".repeat(40)}\nOption A: https://faucet.0g.ai\n  → Paste your wallet address → Complete captcha → Receive 0.1 0G\n\nOption B: https://cloud.google.com/application/web3/faucet/0g/galileo\n  → Sign in with Google → Paste address → Receive tokens\n\nLimit: 0.1 0G per wallet per day\nNeed more? Discord: https://discord.gg/0glabs → #faucet`,
        verify: `STEP 4 — Verify Everything Works\n${"─".repeat(40)}\n1. Open MetaMask — confirm you're on "0G-Galileo-Testnet" (Chain ID 16602)\n2. You should see ~0.1 0G balance\n3. Check on explorer: https://chainscan-galileo.0g.ai → paste your address\n\nGet your private key (needed for SDK & Zaxxie):\n  MetaMask → click your account → three dots → Account Details → Show private key\n  ⚠️ NEVER share this key or commit it to git`,
      };
      const keys = step === "all" ? ["metamask","network","faucet","verify"] : [step];
      return { content: [{ type: "text", text: keys.map(k => s[k as keyof typeof s]).join("\n\n") + "\n\n✅ Ready to build! Tell Zaxxie what you want to create." }] };
    });

    // 10. TROUBLESHOOT
    server.registerTool("zaxxie_troubleshoot", {
      title: "Troubleshoot 0G Issues",
      description: "Diagnose and fix common errors building on 0G — EVM version, missing deps, storage failures, compute issues, gas errors, deploy failures.",
      inputSchema: {
        error: z.string().describe("The error message or description of the problem"),
      },
    }, async ({ error }) => {
      const s = error.toLowerCase();
      const fixes: string[] = [`Error: "${error}"\n`];

      if (/evm.version|opcode|invalid opcode|cancun|shanghai/.test(s))
        fixes.push(`FIX — Wrong EVM Version\nAdd to hardhat.config.ts:\n  settings: { evmVersion: "cancun" }  // REQUIRED\nWith Foundry: forge create --evm-version cancun ...`);
      if (/peer dep|cannot find module|resolve|missing|ethers/.test(s))
        fixes.push(`FIX — Missing Dependency\nnpm install ethers@^6.13.4\nAll 0G SDKs require ethers as a peer dependency.`);
      if (/mixed content|http.*https|insecure.*request|blocked.*content/.test(s))
        fixes.push(`FIX — Mixed Content (HTTP vs HTTPS)\nYour page is served over HTTPS but the storage indexer URL is HTTP — browsers block this.\n\n1. Change your indexer URL from http:// to https://:\n   ❌ http://indexer-storage-testnet-turbo.0g.ai\n   ✅ https://indexer-storage-testnet-turbo.0g.ai\n\n2. In your .env / next.config.mjs, ensure:\n   NEXT_PUBLIC_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai\n\n3. In your storage lib:\n   const INDEXER_RPC = "https://indexer-storage-testnet-turbo.0g.ai" // must be https\n\nThis blocks ALL uploads — fix this first before debugging the mint error.`);

      if (/ses removing|unpermitted intrinsics|lockdown|metamask.*ses/.test(s))
        fixes.push(`FIX — SES / MetaMask Lockdown\n"SES Removing unpermitted intrinsics" is MetaMask's security sandbox running in the browser.\nThis is informational — not an error that breaks your app.\n\nIf it IS causing issues:\n1. Avoid using non-standard globals (Buffer, process, global) in browser code\n2. Use the browser-safe 0G SDK subpath:\n   import { Blob as ZgBlob, Indexer } from "@0gfoundation/0g-ts-sdk/browser"\n3. Polyfill if needed in next.config.mjs:\n   webpack: (config) => { config.resolve.fallback = { buffer: require.resolve("buffer/") }; return config; }`);

      if (/missing revert data|estimategas.*call_exception|call_exception.*estimategas|revert=null.*estimategas/.test(s))
        fixes.push(`FIX — estimateGas CALL_EXCEPTION (missing revert data)\nThe contract reverted BEFORE the transaction was broadcast — gas estimation failed.\nThis means a pre-condition in the contract was not met.\n\nMost common causes:\n1. Metadata upload to 0G Storage failed before mint was called\n   → rootHash is empty/invalid → contract rejects it\n   → FIX: Check "metadata upload failed" error first. Usually a Mixed Content (HTTP vs HTTPS) issue.\n\n2. Insufficient allowance or balance\n   → FIX: Check wallet balance with zaxxie_check_wallet\n\n3. Contract already has this token / state conflict\n   → FIX: Check if the token was already minted\n\n4. Wrong contract address or ABI mismatch\n   → FIX: Verify contract with zaxxie_verify_contract\n\nDebug order: fix upload first → then retry mint. The tx hash will only exist after gas estimation passes.`);

      if (/mint.*metadata.*upload.*fail|metadata.*upload.*fail.*mint|upload failed.*mint|inft.*upload|mintinft.*error/.test(s))
        fixes.push(`FIX — INFT Mint: Metadata Upload Failed Before Mint\nThe mint flow is: upload metadata to 0G Storage → get rootHash → call mintINFT(rootHash)\nIf the upload fails, rootHash is empty and the contract call will always revert.\n\nStep-by-step fix:\n1. Fix the upload error first (usually Mixed Content — indexer URL must be HTTPS)\n2. Add error handling in your mint function:\n   const uploadResult = await uploadMetadata(metadata);\n   if (!uploadResult.rootHash) throw new Error("Upload failed — do not proceed to mint");\n3. Log the rootHash before minting:\n   console.log("rootHash:", uploadResult.rootHash); // must not be empty\n4. Only call mintINFT after confirming rootHash is valid (non-empty 0x... string)\n\nIndexer URLs (must be HTTPS):\n  Testnet: https://indexer-storage-testnet-turbo.0g.ai\n  Mainnet: https://indexer-storage-turbo.0g.ai`);

      if (/upload|storage|indexer|merkle|zgblob|zgfile|0g-ts-sdk/.test(s))
        fixes.push(`FIX — Storage\n1. Indexer URL MUST be HTTPS (browsers block HTTP from HTTPS pages):\n   ✅ https://indexer-storage-testnet-turbo.0g.ai\n2. Use browser SDK in Next.js:\n   import { Blob as ZgBlob, Indexer } from "@0gfoundation/0g-ts-sdk/browser"\n3. Mainnet indexer: https://indexer-storage-turbo.0g.ai\n4. Always check upload result before using rootHash\n5. Get tokens: https://faucet.0g.ai`);
      if (/insufficient|balance|gas|fee|funds/.test(s))
        fixes.push(`FIX — No Balance\nhttps://faucet.0g.ai — 0.1 0G free per day\nhttps://cloud.google.com/application/web3/faucet/0g/galileo\nCheck balance: https://chainscan-galileo.0g.ai`);
      if (/private key|signer|wallet|account/.test(s))
        fixes.push(`FIX — Private Key\nMetaMask → Account → 3-dot menu → Account Details → Export Private Key\n.env: PRIVATE_KEY=0xYOUR_KEY (must start with 0x)\nCode: new ethers.Wallet(process.env.PRIVATE_KEY!, provider)`);
      if (/network|chain id|rpc|connect|timeout|econnref/.test(s))
        fixes.push(`FIX — Network\nTestnet: https://evmrpc-testnet.0g.ai  (Chain ID 16602)\nMainnet: https://evmrpc.0g.ai          (Chain ID 16661)\nStorage testnet: https://indexer-storage-testnet-turbo.0g.ai\nStorage mainnet: https://indexer-storage-turbo.0g.ai`);
      if (/compute|broker|inference|bearer|secret|provider|serving/.test(s))
        fixes.push(`FIX — Compute / AI\n1. Fund: await broker.ledger.addLedger("0.1")\n2. Headers are SINGLE-USE — call getRequestHeaders() before every request\n3. Always call processResponse() after getting AI reply\n4. Get provider address: https://compute-marketplace.0g.ai/inference`);
      if (/deploy|contract|verify|hardhat|artifact|bytecode/.test(s))
        fixes.push(`FIX — Contract Deploy\n1. npx hardhat compile\n2. evmVersion: "cancun" in hardhat.config.ts — critical\n3. npx hardhat run scripts/deploy.ts --network 0g-testnet\n4. npx hardhat verify ADDR --network 0g-testnet\nBytecode/ABI: artifacts/contracts/YourContract.sol/YourContract.json`);

      if (fixes.length === 1)
        fixes.push(`No match. Common 0G issues:\n1. evmVersion: "cancun" in hardhat.config — always\n2. npm install ethers@^6.13.4\n3. Tokens: https://faucet.0g.ai\n4. Testnet RPC: https://evmrpc-testnet.0g.ai (chain 16602)\n5. Storage indexer: https://indexer-storage-testnet-turbo.0g.ai\nHelp: https://discord.gg/0glabs`);

      return { content: [{ type: "text", text: fixes.join("\n\n") }] };
    });

    // 11. GET DOCS
    server.registerTool("zaxxie_get_docs", {
      title: "Get 0G Docs",
      description: "Complete 0G documentation from cached knowledge — chain, storage, compute, da, infts, network, or all.",
      inputSchema: {
        topic: z.enum(["chain","storage","compute","da","infts","network","all"]),
      },
    }, async ({ topic }) => {
      const cacheKey = `docs:${topic}`;
      const hit = cacheGet(cacheKey);
      if (hit) return { content: [{ type: "text", text: hit }] };
      const result = buildDocs(topic);
      cacheSet(cacheKey, result, 5 * 60_000); // 5 min TTL
      return { content: [{ type: "text", text: result }] };
    });

    // 12. SCAFFOLD
    server.registerTool("zaxxie_scaffold", {
      title: "Scaffold 0G Project",
      description: "Generate a complete 0G project scaffold — same structured output as zaxxie_build but without idea auto-detection.",
      inputSchema: {
        projectName: z.string(),
        description: z.string(),
        features: z.array(z.enum(["chain","storage","compute","da","infts"])),
        framework: z.enum(["nextjs","react","express","hardhat","custom"]).default("nextjs"),
      },
    }, async ({ projectName, description, features, framework }) => {
      return { content: [{ type: "text", text: JSON.stringify(buildProject(projectName, description, features, framework), null, 2) }] };
    });

    // 13. NETWORK
    server.registerTool("zaxxie_network", {
      title: "0G Network Info",
      description: "RPCs, chain IDs, storage indexers, contract addresses, faucets, explorer URLs for testnet and mainnet.",
      inputSchema: {
        network: z.enum(["testnet","mainnet","both"]).default("testnet"),
      },
    }, async ({ network }) => {
      const cacheKey = `network:${network}`;
      const hit = cacheGet(cacheKey);
      if (hit) return { content: [{ type: "text", text: hit }] };
      const info: Record<string, unknown> = {};
      if (network !== "mainnet") info.testnet = OG_KNOWLEDGE.networks.testnet;
      if (network !== "testnet") info.mainnet = OG_KNOWLEDGE.networks.mainnet;
      info.sdks = OG_KNOWLEDGE.sdks;
      info.links = OG_KNOWLEDGE.links;
      const result = JSON.stringify(info, null, 2);
      cacheSet(cacheKey, result, 10 * 60_000); // 10 min TTL — static data
      return { content: [{ type: "text", text: result }] };
    });

    // 14. MODELS
    server.registerTool("zaxxie_models", {
      title: "0G AI Models",
      description: "Available AI models on 0G Compute with pricing — LLMs, text-to-image, speech-to-text.",
      inputSchema: {
        network: z.enum(["testnet","mainnet","both"]).default("both"),
      },
    }, async ({ network }) => {
      const cacheKey = `models:${network}`;
      const hit = cacheGet(cacheKey);
      if (hit) return { content: [{ type: "text", text: hit }] };
      const info: Record<string, unknown> = {};
      if (network !== "mainnet") info.testnet = OG_KNOWLEDGE.compute.services.testnet;
      if (network !== "testnet") info.mainnet = OG_KNOWLEDGE.compute.services.mainnet;
      info.marketplace = OG_KNOWLEDGE.networks.testnet.computeMarketplace;
      info.note = "OpenAI-compatible API. Get Bearer token: 0g-compute-cli inference get-secret --provider <ADDR>";
      const result = JSON.stringify(info, null, 2);
      cacheSet(cacheKey, result, 10 * 60_000);
      return { content: [{ type: "text", text: result }] };
    });

    // ══════════════════════════════════════════════════════
    // TIER 1 — NEW TOOLS
    // ══════════════════════════════════════════════════════

    // 15. UPLOAD — server-side file upload to 0G Storage
    server.registerTool("zaxxie_upload", {
      title: "Upload File to 0G Storage",
      description: "Server-side file upload — provide base64 file content and your private key. Zaxxie uploads directly to 0G decentralized storage from the server and returns the root hash. No browser, no local tools, no npm needed. Root hash is auto-saved to memory if walletAddress is provided.",
      inputSchema: {
        content: z.string().describe("Base64-encoded file content — use btoa() in browser or Buffer.from(data).toString('base64') in Node"),
        filename: z.string().describe("File name with extension (e.g. whitepaper.pdf, photo.png, data.json)"),
        privateKey: z.string().describe("Your private key (0x...) — used to sign the upload transaction"),
        network: z.enum(["testnet", "mainnet"]).default("testnet"),
        walletAddress: z.string().optional().describe("Your wallet address — if provided, root hash is saved to memory"),
        projectLabel: z.string().optional().describe("Label for this upload in memory (e.g. 'project whitepaper')"),
      },
    }, async ({ content, filename, privateKey, network, walletAddress, projectLabel }) => {
      try {
        if (!privateKey.startsWith("0x") || privateKey.length < 64)
          throw new Error("Invalid private key — must start with 0x and be 64+ hex chars");

        // Write base64 content to a temp file for the SDK
        const os = await import("os");
        const fs = await import("fs");
        const path = await import("path");
        const tmpPath = path.join(os.tmpdir(), `zaxxie-${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`);

        const buf = Buffer.from(content, "base64");
        fs.writeFileSync(tmpPath, buf);

        try {
          const { ZgFile, Indexer } = await import("@0gfoundation/0g-ts-sdk");
          const provider = new ethers.JsonRpcProvider(RPC[network]);
          const wallet = new ethers.Wallet(privateKey, provider);

          // Check balance first
          const balance = await provider.getBalance(wallet.address);
          if (balance < BigInt(1e15))
            throw new Error(`Insufficient balance: ${ethers.formatEther(balance)} 0G. Get tokens at https://faucet.0g.ai`);

          // SDK returns tuple [ZgFile|null, err|null] — cast to any to handle SDK type mismatch
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fromPathResult = await (ZgFile.fromFilePath(tmpPath) as any);
          const [zgFile, fileErr] = Array.isArray(fromPathResult) ? fromPathResult : [fromPathResult, null];
          if (fileErr || !zgFile) throw new Error(`File preparation failed: ${fileErr}`);

          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const merkleResult = await (zgFile.merkleTree() as any);
            const [tree, treeErr] = Array.isArray(merkleResult) ? merkleResult : [merkleResult, null];
            if (treeErr || !tree) throw new Error(`Merkle tree failed: ${treeErr}`);

            const rootHash = tree.rootHash();
            const indexer = new Indexer(INDEXER[network]);
            const [txHash, uploadErr] = await indexer.upload(zgFile, RPC[network], wallet);
            if (uploadErr) throw new Error(`Upload failed: ${uploadErr}`);

            // Always close the file handle
            await zgFile.close();

            // Auto-save to memory
          if (walletAddress) {
            await appendMemory(walletAddress, "uploads", {
              label: projectLabel ?? filename,
              data: { rootHash, txHash: String(txHash), filename, network, size: buf.length, storageExplorer: `https://storagescan-galileo.0g.ai` },
              createdAt: new Date().toISOString(),
            });
          }

          return { content: [{ type: "text", text: JSON.stringify({
            success: true,
            filename,
            rootHash,
            txHash: String(txHash),
            network,
            sizeBytes: buf.length,
            storageExplorer: "https://storagescan-galileo.0g.ai",
            message: `✅ ${filename} uploaded to 0G Storage. Root hash: ${rootHash}`,
            warning: "Save the root hash — it's the only way to retrieve this file",
            memorySaved: !!walletAddress,
          }, null, 2) }] };
          } catch (uploadError) {
            // Ensure file handle is closed even on upload failure
            try { await zgFile.close(); } catch { /* ignore */ }
            throw uploadError;
          }
        } finally {
          // Always clean up temp file
          try { (await import("fs")).unlinkSync(tmpPath); } catch { /* ignore */ }
        }
      } catch (e) {
        const msg = (e as Error).message;
        return { content: [{ type: "text", text: JSON.stringify({
          success: false, error: msg,
          tip: msg.includes("balance") ? "Get tokens at https://faucet.0g.ai"
            : msg.includes("base64") ? "Encode your file as base64: Buffer.from(fileBuffer).toString('base64')"
            : "Run zaxxie_troubleshoot with this error for help",
        }) }] };
      }
    });

    // 16. REMEMBER — save to persistent memory
    server.registerTool("zaxxie_remember", {
      title: "Save to Zaxxie Memory",
      description: "Save a contract address, root hash, project info, or any note to Zaxxie's persistent memory — linked to your wallet address. Retrieve later with zaxxie_recall.",
      inputSchema: {
        walletAddress: z.string().describe("Your 0G wallet address (0x...) — used as your memory key"),
        type: z.enum(["contract", "upload", "project", "note"]).describe("Type of memory entry"),
        label: z.string().describe("Short name/label for this entry (e.g. 'MyToken contract', 'whitepaper v2')"),
        data: z.record(z.unknown()).describe("Data to store — any key/value pairs relevant to this entry"),
      },
    }, async ({ walletAddress, type, label, data }) => {
      if (!KV_CONFIGURED) {
        return { content: [{ type: "text", text: JSON.stringify({
          success: false,
          error: "Memory not configured",
          setup: "Add Vercel KV to your project: vercel.com/dashboard → Storage → Create KV → Link to project. Env vars KV_REST_API_URL + KV_REST_API_TOKEN will be set automatically.",
        }) }] };
      }

      const entry: MemoryEntry = { label, data: data as Record<string, unknown>, createdAt: new Date().toISOString() };
      const memType = (type + "s") as keyof WalletMemory;
      await appendMemory(walletAddress, memType, entry);

      return { content: [{ type: "text", text: JSON.stringify({
        success: true,
        saved: { type, label, walletAddress, createdAt: entry.createdAt },
        message: `✅ Saved "${label}" to memory. Retrieve with zaxxie_recall.`,
      }) }] };
    });

    // 17. RECALL — retrieve from persistent memory
    server.registerTool("zaxxie_recall", {
      title: "Recall from Zaxxie Memory",
      description: "Retrieve saved contracts, uploaded file hashes, projects, and notes from Zaxxie's persistent memory. Pass your wallet address to see everything saved for you.",
      inputSchema: {
        walletAddress: z.string().describe("Your 0G wallet address (0x...) — the memory key"),
        type: z.enum(["all", "contracts", "uploads", "projects", "notes"]).default("all").describe("Filter by type or get all"),
      },
    }, async ({ walletAddress, type }) => {
      if (!KV_CONFIGURED) {
        return { content: [{ type: "text", text: JSON.stringify({
          success: false,
          error: "Memory not configured",
          setup: "Add Vercel KV: vercel.com/dashboard → Storage → Create KV → Link to project.",
        }) }] };
      }

      const memory = await memGet<WalletMemory>(`zaxxie:${walletAddress.toLowerCase()}`);
      if (!memory) {
        return { content: [{ type: "text", text: JSON.stringify({
          success: true,
          walletAddress,
          memory: null,
          message: "No memory found for this wallet. Deploy a contract or upload a file with walletAddress set to start building your memory.",
        }) }] };
      }

      const result: Record<string, unknown> = { walletAddress };
      if (type === "all" || type === "contracts") result.contracts = memory.contracts ?? [];
      if (type === "all" || type === "uploads") result.uploads = memory.uploads ?? [];
      if (type === "all" || type === "projects") result.projects = memory.projects ?? [];
      if (type === "all" || type === "notes") result.notes = memory.notes ?? [];

      const total = Object.values(result).filter(Array.isArray).reduce((s, a) => s + (a as unknown[]).length, 0);
      result.summary = `${total} items found for ${walletAddress}`;

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });

    // ══════════════════════════════════════════════════════
    // TIER 2 — CLOSE THE LOOP
    // ══════════════════════════════════════════════════════

    // 18. PUSH TO GITHUB — idea → repo in one conversation
    server.registerTool("zaxxie_push_github", {
      title: "Push Project to GitHub",
      description: "Takes the files array from zaxxie_build and pushes every file directly to a new GitHub repository. No local git needed. Returns the live repo URL. Pair with zaxxie_deploy_vercel to go from idea → live dApp in one conversation.",
      inputSchema: {
        githubToken: z.string().describe("GitHub Personal Access Token with 'repo' scope — create at github.com/settings/tokens"),
        repoName: z.string().describe("Repository name (e.g. my-0g-storage-app) — will be created if it doesn't exist"),
        files: z.array(z.object({
          path: z.string().describe("File path relative to repo root (e.g. app/page.tsx)"),
          content: z.string().describe("Full file content as a string"),
        })).describe("Files array from zaxxie_build output"),
        description: z.string().default("Built with Zaxxie — 0G Zero Gravity dApp").describe("Repository description"),
        isPrivate: z.boolean().default(false).describe("Make the repo private"),
        branch: z.string().default("main").describe("Branch name"),
      },
    }, async ({ githubToken, repoName, files, description, isPrivate, branch }) => {
      try {
        const headers = {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "zaxxie-mcp",
        };

        // Step 1: Get authenticated user
        const userRes = await fetch("https://api.github.com/user", { headers, signal: AbortSignal.timeout(10_000) });
        if (!userRes.ok) throw new Error(`GitHub auth failed (${userRes.status}) — check your token has 'repo' scope`);
        const user = await userRes.json() as { login: string };
        const owner = user.login;

        // Step 2: Create repo (ignore 422 = already exists)
        const createRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers,
          body: JSON.stringify({ name: repoName, description, private: isPrivate, auto_init: false }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!createRes.ok && createRes.status !== 422)
          throw new Error(`Failed to create repo (${createRes.status}): ${await createRes.text()}`);

        // Step 3: Get or create base tree SHA (init repo if empty)
        let baseTreeSha: string | undefined;
        let baseCommitSha: string | undefined;

        const refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${branch}`, {
          headers, signal: AbortSignal.timeout(10_000),
        });

        if (refRes.ok) {
          const ref = await refRes.json() as { object: { sha: string } };
          baseCommitSha = ref.object.sha;
          const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits/${baseCommitSha}`, {
            headers, signal: AbortSignal.timeout(10_000),
          });
          const commit = await commitRes.json() as { tree: { sha: string } };
          baseTreeSha = commit.tree.sha;
        }

        // Step 4: Create blobs for all files
        const treeItems = await Promise.all(files.map(async (file) => {
          const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
            method: "POST",
            headers,
            body: JSON.stringify({ content: Buffer.from(file.content).toString("base64"), encoding: "base64" }),
            signal: AbortSignal.timeout(15_000),
          });
          if (!blobRes.ok) throw new Error(`Blob creation failed for ${file.path}: ${await blobRes.text()}`);
          const blob = await blobRes.json() as { sha: string };
          return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
        }));

        // Step 5: Create tree
        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
          method: "POST",
          headers,
          body: JSON.stringify({ tree: treeItems, ...(baseTreeSha ? { base_tree: baseTreeSha } : {}) }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!treeRes.ok) throw new Error(`Tree creation failed: ${await treeRes.text()}`);
        const tree = await treeRes.json() as { sha: string };

        // Step 6: Create commit
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: `feat: initial 0G dApp — built with Zaxxie\n\nhttps://zaxxie.vercel.app`,
            tree: tree.sha,
            ...(baseCommitSha ? { parents: [baseCommitSha] } : { parents: [] }),
          }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!commitRes.ok) throw new Error(`Commit creation failed: ${await commitRes.text()}`);
        const newCommit = await commitRes.json() as { sha: string };

        // Step 7: Update (or create) branch ref
        const updateRef = baseCommitSha
          ? fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ sha: newCommit.sha, force: false }),
              signal: AbortSignal.timeout(10_000),
            })
          : fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
              method: "POST",
              headers,
              body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommit.sha }),
              signal: AbortSignal.timeout(10_000),
            });

        const refUpdateRes = await updateRef;
        if (!refUpdateRes.ok) throw new Error(`Ref update failed: ${await refUpdateRes.text()}`);

        const repoUrl = `https://github.com/${owner}/${repoName}`;

        return { content: [{ type: "text", text: JSON.stringify({
          success: true,
          repoUrl,
          owner,
          repoName,
          branch,
          filesPushed: files.length,
          commitSha: newCommit.sha.slice(0, 7),
          cloneUrl: `https://github.com/${owner}/${repoName}.git`,
          message: `✅ ${files.length} files pushed to ${repoUrl}`,
          nextStep: `Run zaxxie_deploy_vercel with repoUrl: "${repoUrl}" to get a live dApp URL`,
        }, null, 2) }] };
      } catch (e) {
        const msg = (e as Error).message;
        return { content: [{ type: "text", text: JSON.stringify({
          success: false, error: msg,
          tip: msg.includes("auth") || msg.includes("401") ? "Create a token at github.com/settings/tokens — enable 'repo' scope"
            : msg.includes("422") ? "Repo may already exist with conflicting state — try a different repoName"
            : "Check your githubToken and repoName and try again",
        }) }] };
      }
    });

    // 19. CALL CONTRACT — interact with deployed contracts
    server.registerTool("zaxxie_call_contract", {
      title: "Call a 0G Smart Contract",
      description: "Read or write to any deployed contract on 0G chain. For reads (view/pure functions): no private key needed, returns result instantly. For writes (state-changing): provide private key, returns tx hash. Works with any contract you deployed via zaxxie_deploy_contract.",
      inputSchema: {
        address: z.string().describe("Deployed contract address (0x...)"),
        abi: z.string().describe("Contract ABI as JSON string — from zaxxie_deploy_contract output or artifacts/"),
        functionName: z.string().describe("Function to call (e.g. 'balanceOf', 'transfer', 'mint')"),
        args: z.array(z.union([z.string(), z.number(), z.boolean()])).default([]).describe("Function arguments in order"),
        privateKey: z.string().optional().describe("Private key (0x...) — only needed for write (state-changing) functions"),
        network: z.enum(["testnet", "mainnet"]).default("testnet"),
        value: z.string().optional().describe("ETH value to send with tx in 0G (e.g. '0.01') — only for payable functions"),
      },
    }, async ({ address, abi, functionName, args, privateKey, network, value }) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedAbi: any[];
        try { parsedAbi = JSON.parse(abi); }
        catch { throw new Error("Invalid ABI — must be valid JSON string"); }

        const provider = new ethers.JsonRpcProvider(RPC[network]);

        // Detect if function is read or write
        const funcFragment = parsedAbi.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (f: any) => f.name === functionName && (f.type === "function" || !f.type)
        );
        if (!funcFragment) throw new Error(`Function '${functionName}' not found in ABI. Check the ABI and function name.`);

        const isRead = funcFragment.stateMutability === "view" || funcFragment.stateMutability === "pure";

        if (isRead) {
          // Read call — no signer needed
          const contract = new ethers.Contract(address, parsedAbi, provider);
          const result = await contract[functionName](...args);

          // Serialize result (handle BigInt, arrays, structs)
          const serialize = (val: unknown): unknown => {
            if (typeof val === "bigint") return val.toString();
            if (Array.isArray(val)) return val.map(serialize);
            if (val && typeof val === "object") {
              return Object.fromEntries(Object.entries(val as Record<string, unknown>).map(([k, v]) => [k, serialize(v)]));
            }
            return val;
          };

          return { content: [{ type: "text", text: JSON.stringify({
            success: true,
            type: "read",
            function: functionName,
            args,
            result: serialize(result),
            network,
            contractAddress: address,
          }, null, 2) }] };
        } else {
          // Write call — needs signer
          if (!privateKey) throw new Error(`'${functionName}' is a write function — provide privateKey to sign the transaction`);
          if (!privateKey.startsWith("0x") || privateKey.length < 64)
            throw new Error("Invalid private key — must start with 0x and be 64+ hex chars");

          const wallet = new ethers.Wallet(privateKey, provider);
          const contract = new ethers.Contract(address, parsedAbi, wallet);

          const txOptions: Record<string, unknown> = {};
          if (value) txOptions.value = ethers.parseEther(value);

          const tx = await contract[functionName](...args, txOptions);
          const receipt = await tx.wait();

          return { content: [{ type: "text", text: JSON.stringify({
            success: true,
            type: "write",
            function: functionName,
            args,
            txHash: tx.hash,
            blockNumber: receipt?.blockNumber,
            gasUsed: receipt?.gasUsed?.toString(),
            status: receipt?.status === 1 ? "confirmed" : "failed",
            network,
            contractAddress: address,
            explorerUrl: `${EXPLORER[network]}/tx/${tx.hash}`,
            message: `✅ ${functionName}() executed — tx: ${tx.hash}`,
          }, null, 2) }] };
        }
      } catch (e) {
        const msg = (e as Error).message;
        return { content: [{ type: "text", text: JSON.stringify({
          success: false, error: msg,
          tip: msg.includes("not found in ABI") ? "List all functions by checking your ABI — look for 'name' fields"
            : msg.includes("write function") ? "Add your privateKey parameter to sign this transaction"
            : msg.includes("insufficient") ? "Get tokens at https://faucet.0g.ai"
            : "Run zaxxie_troubleshoot with this error for help",
        }) }] };
      }
    });

    // 20. DEPLOY TO VERCEL — idea → live dApp URL
    server.registerTool("zaxxie_deploy_vercel", {
      title: "Deploy to Vercel",
      description: "Deploy a GitHub repository to Vercel and get a live dApp URL. Use after zaxxie_push_github to complete the full flow: idea → zaxxie_build → zaxxie_push_github → zaxxie_deploy_vercel → live URL. Returns the deployment URL and dashboard link.",
      inputSchema: {
        vercelToken: z.string().describe("Vercel API token — create at vercel.com/account/tokens"),
        repoUrl: z.string().describe("GitHub repo URL (e.g. https://github.com/user/my-0g-app) — from zaxxie_push_github output"),
        projectName: z.string().describe("Vercel project name — must be unique on Vercel (lowercase, hyphens only)"),
        framework: z.enum(["nextjs", "other"]).default("nextjs").describe("Framework preset"),
        envVars: z.record(z.string()).optional().describe("Environment variables to set (e.g. { NEXT_PUBLIC_RPC_URL: 'https://evmrpc-testnet.0g.ai' })"),
      },
    }, async ({ vercelToken, repoUrl, projectName, framework, envVars }) => {
      try {
        const headers = {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        };

        // Parse GitHub repo details from URL
        const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
        if (!repoMatch) throw new Error("Invalid GitHub repo URL — expected format: https://github.com/owner/repo");
        const [, repoOwner, repoRepo] = repoMatch;

        // Step 1: Create Vercel project linked to GitHub repo
        const projectBody: Record<string, unknown> = {
          name: projectName,
          framework: framework === "nextjs" ? "nextjs" : null,
          gitRepository: {
            type: "github",
            repo: `${repoOwner}/${repoRepo}`,
          },
        };

        if (envVars && Object.keys(envVars).length > 0) {
          projectBody.environmentVariables = Object.entries(envVars).map(([key, value]) => ({
            key, value, target: ["production", "preview", "development"], type: "plain",
          }));
        }

        const projectRes = await fetch("https://api.vercel.com/v10/projects", {
          method: "POST",
          headers,
          body: JSON.stringify(projectBody),
          signal: AbortSignal.timeout(15_000),
        });

        let projectId: string;
        let deployUrl: string | undefined;

        if (projectRes.ok) {
          const project = await projectRes.json() as { id: string; name: string };
          projectId = project.id;
        } else if (projectRes.status === 400 || projectRes.status === 409) {
          // Project may already exist — fetch it
          const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
            headers, signal: AbortSignal.timeout(10_000),
          });
          if (!listRes.ok) throw new Error(`Project creation failed (${projectRes.status}): ${await projectRes.text()}`);
          const existing = await listRes.json() as { id: string };
          projectId = existing.id;
        } else {
          throw new Error(`Vercel project creation failed (${projectRes.status}): ${await projectRes.text()}`);
        }

        // Step 2: Trigger a deployment
        const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: projectName,
            gitSource: {
              type: "github",
              org: repoOwner,   // owner login — NOT "owner/repo"
              repo: repoRepo,   // repo name only
              ref: "main",
            },
            projectId,
            target: "production",
          }),
          signal: AbortSignal.timeout(20_000),
        });

        if (!deployRes.ok) throw new Error(`Deployment trigger failed (${deployRes.status}): ${await deployRes.text()}`);
        const deploy = await deployRes.json() as { id: string; url: string; inspectorUrl?: string };

        deployUrl = `https://${deploy.url}`;
        const dashboardUrl = `https://vercel.com/dashboard`;
        const inspectUrl = deploy.inspectorUrl ?? `https://vercel.com/${repoOwner}/${projectName}`;

        return { content: [{ type: "text", text: JSON.stringify({
          success: true,
          deploymentUrl: deployUrl,
          dashboardUrl,
          inspectUrl,
          projectName,
          repoUrl,
          message: `✅ Deploying ${projectName} to Vercel. Live at: ${deployUrl}`,
          note: "Deployment takes 1-3 minutes to go live. Check inspectUrl for build logs.",
          fullFlow: "idea → zaxxie_build → zaxxie_push_github → zaxxie_deploy_vercel ✅",
        }, null, 2) }] };
      } catch (e) {
        const msg = (e as Error).message;
        return { content: [{ type: "text", text: JSON.stringify({
          success: false, error: msg,
          tip: msg.includes("token") || msg.includes("401") ? "Create a Vercel token at vercel.com/account/tokens"
            : msg.includes("GitHub") ? "Ensure your Vercel account is connected to GitHub at vercel.com/account/git"
            : msg.includes("repo URL") ? "Use the repoUrl returned by zaxxie_push_github"
            : "Check your vercelToken and projectName — projectName must be lowercase with hyphens only",
        }) }] };
      }
    });

    // ══════════════════════════════════════════════════════
    // TIER 3 — SMARTER
    // ══════════════════════════════════════════════════════

    // 21. LIVE MODELS — real-time compute provider fetch
    server.registerTool("zaxxie_live_models", {
      title: "Live 0G AI Models",
      description: "Fetches the live list of AI model providers from the 0G Compute marketplace in real time — always current pricing, availability, and provider addresses. Falls back to cached list if the marketplace is unreachable. Use this instead of zaxxie_models for up-to-date provider info.",
      inputSchema: {
        network: z.enum(["testnet", "mainnet"]).default("mainnet").describe("Which network to fetch providers from"),
        type: z.enum(["all", "chat", "image", "speech"]).default("all").describe("Filter by model type"),
      },
    }, async ({ network, type }) => {
      const marketplaceBase = network === "testnet"
        ? "https://gateway-staging.0g.ai"
        : "https://gateway.0g.ai";

      const fallback = OG_KNOWLEDGE.compute.services[network];

      try {
        // Attempt live fetch from 0G compute marketplace API
        const res = await fetch(`${marketplaceBase}/v1/inference/services`, {
          headers: { "Accept": "application/json", "User-Agent": "zaxxie-mcp" },
          signal: AbortSignal.timeout(8_000),
        });

        if (res.ok) {
          const data = await res.json() as Array<{
            provider?: string;
            model?: string;
            url?: string;
            type?: string;
            inputPrice?: string;
            outputPrice?: string;
            verifiability?: string;
          }>;

          const providers = Array.isArray(data) ? data : [];
          const filtered = type === "all" ? providers
            : providers.filter(p => {
              const t = (p.type ?? p.model ?? "").toLowerCase();
              if (type === "chat") return t.includes("chat") || t.includes("llm") || t.includes("instruct") || t.includes("gpt") || t.includes("deepseek") || t.includes("glm");
              if (type === "image") return t.includes("image") || t.includes("diffusion") || t.includes("flux");
              if (type === "speech") return t.includes("whisper") || t.includes("speech") || t.includes("audio");
              return true;
            });

          return { content: [{ type: "text", text: JSON.stringify({
            source: "live",
            network,
            marketplace: `https://compute-marketplace.0g.ai/inference`,
            fetchedAt: new Date().toISOString(),
            count: filtered.length,
            providers: filtered,
            note: "Provider addresses change frequently — always use the latest from this tool",
          }, null, 2) }] };
        }

        throw new Error(`Marketplace returned ${res.status}`);
      } catch {
        // Graceful fallback to cached list
        const cached = type === "all" ? fallback
          : fallback.filter((s: { model: string; type: string }) => {
            const t = (s.type ?? "").toLowerCase();
            if (type === "chat") return t.includes("chat") || t.includes("chatbot");
            if (type === "image") return t.includes("image");
            if (type === "speech") return t.includes("speech");
            return true;
          });

        return { content: [{ type: "text", text: JSON.stringify({
          source: "cached",
          network,
          warning: "Could not reach 0G marketplace API — showing cached list. Prices/availability may be outdated.",
          marketplace: "https://compute-marketplace.0g.ai/inference",
          cachedAt: "2025-Q2",
          count: cached.length,
          providers: cached,
          note: "Visit the marketplace link for live provider addresses and pricing",
        }, null, 2) }] };
      }
    });

    // 22. MONITOR — watch contract events
    server.registerTool("zaxxie_monitor", {
      title: "Monitor Contract Events",
      description: "Fetch recent events emitted by any deployed 0G contract. Filter by event name, block range, or get the last N blocks of activity. Use after deploying to verify your contract is working — or to watch for transfers, mints, approvals, or any custom event.",
      inputSchema: {
        address: z.string().describe("Contract address to monitor (0x...)"),
        abi: z.string().describe("Contract ABI as JSON string"),
        eventName: z.string().optional().describe("Event name to filter (e.g. 'Transfer', 'Mint') — omit to get all events"),
        lastNBlocks: z.number().default(1000).describe("How many recent blocks to scan (default 1000, max 10000)"),
        network: z.enum(["testnet", "mainnet"]).default("testnet"),
      },
    }, async ({ address, abi, eventName, lastNBlocks, network }) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedAbi: any[];
        try { parsedAbi = JSON.parse(abi); }
        catch { throw new Error("Invalid ABI — must be valid JSON string"); }

        const provider = new ethers.JsonRpcProvider(RPC[network]);
        const contract = new ethers.Contract(address, parsedAbi, provider);

        // Get current block
        const currentBlock = await provider.getBlockNumber();
        const safeRange = Math.min(lastNBlocks, 10_000);
        const fromBlock = Math.max(0, currentBlock - safeRange);

        // Validate event exists in ABI if specified
        if (eventName) {
          const eventFragment = parsedAbi.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (f: any) => f.type === "event" && f.name === eventName
          );
          if (!eventFragment) {
            const events = parsedAbi
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((f: any) => f.type === "event")
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((f: any) => f.name);
            throw new Error(`Event '${eventName}' not found in ABI. Available events: ${events.join(", ") || "none"}`);
          }
        }

        // Serialize helper
        const serialize = (val: unknown): unknown => {
          if (typeof val === "bigint") return val.toString();
          if (Array.isArray(val)) return val.map(serialize);
          if (val && typeof val === "object") {
            return Object.fromEntries(
              Object.entries(val as Record<string, unknown>).map(([k, v]) => [k, serialize(v)])
            );
          }
          return val;
        };

        // Query events — use typed filter for named events, provider.getLogs for "all"
        let events: Array<{ event: string; blockNumber: number; txHash: string; args: unknown; explorerUrl: string }>;

        if (eventName) {
          const filter = contract.filters[eventName]?.();
          if (!filter) throw new Error(`Could not build filter for event '${eventName}'`);
          const logs = await contract.queryFilter(filter, fromBlock, currentBlock);
          events = logs.map(log => ({
            event: "fragment" in log ? (log as { fragment: { name: string } }).fragment.name : eventName,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
            args: "args" in log ? serialize((log as { args: unknown }).args) : null,
            explorerUrl: `${EXPLORER[network]}/tx/${log.transactionHash}`,
          }));
        } else {
          // All events — use provider.getLogs + decode with Interface
          const iface = new ethers.Interface(parsedAbi);
          const rawLogs = await provider.getLogs({ address, fromBlock, toBlock: currentBlock });
          events = rawLogs.map(log => {
            let name = "unknown";
            let args: unknown = null;
            try {
              const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
              if (parsed) { name = parsed.name; args = serialize(parsed.args); }
            } catch { /* unparseable log — skip decode */ }
            return { event: name, blockNumber: log.blockNumber, txHash: log.transactionHash, args, explorerUrl: `${EXPLORER[network]}/tx/${log.transactionHash}` };
          });
        }

        return { content: [{ type: "text", text: JSON.stringify({
          success: true,
          contractAddress: address,
          network,
          scannedBlocks: { from: fromBlock, to: currentBlock, count: safeRange },
          eventFilter: eventName ?? "all events",
          totalFound: events.length,
          events: events.slice(0, 100), // return max 100 events
          truncated: events.length > 100,
          explorerUrl: `${EXPLORER[network]}/address/${address}`,
        }, null, 2) }] };
      } catch (e) {
        const msg = (e as Error).message;
        return { content: [{ type: "text", text: JSON.stringify({
          success: false, error: msg,
          tip: msg.includes("not found in ABI") ? "Check the event name — it's case-sensitive (e.g. 'Transfer' not 'transfer')"
            : msg.includes("Invalid ABI") ? "Pass the ABI from zaxxie_deploy_contract output or your artifacts/ folder"
            : "Try reducing lastNBlocks to 500 if the RPC times out",
        }) }] };
      }
    });

    // ══════════════════════════════════════════════════════
    // BUG FINDER TOOLS
    // ══════════════════════════════════════════════════════

    // 23. DEBUG TX — decode failed transaction revert reasons
    server.registerTool("zaxxie_debug_tx", {
      title: "Debug Failed Transaction",
      description: "Paste any failed transaction hash — Zaxxie fetches it, replays it on-chain to extract the exact revert reason, decodes custom errors and panic codes, and tells you precisely what broke and how to fix it. Works for any 0G contract failure.",
      inputSchema: {
        txHash: z.string().describe("Failed transaction hash (0x...)"),
        abi: z.string().optional().describe("Contract ABI as JSON string — enables decoding of custom errors if provided"),
        network: z.enum(["testnet", "mainnet"]).default("testnet"),
      },
    }, async ({ txHash, abi, network }) => {
      try {
        // Step 1: Get receipt to confirm failure
        const receipt = await rpc(network, "eth_getTransactionReceipt", [txHash]) as {
          status: string; blockNumber: string; gasUsed: string; to: string; from: string;
        } | null;

        if (!receipt) {
          return { content: [{ type: "text", text: JSON.stringify({
            success: false,
            status: "not_found",
            message: "Transaction not found — may still be pending or the hash is incorrect",
            tip: "Use zaxxie_check_tx to check if the tx is still pending",
          }) }] };
        }

        if (receipt.status === "0x1") {
          return { content: [{ type: "text", text: JSON.stringify({
            success: true,
            status: "succeeded",
            txHash,
            blockNumber: hexToInt(receipt.blockNumber),
            gasUsed: hexToInt(receipt.gasUsed).toLocaleString(),
            message: "This transaction succeeded — no bug found",
            explorerUrl: `${EXPLORER[network]}/tx/${txHash}`,
          }) }] };
        }

        // Step 2: Fetch original tx to replay
        const tx = await rpc(network, "eth_getTransactionByHash", [txHash]) as {
          from: string; to: string; input: string; value: string; gas: string; blockNumber: string;
        } | null;

        if (!tx) throw new Error("Could not fetch transaction data");

        // Step 3: Replay with eth_call at the same block to extract revert data
        let revertData = "0x";
        let revertMsg = "Unknown revert — no revert data returned by RPC";

        try {
          await rpc(network, "eth_call", [
            { from: tx.from, to: tx.to, data: tx.input, value: tx.value, gas: tx.gas },
            tx.blockNumber,
          ]);
          // If eth_call succeeds here, the revert was gas-related or state-dependent
          revertMsg = "eth_call did not revert at replay — likely a gas limit issue or state has changed since the failed block";
        } catch (callErr) {
          const errMsg = (callErr as Error).message ?? "";
          // Extract hex revert data from error message (ethers / RPC format)
          const hexMatch = errMsg.match(/0x[0-9a-fA-F]{8,}/);
          if (hexMatch) revertData = hexMatch[0];
          revertMsg = errMsg;
        }

        // Step 4: Decode revert data
        const ERR_SIG    = "0x08c379a0"; // Error(string)
        const PANIC_SIG  = "0x4e487b71"; // Panic(uint256)

        const PANIC_CODES: Record<number, string> = {
          0x00: "Generic compiler panic",
          0x01: "assert() failed — assertion was false",
          0x11: "Arithmetic overflow or underflow",
          0x12: "Division or modulo by zero",
          0x21: "Enum value out of range",
          0x22: "Storage byte array incorrectly encoded",
          0x31: "pop() called on empty array",
          0x32: "Array index out of bounds",
          0x41: "Too much memory allocated (out of memory)",
          0x51: "Called a zero-initialized internal function",
        };

        let decoded: Record<string, unknown> = {};

        if (revertData.startsWith(ERR_SIG)) {
          // Standard Error(string)
          try {
            const iface = new ethers.Interface(["function Error(string)"]);
            const [msg] = iface.decodeFunctionData("Error", revertData.replace(ERR_SIG, "0x00000000"));
            decoded = { type: "require/revert string", message: String(msg) };
          } catch {
            decoded = { type: "require/revert string", raw: revertData };
          }
        } else if (revertData.startsWith(PANIC_SIG)) {
          // Panic(uint256)
          try {
            const codeHex = revertData.slice(-64);
            const code = parseInt(codeHex, 16);
            decoded = {
              type: "panic",
              code: `0x${code.toString(16).padStart(2, "0")}`,
              meaning: PANIC_CODES[code] ?? `Unknown panic code 0x${code.toString(16)}`,
            };
          } catch {
            decoded = { type: "panic", raw: revertData };
          }
        } else if (abi && revertData.length >= 10) {
          // Try to decode as a custom error from ABI
          try {
            const parsedAbi = JSON.parse(abi);
            const iface = new ethers.Interface(parsedAbi);
            const parsed = iface.parseError(revertData);
            if (parsed) {
              decoded = {
                type: "custom error",
                name: parsed.name,
                args: Object.fromEntries(
                  parsed.fragment.inputs.map((inp, i) => [inp.name || `arg${i}`, parsed.args[i]?.toString()])
                ),
              };
            }
          } catch {
            decoded = { type: "custom error", raw: revertData, hint: "Provide ABI to decode custom errors" };
          }
        } else if (revertData !== "0x") {
          decoded = { type: "unknown revert data", raw: revertData, hint: "Provide ABI to decode custom errors" };
        }

        // Step 5: Generate fix suggestions
        const fixes: string[] = [];
        const decodedMsg = ((decoded.message ?? decoded.meaning ?? "") as string).toLowerCase();
        const decodedType = (decoded.type ?? "") as string;

        if (decodedType === "panic" && decoded.code === "0x11")
          fixes.push("Arithmetic overflow/underflow — use Solidity 0.8+ (built-in checks) or OpenZeppelin SafeMath");
        if (decodedType === "panic" && decoded.code === "0x01")
          fixes.push("assert() failed — check your invariants, assert() should never fail in normal usage");
        if (decodedType === "panic" && decoded.code === "0x32")
          fixes.push("Array out of bounds — add bounds check before accessing array elements");
        if (decodedType === "panic" && decoded.code === "0x12")
          fixes.push("Division by zero — add a require(denominator > 0) check before division");
        if (decodedMsg.includes("insufficient") || decodedMsg.includes("balance"))
          fixes.push("Insufficient balance — ensure the wallet has enough 0G. Use zaxxie_faucet to get tokens.");
        if (decodedMsg.includes("not owner") || decodedMsg.includes("unauthorized") || decodedMsg.includes("access"))
          fixes.push("Access control failure — the caller is not authorized. Check Ownable/role setup.");
        if (decodedMsg.includes("already") || decodedMsg.includes("exists"))
          fixes.push("State conflict — the operation was already performed or the state prevents it.");
        if (decodedMsg.includes("zero address") || decodedMsg.includes("invalid address"))
          fixes.push("Zero address — validate input addresses with require(addr != address(0))");
        if (decodedMsg.includes("transfer") || decodedMsg.includes("allowance") || decodedMsg.includes("approve"))
          fixes.push("ERC-20 transfer issue — check allowance with approve() before transferFrom()");
        if (fixes.length === 0)
          fixes.push("Run zaxxie_audit_contract on your Solidity source to find potential bugs before deploying");

        return { content: [{ type: "text", text: JSON.stringify({
          success: true,
          status: "failed",
          txHash,
          network,
          blockNumber: hexToInt(receipt.blockNumber),
          gasUsed: hexToInt(receipt.gasUsed).toLocaleString(),
          from: tx.from,
          to: receipt.to,
          revert: decoded,
          rawRevertData: revertData !== "0x" ? revertData : undefined,
          fixes,
          explorerUrl: `${EXPLORER[network]}/tx/${txHash}`,
          message: `Transaction failed — ${decoded.type ?? "unknown revert"}${decoded.message ? `: ${decoded.message}` : decoded.meaning ? `: ${decoded.meaning}` : ""}`,
        }, null, 2) }] };
      } catch (e) {
        const msg = (e as Error).message;
        return { content: [{ type: "text", text: JSON.stringify({
          success: false, error: msg,
          tip: msg.includes("not found") ? "Check the tx hash and network — use zaxxie_check_tx first"
            : "Run zaxxie_troubleshoot with this error for general 0G help",
        }) }] };
      }
    });

    // 24. AUDIT CONTRACT — static security analysis of Solidity source
    server.registerTool("zaxxie_audit_contract", {
      title: "Audit Solidity Contract",
      description: "Static security analysis of any Solidity source code. Checks for reentrancy, tx.origin auth, unchecked low-level calls, integer overflow, selfdestruct, delegatecall abuse, block.timestamp dependency, access control issues, and more. Returns severity-rated findings with exact line references and fix suggestions. Run before deploying any contract.",
      inputSchema: {
        source: z.string().describe("Solidity source code to audit"),
        contractName: z.string().optional().describe("Contract name — for display in report"),
      },
    }, async ({ source, contractName }) => {
      const name = contractName ?? source.match(/contract\s+(\w+)/)?.[1] ?? "Contract";
      const lines = source.split("\n");

      type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
      interface Finding {
        id: string;
        severity: Severity;
        title: string;
        description: string;
        lines: number[];
        fix: string;
      }

      const findings: Finding[] = [];

      // Helper: find all lines matching a pattern
      function matchLines(pattern: RegExp): number[] {
        return lines
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => pattern.test(l))
          .map(({ i }) => i + 1);
      }

      // ── CRITICAL ─────────────────────────────────────────────────────────────

      // Reentrancy: external call before state update
      const callLines = matchLines(/\.(call|transfer|send)\s*[\({]/);
      if (callLines.length > 0) {
        // Heuristic: external call exists — flag for review
        findings.push({
          id: "SWC-107",
          severity: "CRITICAL",
          title: "Potential Reentrancy",
          description: "External call (.call/.transfer/.send) detected. If state is updated AFTER this call, a reentrancy attack is possible.",
          lines: callLines,
          fix: "Follow Checks-Effects-Interactions pattern: update all state variables BEFORE making external calls. Or use OpenZeppelin ReentrancyGuard.",
        });
      }

      // selfdestruct — can destroy contracts and drain ETH
      const selfdestructLines = matchLines(/\bselfdestruct\s*\(/);
      if (selfdestructLines.length > 0) {
        findings.push({
          id: "SWC-106",
          severity: "CRITICAL",
          title: "selfdestruct Usage",
          description: "selfdestruct destroys the contract and forces ETH to a target address. Any caller with access can drain the contract permanently.",
          lines: selfdestructLines,
          fix: "Remove selfdestruct or protect with onlyOwner. Consider using a pausable pattern instead of destructing.",
        });
      }

      // ── HIGH ──────────────────────────────────────────────────────────────────

      // tx.origin auth — phishable
      const txOriginLines = matchLines(/\btx\.origin\b/);
      if (txOriginLines.length > 0) {
        findings.push({
          id: "SWC-115",
          severity: "HIGH",
          title: "tx.origin Authentication",
          description: "tx.origin is the original EOA that started the transaction chain. A malicious contract can phish a user into calling it, then forward the call to your contract — tx.origin will still be the victim.",
          lines: txOriginLines,
          fix: "Replace tx.origin with msg.sender for all authentication checks.",
        });
      }

      // Unchecked low-level call return value
      const lowLevelCallLines = matchLines(/\.call\s*[\({]|\.delegatecall\s*[\({]|\.staticcall\s*[\({]/);
      const checkedCallLines = matchLines(/\(bool\s+\w+.*\)\s*=.*\.call|require\s*\(.*\.call/);
      const uncheckedCallLines = lowLevelCallLines.filter(l => !checkedCallLines.includes(l));
      if (uncheckedCallLines.length > 0) {
        findings.push({
          id: "SWC-104",
          severity: "HIGH",
          title: "Unchecked Low-Level Call Return Value",
          description: "Low-level calls (.call, .delegatecall) return (bool success, bytes data). If the return value is not checked, a failed call will be silently ignored.",
          lines: uncheckedCallLines,
          fix: "Always check the return value: (bool success,) = addr.call{...}(...); require(success, 'Call failed');",
        });
      }

      // delegatecall to user-controlled address
      const delegatecallLines = matchLines(/\.delegatecall\s*[\({]/);
      if (delegatecallLines.length > 0) {
        findings.push({
          id: "SWC-112",
          severity: "HIGH",
          title: "delegatecall Usage",
          description: "delegatecall executes external code in your contract's storage context. If the target address is user-controlled, an attacker can wipe or corrupt your storage.",
          lines: delegatecallLines,
          fix: "Never delegatecall to user-supplied addresses. If using a proxy pattern, ensure the implementation address is only settable by the owner.",
        });
      }

      // Missing access control on critical functions
      const ownershipLines = matchLines(/\bonlyOwner\b|\brequire\s*\(\s*msg\.sender\s*==|\bhasRole\b/);
      const stateChangeFunctions = matchLines(/function\s+\w+\s*\(.*\)\s*(public|external)/);
      const unprotectedFunctions = stateChangeFunctions.filter(l => {
        const fnLine = lines[l - 1] ?? "";
        return (fnLine.includes("public") || fnLine.includes("external"))
          && !fnLine.includes("view")
          && !fnLine.includes("pure")
          && ownershipLines.length === 0;
      });
      if (ownershipLines.length === 0 && stateChangeFunctions.length > 0) {
        findings.push({
          id: "SWC-105",
          severity: "HIGH",
          title: "Missing Access Control",
          description: "No access control modifiers (onlyOwner, hasRole, require msg.sender) detected on state-changing functions. Anyone can call these functions.",
          lines: unprotectedFunctions.slice(0, 5),
          fix: "Add onlyOwner modifier (inherit from Ownable) or implement role-based access with AccessControl. At minimum: require(msg.sender == owner, 'Not authorized');",
        });
      }

      // ── MEDIUM ────────────────────────────────────────────────────────────────

      // block.timestamp dependency
      const timestampLines = matchLines(/\bblock\.timestamp\b|\bnow\b/);
      if (timestampLines.length > 0) {
        findings.push({
          id: "SWC-116",
          severity: "MEDIUM",
          title: "Block Timestamp Dependency",
          description: "block.timestamp can be manipulated by validators within ~15 seconds. Do not use it for randomness or precise timing logic.",
          lines: timestampLines,
          fix: "Avoid using block.timestamp for randomness. For time-locks, a 15-second tolerance is acceptable. For randomness, use Chainlink VRF or commit-reveal schemes.",
        });
      }

      // Integer overflow (pre-0.8 without SafeMath)
      const pragmaLine = lines.find(l => l.includes("pragma solidity"));
      const isPreO8 = pragmaLine && /0\.[0-7]\./.test(pragmaLine);
      const arithmeticLines = matchLines(/[+\-*]\s*=|\+\+|--|[^=!<>]=\s*\w+\s*[+\-*]\s*\w+/);
      const safeMatchLines = matchLines(/using\s+SafeMath|\.add\(|\.sub\(|\.mul\(/);
      if (isPreO8 && arithmeticLines.length > 0 && safeMatchLines.length === 0) {
        findings.push({
          id: "SWC-101",
          severity: "MEDIUM",
          title: "Integer Overflow/Underflow (pre-0.8)",
          description: "Solidity < 0.8.0 does not have built-in overflow checks. Arithmetic operations can silently wrap around.",
          lines: arithmeticLines.slice(0, 5),
          fix: "Upgrade to Solidity 0.8+ (overflow/underflow checks built-in) or use OpenZeppelin SafeMath for all arithmetic.",
        });
      }

      // Floating pragma
      const floatingPragmaLines = matchLines(/pragma\s+solidity\s+\^|pragma\s+solidity\s+>/);
      if (floatingPragmaLines.length > 0) {
        findings.push({
          id: "SWC-103",
          severity: "MEDIUM",
          title: "Floating Pragma",
          description: "Using ^ or > in pragma solidity means the contract can be compiled with multiple compiler versions, some of which may have bugs.",
          lines: floatingPragmaLines,
          fix: "Lock pragma to a specific version: pragma solidity 0.8.24; — use the same version in your hardhat.config.ts.",
        });
      }

      // Uninitialized local variable
      const storagePointerLines = matchLines(/^\s*(uint|int|bytes|string|address|bool|mapping|struct)\s+\w+\s*;(?!\s*=)/);
      if (storagePointerLines.length > 0) {
        findings.push({
          id: "SWC-109",
          severity: "MEDIUM",
          title: "Uninitialized Variable",
          description: "Variables declared without initialization default to 0/false/address(0). If used before being set, this may lead to unexpected behavior.",
          lines: storagePointerLines.slice(0, 5),
          fix: "Always initialize variables: uint256 amount = 0; or ensure they are set before use.",
        });
      }

      // ── LOW ───────────────────────────────────────────────────────────────────

      // Events missing on state changes
      const eventLines = matchLines(/\bevent\b\s+\w+/);
      if (eventLines.length === 0 && stateChangeFunctions.length > 0) {
        findings.push({
          id: "BEST-001",
          severity: "LOW",
          title: "No Events Emitted",
          description: "No events are defined. State-changing functions should emit events so off-chain tools (explorers, dApps, zaxxie_monitor) can track activity.",
          lines: stateChangeFunctions.slice(0, 3),
          fix: "Define events for every state change: event Transfer(address indexed from, address indexed to, uint256 amount); and emit them.",
        });
      }

      // Missing zero-address checks on constructor/setters
      const setterLines = matchLines(/function\s+set\w*\s*\(.*address/);
      const zeroCheckLines = matchLines(/require\s*\(.*!=\s*address\s*\(\s*0\s*\)/);
      if (setterLines.length > 0 && zeroCheckLines.length === 0) {
        findings.push({
          id: "BEST-002",
          severity: "LOW",
          title: "Missing Zero-Address Validation",
          description: "Functions accepting address parameters have no zero-address check. Setting a critical address to address(0) can brick the contract.",
          lines: setterLines,
          fix: "Add: require(addr != address(0), 'Zero address'); before storing any address parameter.",
        });
      }

      // ── INFO ──────────────────────────────────────────────────────────────────

      // 0G-specific: wrong EVM version hint
      if (!source.includes("evmVersion") && !source.includes("cancun")) {
        findings.push({
          id: "0G-001",
          severity: "INFO",
          title: "0G Chain: Verify EVM Version",
          description: "0G Chain requires evmVersion: 'cancun' in your Hardhat config. If compiled with the wrong EVM version, deployment will fail with an invalid opcode error.",
          lines: [],
          fix: "In hardhat.config.ts, add: solidity: { settings: { evmVersion: 'cancun' } }. Use zaxxie_deploy_contract — it compiles with cancun automatically.",
        });
      }

      // Summarize
      const bySeverity = (s: Severity) => findings.filter(f => f.severity === s);
      const score = Math.max(0, 100
        - bySeverity("CRITICAL").length * 30
        - bySeverity("HIGH").length * 15
        - bySeverity("MEDIUM").length * 8
        - bySeverity("LOW").length * 3
      );

      const rating = score >= 90 ? "SAFE" : score >= 70 ? "REVIEW RECOMMENDED" : score >= 50 ? "UNSAFE — FIX BEFORE DEPLOY" : "CRITICAL — DO NOT DEPLOY";

      return { content: [{ type: "text", text: JSON.stringify({
        contract: name,
        auditedAt: new Date().toISOString(),
        linesOfCode: lines.length,
        score: `${score}/100`,
        rating,
        summary: {
          critical: bySeverity("CRITICAL").length,
          high: bySeverity("HIGH").length,
          medium: bySeverity("MEDIUM").length,
          low: bySeverity("LOW").length,
          info: bySeverity("INFO").length,
          total: findings.length,
        },
        findings: findings.map(f => ({
          ...f,
          lines: f.lines.length ? f.lines : undefined,
        })),
        note: "This is static analysis — not a full formal verification. Always test on testnet before mainnet. Use zaxxie_debug_tx to diagnose any failures after deploy.",
      }, null, 2) }] };
    });

  },
  {},
  { basePath: "/api", maxDuration: 120 }
);

export { handler as GET, handler as POST, handler as DELETE };
