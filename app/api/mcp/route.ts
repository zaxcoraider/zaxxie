import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { OG_KNOWLEDGE } from "@/knowledge/og-docs";

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

// ─── File generators ──────────────────────────────────────────────────────────

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
  let env = `# 0G Network — get your private key from MetaMask
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# 0G Testnet (Galileo) — no changes needed
RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602
`;
  if (features.includes("storage")) {
    env += `
# 0G Storage — public indexer (testnet)
INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
# INDEXER_RPC=https://indexer-storage-turbo.0g.ai  # mainnet
`;
  }
  if (features.includes("compute")) {
    env += `
# 0G Compute — get your provider address from the marketplace
# https://compute-marketplace.0g.ai/inference
COMPUTE_PROVIDER_ADDRESS=0xYOUR_PROVIDER_ADDRESS
`;
  }
  env += `
# Get testnet tokens: https://faucet.0g.ai (0.1 0G/day)
# MetaMask setup: https://docs.0g.ai/build-with-0g/wallet-setup
`;
  return env;
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
    apiKey: { "0g-testnet": "placeholder", "0g-mainnet": "placeholder" },
    customChains: [
      {
        network: "0g-testnet", chainId: 16602,
        urls: { apiURL: "https://chainscan-galileo.0g.ai/open/api", browserURL: "https://chainscan-galileo.0g.ai" },
      },
    ],
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
  const zgFile = await ZgFile.fromNodeFileHandle(file as unknown as import("fs").FileHandle);
  const [tree, treeErr] = await zgFile.merkleTree();
  if (treeErr) throw new Error(\`Merkle tree error: \${treeErr}\`);
  const rootHash = tree?.rootHash();
  const [tx, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer);
  if (uploadErr) throw new Error(\`Upload error: \${uploadErr}\`);
  await zgFile.close();
  return { rootHash, txHash: tx };
}

export async function downloadFile(rootHash: string, outputPath: string) {
  const indexer = getIndexer();
  const err = await indexer.download(rootHash, outputPath, true);
  if (err) throw new Error(\`Download error: \${err}\`);
  return outputPath;
}
`;
}

function genComputeLib(): string {
  return `import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { BrowserProvider } from "ethers";
import OpenAI from "openai";

export async function getBroker() {
  if (!window.ethereum) throw new Error("MetaMask not found. Install it at https://metamask.io");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return createZGComputeNetworkBroker(signer);
}

export async function listAIProviders() {
  const broker = await getBroker();
  return broker.inference.listService();
}

export async function chatWithAI(providerAddress: string, message: string) {
  const broker = await getBroker();
  const services = await broker.inference.listService();
  const service = services.find((s: { provider: string }) => s.provider === providerAddress);
  if (!service) throw new Error("Provider not found");

  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  const headers = await broker.inference.getRequestHeaders(providerAddress, message);

  const client = new OpenAI({ baseURL: endpoint + "/v1/proxy", apiKey: "placeholder", defaultHeaders: headers, dangerouslyAllowBrowser: true });
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: message }],
  });
  await broker.inference.processResponse(providerAddress, completion, message);
  return completion.choices[0].message.content;
}
`;
}

function genNextjsStoragePage(idea: string): string {
  return `"use client";
import { useState, useRef } from "react";
import { uploadFile, downloadFile } from "@/lib/storage";

// ${idea}
// Built with Zaxxie — https://zaxxie.vercel.app

export default function Home() {
  const [privateKey, setPrivateKey] = useState("");
  const [rootHash, setRootHash] = useState("");
  const [status, setStatus] = useState("");
  const [downloadHash, setDownloadHash] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus("Please select a file first.");
    if (!privateKey) return setStatus("Please enter your private key.");
    try {
      setStatus("Uploading to 0G Storage...");
      const result = await uploadFile(file, privateKey);
      setRootHash(result.rootHash || "");
      setStatus(\`✅ Uploaded! Root Hash: \${result.rootHash}\`);
    } catch (e: unknown) {
      setStatus(\`❌ Error: \${(e as Error).message}\`);
    }
  }

  async function handleDownload() {
    if (!downloadHash) return setStatus("Enter a root hash to download.");
    try {
      setStatus("Downloading from 0G Storage...");
      await downloadFile(downloadHash, \`./download_\${Date.now()}\`);
      setStatus("✅ Downloaded successfully!");
    } catch (e: unknown) {
      setStatus(\`❌ Error: \${(e as Error).message}\`);
    }
  }

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>0G Storage dApp</h1>
      <p style={{ color: "#666" }}>${idea}</p>

      <div style={{ background: "#fff3cd", borderRadius: 8, padding: 12, marginBottom: 24, fontSize: 13 }}>
        ⚠️ For demo only — never paste a real private key in a browser input. Use environment variables or a wallet connector in production.
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Your Private Key</label>
        <input type="password" value={privateKey} onChange={e => setPrivateKey(e.target.value)}
          placeholder="0x..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Upload File</label>
        <input type="file" ref={fileRef} style={{ marginBottom: 8, display: "block" }} />
        <button onClick={handleUpload} style={{ background: "#6C3CE1", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}>
          Upload to 0G Storage
        </button>
      </div>

      {rootHash && (
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <strong>Root Hash (save this to retrieve your file later):</strong>
          <code style={{ display: "block", wordBreak: "break-all", marginTop: 4, fontSize: 13 }}>{rootHash}</code>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Download by Root Hash</label>
        <input value={downloadHash} onChange={e => setDownloadHash(e.target.value)}
          placeholder="0x..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 8, boxSizing: "border-box" }} />
        <button onClick={handleDownload} style={{ background: "#1e1e2e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}>
          Download from 0G Storage
        </button>
      </div>

      {status && <div style={{ background: "#f8f8fa", borderRadius: 8, padding: 12, fontSize: 14 }}>{status}</div>}

      <p style={{ marginTop: 40, color: "#999", fontSize: 12 }}>
        Powered by <a href="https://0g.ai" style={{ color: "#6C3CE1" }}>0G Zero Gravity</a> · Built with <a href="https://zaxxie.vercel.app" style={{ color: "#6C3CE1" }}>Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genNextjsComputePage(idea: string): string {
  return `"use client";
import { useState } from "react";
import { listAIProviders, chatWithAI } from "@/lib/compute";

// ${idea}
// Built with Zaxxie — https://zaxxie.vercel.app

export default function Home() {
  const [providers, setProviders] = useState<Array<{ provider: string; model: string; inputPrice: string }>>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("");

  async function loadProviders() {
    try {
      setStatus("Loading AI providers from 0G Compute...");
      const list = await listAIProviders();
      setProviders(list);
      setStatus("");
    } catch (e: unknown) {
      setStatus(\`❌ \${(e as Error).message}\`);
    }
  }

  async function handleChat() {
    if (!selectedProvider || !message) return setStatus("Select a provider and enter a message.");
    try {
      setStatus("Sending to 0G decentralized AI...");
      const reply = await chatWithAI(selectedProvider, message);
      setResponse(reply || "");
      setStatus("");
    } catch (e: unknown) {
      setStatus(\`❌ \${(e as Error).message}\`);
    }
  }

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 640, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>0G AI dApp</h1>
      <p style={{ color: "#666" }}>${idea}</p>

      <button onClick={loadProviders} style={{ background: "#6C3CE1", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", marginBottom: 20 }}>
        Connect Wallet & Load AI Providers
      </button>

      {providers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Select AI Provider</label>
          <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }}>
            <option value="">-- Choose a model --</option>
            {providers.map(p => (
              <option key={p.provider} value={p.provider}>{p.model} — {p.inputPrice}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Your Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
          placeholder="Ask anything..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box", resize: "vertical" }} />
      </div>

      <button onClick={handleChat} style={{ background: "#1e1e2e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", marginBottom: 20 }}>
        Send to Decentralized AI
      </button>

      {response && (
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <strong>AI Response:</strong>
          <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>{response}</p>
        </div>
      )}

      {status && <div style={{ background: "#f8f8fa", borderRadius: 8, padding: 12, fontSize: 14 }}>{status}</div>}

      <p style={{ marginTop: 40, color: "#999", fontSize: 12 }}>
        Powered by <a href="https://0g.ai" style={{ color: "#6C3CE1" }}>0G Zero Gravity</a> · Built with <a href="https://zaxxie.vercel.app" style={{ color: "#6C3CE1" }}>Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genNextjsFullPage(idea: string): string {
  return `"use client";
import { useState, useRef } from "react";
import { uploadFile } from "@/lib/storage";
import { listAIProviders, chatWithAI } from "@/lib/compute";

// ${idea}
// Built with Zaxxie — https://zaxxie.vercel.app

export default function Home() {
  const [tab, setTab] = useState<"storage" | "ai">("storage");
  const [privateKey, setPrivateKey] = useState("");
  const [rootHash, setRootHash] = useState("");
  const [providers, setProviders] = useState<Array<{ provider: string; model: string; inputPrice: string }>>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [message, setMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !privateKey) return setStatus("Select a file and enter your private key.");
    try {
      setStatus("Uploading to 0G Storage...");
      const result = await uploadFile(file, privateKey);
      setRootHash(result.rootHash || "");
      setStatus(\`✅ Uploaded! Root Hash: \${result.rootHash}\`);
    } catch (e: unknown) { setStatus(\`❌ \${(e as Error).message}\`); }
  }

  async function handleLoadProviders() {
    try {
      setStatus("Loading 0G AI providers...");
      setProviders(await listAIProviders());
      setStatus("");
    } catch (e: unknown) { setStatus(\`❌ \${(e as Error).message}\`); }
  }

  async function handleChat() {
    if (!selectedProvider || !message) return setStatus("Select a provider and enter a message.");
    try {
      setStatus("Calling decentralized AI...");
      setAiResponse(await chatWithAI(selectedProvider, message) || "");
      setStatus("");
    } catch (e: unknown) { setStatus(\`❌ \${(e as Error).message}\`); }
  }

  const tabStyle = (t: string) => ({
    padding: "8px 20px", border: "none", cursor: "pointer", borderRadius: 6,
    background: tab === t ? "#6C3CE1" : "#f0f0f0", color: tab === t ? "#fff" : "#333", fontWeight: 600,
  });

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 640, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>0G dApp</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>${idea}</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button style={tabStyle("storage")} onClick={() => setTab("storage")}>Storage</button>
        <button style={tabStyle("ai")} onClick={() => setTab("ai")}>AI Inference</button>
      </div>

      {tab === "storage" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Private Key</label>
            <input type="password" value={privateKey} onChange={e => setPrivateKey(e.target.value)}
              placeholder="0x..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box" }} />
          </div>
          <input type="file" ref={fileRef} style={{ marginBottom: 8, display: "block" }} />
          <button onClick={handleUpload} style={{ background: "#6C3CE1", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}>
            Upload to 0G Storage
          </button>
          {rootHash && (
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, marginTop: 16 }}>
              <strong>Root Hash:</strong>
              <code style={{ display: "block", wordBreak: "break-all", fontSize: 12, marginTop: 4 }}>{rootHash}</code>
            </div>
          )}
        </div>
      )}

      {tab === "ai" && (
        <div>
          <button onClick={handleLoadProviders} style={{ background: "#6C3CE1", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", marginBottom: 16 }}>
            Connect Wallet & Load Providers
          </button>
          {providers.length > 0 && (
            <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", marginBottom: 12 }}>
              <option value="">-- Choose AI model --</option>
              {providers.map(p => <option key={p.provider} value={p.provider}>{p.model} — {p.inputPrice}</option>)}
            </select>
          )}
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
            placeholder="Ask anything..." style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd", boxSizing: "border-box", marginBottom: 8 }} />
          <button onClick={handleChat} style={{ background: "#1e1e2e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}>
            Ask Decentralized AI
          </button>
          {aiResponse && (
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 16, marginTop: 16 }}>
              <strong>AI:</strong>
              <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>{aiResponse}</p>
            </div>
          )}
        </div>
      )}

      {status && <div style={{ background: "#f8f8fa", borderRadius: 8, padding: 12, fontSize: 14, marginTop: 16 }}>{status}</div>}

      <p style={{ marginTop: 48, color: "#999", fontSize: 12 }}>
        Powered by <a href="https://0g.ai" style={{ color: "#6C3CE1" }}>0G Zero Gravity</a> · Built with <a href="https://zaxxie.vercel.app" style={{ color: "#6C3CE1" }}>Zaxxie</a>
      </p>
    </main>
  );
}
`;
}

function genSolidityContract(name: string): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Deployed on 0G Chain (EVM-compatible, Chain ID: 16602 testnet / 16661 mainnet)
// IMPORTANT: Always compile with --evm-version cancun

contract ${name} {
    address public owner;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Mint(address indexed to, uint256 amount);

    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply;
        balances[msg.sender] = _initialSupply;
        emit Mint(msg.sender, _initialSupply);
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
        emit Mint(to, amount);
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
}
`;
}

function genDeployScript(contractName: string): string {
  return `import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "0G");

  const Contract = await ethers.getContractFactory("${contractName}");
  const contract = await Contract.deploy(1_000_000);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ ${contractName} deployed to:", address);
  console.log("View on explorer: https://chainscan-galileo.0g.ai/address/" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// Run: npx hardhat run scripts/deploy.ts --network 0g-testnet
`;
}

function detectFeatures(idea: string): string[] {
  const lower = idea.toLowerCase();
  const features: string[] = [];
  if (/storage|upload|file|ipfs|decentralized storage|store|save|blob|media|image|video|document/.test(lower)) features.push("storage");
  if (/ai|compute|inference|chatbot|chat|gpt|llm|model|text.to.image|speech|whisper|generate|predict/.test(lower)) features.push("compute");
  if (/nft|token|erc|contract|mint|deploy|smart contract|solidity|erc20|erc721|marketplace/.test(lower)) features.push("chain");
  if (/inft|intelligent nft|ai agent nft|erc.7857|agent nft/.test(lower)) features.push("infts");
  if (/da|data availability|rollup|op.stack|arbitrum/.test(lower)) features.push("da");
  if (features.length === 0) features.push("storage", "compute"); // sensible default
  return features;
}

function buildProjectOutput(projectName: string, idea: string, features: string[], framework: string): string {
  const lines: string[] = [];
  const safeName = projectName.replace(/[^a-zA-Z0-9-_]/g, "-");

  lines.push(`${"=".repeat(60)}`);
  lines.push(`ZAXXIE BUILD — ${safeName}`);
  lines.push(`${"=".repeat(60)}`);
  lines.push(`Idea: ${idea}`);
  lines.push(`Features: ${features.join(", ")}`);
  lines.push(`Framework: ${framework}`);
  lines.push(``);
  lines.push(`${"─".repeat(60)}`);
  lines.push(`STEP 1 — Prerequisites (do this once)`);
  lines.push(`${"─".repeat(60)}`);
  lines.push(`1. Install Node.js: https://nodejs.org (v18 or later)`);
  lines.push(`2. Install MetaMask browser extension: https://metamask.io`);
  lines.push(`3. Add 0G Testnet to MetaMask:`);
  lines.push(`   Network Name: 0G-Galileo-Testnet`);
  lines.push(`   RPC URL: https://evmrpc-testnet.0g.ai`);
  lines.push(`   Chain ID: 16602`);
  lines.push(`   Symbol: 0G`);
  lines.push(`   Explorer: https://chainscan-galileo.0g.ai`);
  lines.push(`4. Get free testnet tokens: https://faucet.0g.ai (0.1 0G/day)`);
  lines.push(``);
  lines.push(`${"─".repeat(60)}`);
  lines.push(`STEP 2 — Create your project`);
  lines.push(`${"─".repeat(60)}`);
  if (framework === "nextjs") {
    lines.push(`npx create-next-app@latest ${safeName} --typescript --app --no-tailwind --src-dir no`);
    lines.push(`cd ${safeName}`);
  } else if (framework === "hardhat") {
    lines.push(`mkdir ${safeName} && cd ${safeName}`);
    lines.push(`npm init -y`);
  } else {
    lines.push(`mkdir ${safeName} && cd ${safeName}`);
    lines.push(`npm init -y`);
  }
  lines.push(``);
  lines.push(`${"─".repeat(60)}`);
  lines.push(`STEP 3 — Install dependencies`);
  lines.push(`${"─".repeat(60)}`);
  const installCmd = ["npm install ethers dotenv"];
  if (features.includes("storage")) installCmd.push("@0gfoundation/0g-ts-sdk");
  if (features.includes("compute")) installCmd.push("@0glabs/0g-serving-broker openai");
  if (features.includes("chain") || features.includes("infts")) {
    installCmd.push("");
    installCmd.push("npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts");
  }
  lines.push(installCmd.join(" "));
  lines.push(``);
  lines.push(`${"─".repeat(60)}`);
  lines.push(`STEP 4 — Create these files`);
  lines.push(`${"─".repeat(60)}`);
  lines.push(``);

  // .env.example
  lines.push(`FILE: .env.example`);
  lines.push(`${"─".repeat(40)}`);
  lines.push(genEnv(features));

  // package.json
  lines.push(`FILE: package.json`);
  lines.push(`${"─".repeat(40)}`);
  lines.push(genPackageJson(safeName, features, framework));
  lines.push(``);

  // Framework-specific files
  if (framework === "nextjs") {
    if (features.includes("storage") && features.includes("compute")) {
      lines.push(`FILE: app/page.tsx`);
      lines.push(`${"─".repeat(40)}`);
      lines.push(genNextjsFullPage(idea));
    } else if (features.includes("storage")) {
      lines.push(`FILE: app/page.tsx`);
      lines.push(`${"─".repeat(40)}`);
      lines.push(genNextjsStoragePage(idea));
    } else if (features.includes("compute")) {
      lines.push(`FILE: app/page.tsx`);
      lines.push(`${"─".repeat(40)}`);
      lines.push(genNextjsComputePage(idea));
    }

    if (features.includes("storage")) {
      lines.push(`FILE: lib/storage.ts`);
      lines.push(`${"─".repeat(40)}`);
      lines.push(genStorageLib());
    }

    if (features.includes("compute")) {
      lines.push(`FILE: lib/compute.ts`);
      lines.push(`${"─".repeat(40)}`);
      lines.push(genComputeLib());
    }
  }

  if (features.includes("chain") || features.includes("infts")) {
    const contractName = safeName.replace(/-/g, "_").replace(/^[0-9]/, "_") || "MyContract";
    lines.push(`FILE: hardhat.config.ts`);
    lines.push(`${"─".repeat(40)}`);
    lines.push(genHardhatConfig());

    lines.push(`FILE: contracts/${contractName}.sol`);
    lines.push(`${"─".repeat(40)}`);
    lines.push(genSolidityContract(contractName));

    lines.push(`FILE: scripts/deploy.ts`);
    lines.push(`${"─".repeat(40)}`);
    lines.push(genDeployScript(contractName));
  }

  lines.push(`${"─".repeat(60)}`);
  lines.push(`STEP 5 — Set up your private key`);
  lines.push(`${"─".repeat(60)}`);
  lines.push(`cp .env.example .env`);
  lines.push(`# Open .env and paste your private key from MetaMask:`);
  lines.push(`# MetaMask → Account → 3-dot menu → Account Details → Export Private Key`);
  lines.push(`# NEVER share your private key or commit .env to Git`);
  lines.push(``);

  lines.push(`${"─".repeat(60)}`);
  lines.push(`STEP 6 — Run your dApp`);
  lines.push(`${"─".repeat(60)}`);
  if (framework === "nextjs") {
    lines.push(`npm run dev`);
    lines.push(`# Open http://localhost:3000`);
  } else if (features.includes("chain")) {
    lines.push(`npx hardhat compile`);
    lines.push(`npx hardhat run scripts/deploy.ts --network 0g-testnet`);
  } else {
    lines.push(`npm run dev`);
  }
  lines.push(``);

  lines.push(`${"─".repeat(60)}`);
  lines.push(`HELPFUL LINKS`);
  lines.push(`${"─".repeat(60)}`);
  lines.push(`Faucet (free tokens): https://faucet.0g.ai`);
  lines.push(`Explorer: https://chainscan-galileo.0g.ai`);
  lines.push(`Storage Explorer: https://storagescan-galileo.0g.ai`);
  if (features.includes("compute")) lines.push(`AI Marketplace: https://compute-marketplace.0g.ai/inference`);
  lines.push(`Docs: https://docs.0g.ai`);
  lines.push(`Builder Hub: https://build.0g.ai`);
  lines.push(`Discord (for help): https://discord.gg/0glabs`);
  lines.push(``);
  lines.push(`Built by Zaxxie — https://zaxxie.vercel.app`);

  return lines.join("\n");
}

// ─── MCP Handler ─────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {

    // ── 1. BUILD (main tool — natural language → complete project) ─────────────
    server.registerTool("zaxxie_build", {
      title: "Build a 0G dApp",
      description: `THE MAIN TOOL. Use this when the user wants to build ANYTHING on 0G. Takes a natural language idea, auto-detects which 0G features are needed, and returns a complete ready-to-run project with every file, every line of code, and step-by-step instructions. No prior coding knowledge required. Examples: "build me a file storage app", "I want an AI chatbot on blockchain", "create an NFT marketplace", "I need a dapp to upload images".`,
      inputSchema: {
        idea: z.string().describe("The user's idea in plain English — what they want to build"),
        projectName: z.string().default("my-0g-dapp").describe("Project folder name (optional, will be derived from idea if not given)"),
        features: z.array(z.enum(["chain", "storage", "compute", "da", "infts"])).optional().describe("0G features to use — leave empty to auto-detect from idea"),
        framework: z.enum(["nextjs", "react", "express", "hardhat", "custom"]).default("nextjs").describe("Framework — nextjs is best for most dApps"),
      },
    }, async ({ idea, projectName, features, framework }) => {
      const detectedFeatures = features && features.length > 0 ? features : detectFeatures(idea);
      const name = projectName !== "my-0g-dapp" ? projectName : idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "my-0g-dapp";
      const output = buildProjectOutput(name, idea, detectedFeatures, framework);
      return { content: [{ type: "text", text: output }] };
    });

    // ── 2. ONBOARD (wallet + faucet guide for beginners) ──────────────────────
    server.registerTool("zaxxie_onboard", {
      title: "0G Onboarding Guide",
      description: "Step-by-step guide for complete beginners — install MetaMask, add 0G network, get testnet tokens, verify wallet. Use this when a user has no wallet or doesn't know how to get started on 0G.",
      inputSchema: {
        step: z.enum(["all", "metamask", "network", "faucet", "verify"]).default("all").describe("Which onboarding step to show"),
      },
    }, async ({ step }) => {
      const sections: Record<string, string> = {
        metamask: `${"=".repeat(50)}
STEP 1 — Install MetaMask Wallet
${"=".repeat(50)}
MetaMask is a free browser extension that acts as your crypto wallet.

1. Go to: https://metamask.io/download
2. Click "Install MetaMask for Chrome" (or your browser)
3. Click "Add to Chrome" → "Add Extension"
4. Click the MetaMask fox icon in your browser toolbar
5. Click "Create a new wallet"
6. Set a strong password
7. WRITE DOWN your 12-word Secret Recovery Phrase on paper
   ⚠️ Never share this phrase with anyone — it controls all your funds
8. Confirm your phrase and click "Done"

You now have a wallet! Your wallet address looks like: 0x1234...abcd
`,
        network: `${"=".repeat(50)}
STEP 2 — Add 0G Network to MetaMask
${"=".repeat(50)}
By default MetaMask only shows Ethereum. We need to add 0G.

OPTION A — Automatic (easiest):
1. Go to: https://chainlist.org/?search=0g
2. Find "0G Galileo Testnet"
3. Click "Add to MetaMask" → Approve

OPTION B — Manual:
1. Open MetaMask
2. Click the network dropdown at the top (says "Ethereum Mainnet")
3. Click "Add a custom network"
4. Fill in:
   Network Name:  0G-Galileo-Testnet
   RPC URL:       https://evmrpc-testnet.0g.ai
   Chain ID:      16602
   Currency:      0G
   Explorer:      https://chainscan-galileo.0g.ai
5. Click "Save"
6. Select "0G-Galileo-Testnet" from the network dropdown

You're now connected to 0G!
`,
        faucet: `${"=".repeat(50)}
STEP 3 — Get Free Testnet Tokens
${"=".repeat(50)}
You need 0G tokens to pay for transactions (gas fees). These are FREE on testnet.

METHOD 1 — Official Faucet:
1. Go to: https://faucet.0g.ai
2. Paste your MetaMask wallet address (click your address in MetaMask to copy)
3. Complete the captcha
4. Click "Get Tokens"
5. You'll receive 0.1 0G (enough for many transactions)

METHOD 2 — Google Cloud Faucet:
1. Go to: https://cloud.google.com/application/web3/faucet/0g/galileo
2. Sign in with Google
3. Paste your wallet address
4. Click "Send 0G"

⚠️ Limit: 0.1 0G per wallet per day
💡 Need more? Join Discord: https://discord.gg/0glabs and ask in #faucet
`,
        verify: `${"=".repeat(50)}
STEP 4 — Verify Your Setup
${"=".repeat(50)}
Let's make sure everything is working.

CHECK 1 — Your wallet balance:
1. Open MetaMask
2. Make sure you're on "0G-Galileo-Testnet" network
3. You should see your 0G balance (e.g. 0.1 0G)

CHECK 2 — View on explorer:
1. Copy your wallet address from MetaMask
2. Go to: https://chainscan-galileo.0g.ai
3. Paste your address in the search bar
4. You should see your balance and any transactions

CHECK 3 — Export private key (needed for SDK):
1. MetaMask → Click your account name
2. Three dots menu → Account Details
3. Click "Show private key"
4. Enter your MetaMask password
5. Copy the key (starts with 0x)
⚠️ NEVER share this key — it gives full control of your wallet

Everything working? You're ready to build on 0G! 🎉
`,
      };

      let output = `${"=".repeat(50)}\nZAXXIE — 0G ONBOARDING GUIDE\n${"=".repeat(50)}\nThis guide will get you from zero to building on 0G in minutes.\nNo prior blockchain experience needed.\n\n`;
      if (step === "all") {
        output += sections.metamask + "\n" + sections.network + "\n" + sections.faucet + "\n" + sections.verify;
      } else {
        output += sections[step];
      }
      output += `\n${"=".repeat(50)}\nREADY TO BUILD?\n${"=".repeat(50)}\nTell Zaxxie what you want to build and it will generate the complete code.\nExample: "Build me a file storage app on 0G"\n\nBuilder Hub: https://build.0g.ai\nDocs: https://docs.0g.ai\nDiscord: https://discord.gg/0glabs\n`;
      return { content: [{ type: "text", text: output }] };
    });

    // ── 3. TROUBLESHOOT ────────────────────────────────────────────────────────
    server.registerTool("zaxxie_troubleshoot", {
      title: "Troubleshoot 0G Issues",
      description: "Diagnose and fix common errors when building on 0G — wrong EVM version, missing dependencies, storage upload failures, transaction errors, insufficient balance, MetaMask issues.",
      inputSchema: {
        error: z.string().describe("The error message or description of the problem"),
      },
    }, async ({ error }) => {
      const lower = error.toLowerCase();
      const fixes: string[] = [];

      fixes.push(`${"=".repeat(55)}\nZAXXIE TROUBLESHOOT\n${"=".repeat(55)}\nError: "${error}"\n`);

      if (/evm.version|opcode|invalid opcode|cancun|shanghai/.test(lower)) {
        fixes.push(`✅ FIX — Wrong EVM Version
Your Solidity compiler is not set to "cancun" which 0G Chain requires.

In hardhat.config.ts, make sure:
  solidity: {
    version: "0.8.19",
    settings: { evmVersion: "cancun" }  // ← THIS IS REQUIRED
  }

Or with Foundry:
  forge create --evm-version cancun ...

NEVER skip this — 0G Chain requires cancun EVM version.`);
      }

      if (/ethers|peer dep|peerdepenenc|cannot find module|peer/.test(lower)) {
        fixes.push(`✅ FIX — Missing ethers peer dependency
ethers is a PEER dependency for 0G SDKs — you must install it separately.

  npm install ethers@^6.13.4

Then in your code import from "ethers" directly:
  import { ethers } from "ethers";`);
      }

      if (/upload|storage|indexer|merkle|root hash|zgfile/.test(lower)) {
        fixes.push(`✅ FIX — Storage Upload Issues

Common causes:
1. Wrong INDEXER_RPC — use: https://indexer-storage-testnet-turbo.0g.ai (testnet)
                        or: https://indexer-storage-turbo.0g.ai (mainnet)
2. Insufficient 0G balance — get tokens at https://faucet.0g.ai
3. Forgot to call file.close() after upload:
     const [tx, err] = await indexer.upload(file, RPC_URL, signer);
     await file.close(); // ← REQUIRED
4. File path wrong — use absolute paths with ZgFile.fromFilePath()
5. Network mismatch — confirm Chain ID 16602 for testnet`);
      }

      if (/insufficient|balance|gas|fee|funds/.test(lower)) {
        fixes.push(`✅ FIX — Insufficient Balance / Gas
You don't have enough 0G tokens to pay for this transaction.

Get free testnet tokens:
  Official: https://faucet.0g.ai (0.1 0G/day)
  Google:   https://cloud.google.com/application/web3/faucet/0g/galileo

Check your balance:
  MetaMask → make sure you're on 0G-Galileo-Testnet (Chain ID 16602)
  Or: https://chainscan-galileo.0g.ai → search your address`);
      }

      if (/private key|wallet|signer|account|metamask/.test(lower)) {
        fixes.push(`✅ FIX — Wallet / Private Key Issues

To get your private key from MetaMask:
  1. Open MetaMask
  2. Click your account → three dots → Account Details
  3. Click "Show private key" → enter password → copy

In your .env file:
  PRIVATE_KEY=0xYOUR_KEY_HERE  // must start with 0x

In code:
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

⚠️ Never hardcode your key in source files — use .env`);
      }

      if (/network|chain id|rpc|connect|timeout|endpoint/.test(lower)) {
        fixes.push(`✅ FIX — Network / RPC Connection Issues

Correct RPC endpoints:
  Testnet EVM RPC:      https://evmrpc-testnet.0g.ai      (Chain ID: 16602)
  Mainnet EVM RPC:      https://evmrpc.0g.ai              (Chain ID: 16661)
  Testnet Storage:      https://indexer-storage-testnet-turbo.0g.ai
  Mainnet Storage:      https://indexer-storage-turbo.0g.ai

MetaMask network settings:
  Network Name: 0G-Galileo-Testnet
  RPC URL: https://evmrpc-testnet.0g.ai
  Chain ID: 16602
  Symbol: 0G`);
      }

      if (/compute|broker|inference|model|provider|bearer|secret/.test(lower)) {
        fixes.push(`✅ FIX — Compute / AI Inference Issues

1. Fund your ledger first:
     await broker.ledger.addLedger("0.1"); // minimum ~0.01 0G

2. Get Bearer token via CLI:
     pnpm add @0glabs/0g-serving-broker -g
     0g-compute-cli inference get-secret --provider <PROVIDER_ADDRESS>

3. Request headers are SINGLE-USE — generate new ones for each request:
     const headers = await broker.inference.getRequestHeaders(providerAddress, content);

4. Find providers at: https://compute-marketplace.0g.ai/inference

5. Always call processResponse after getting AI output:
     await broker.inference.processResponse(providerAddress, completion, content);`);
      }

      if (/deploy|contract|verify|hardhat/.test(lower)) {
        fixes.push(`✅ FIX — Contract Deployment Issues

1. Compile first: npx hardhat compile
2. Check hardhat.config.ts has evmVersion: "cancun"
3. Deploy: npx hardhat run scripts/deploy.ts --network 0g-testnet
4. Verify: npx hardhat verify DEPLOYED_ADDRESS --network 0g-testnet

If "nonce too low":
  Your previous tx is pending. Wait or reset MetaMask nonce.

If "transaction underpriced":
  Add gasPrice to your network config:
  "0g-testnet": { url: "...", chainId: 16602, accounts: [...], gasPrice: 1000000000 }`);
      }

      if (fixes.length === 1) {
        // No specific match — give general help
        fixes.push(`No exact match found for your error. Here are the most common 0G issues:

1. Wrong EVM version → add evmVersion: "cancun" to hardhat.config.ts
2. Missing ethers → npm install ethers@^6.13.4
3. No balance → get tokens at https://faucet.0g.ai
4. Wrong RPC → use https://evmrpc-testnet.0g.ai (Chain ID: 16602)
5. Storage fails → use indexer https://indexer-storage-testnet-turbo.0g.ai

For more help:
  Discord: https://discord.gg/0glabs
  Docs:    https://docs.0g.ai
  Builder Hub: https://build.0g.ai`);
      }

      return { content: [{ type: "text", text: fixes.join("\n\n") }] };
    });

    // ── 4. GET DOCS ───────────────────────────────────────────────────────────
    server.registerTool("zaxxie_get_docs", {
      title: "Get 0G Docs",
      description: "Get complete 0G developer documentation. Covers: chain, storage, compute, da, infts, network, or all.",
      inputSchema: {
        topic: z.enum(["chain", "storage", "compute", "da", "infts", "network", "all"]).describe("Topic to get docs for"),
      },
    }, async ({ topic }) => {
      return { content: [{ type: "text", text: buildDocs(topic) }] };
    });

    // ── 5. SCAFFOLD ───────────────────────────────────────────────────────────
    server.registerTool("zaxxie_scaffold", {
      title: "Scaffold 0G Project",
      description: "Generate a complete 0G dApp project scaffold with package.json, configs, and code examples.",
      inputSchema: {
        projectName: z.string().describe("Project name"),
        description: z.string().describe("What the dApp should do"),
        features: z.array(z.enum(["chain", "storage", "compute", "da", "infts"])).describe("0G features to include"),
        framework: z.enum(["nextjs", "react", "express", "hardhat", "custom"]).default("nextjs").describe("Framework"),
      },
    }, async ({ projectName, description, features, framework }) => {
      const deps: Record<string, string> = { ethers: "^6.13.4", dotenv: "^16.4.0" };
      const devDeps: Record<string, string> = {};
      if (features.includes("storage")) deps["@0gfoundation/0g-ts-sdk"] = "latest";
      if (features.includes("compute")) { deps["@0glabs/0g-serving-broker"] = "latest"; deps["openai"] = "^4.0.0"; }
      if (features.includes("chain") || features.includes("infts")) { devDeps["hardhat"] = "^2.22.0"; devDeps["@nomicfoundation/hardhat-toolbox"] = "^5.0.0"; devDeps["@openzeppelin/contracts"] = "^5.0.0"; }
      if (framework === "nextjs") { deps["next"] = "^15.0.0"; deps["react"] = "^19.0.0"; deps["react-dom"] = "^19.0.0"; }
      if (framework === "express") { deps["express"] = "^4.21.0"; }

      const scaffold = {
        projectName, description, framework, features,
        packageJson: { name: projectName, version: "0.1.0", private: true, dependencies: deps, devDependencies: devDeps },
        envExample: `PRIVATE_KEY=0xYOUR_KEY\nRPC_URL=https://evmrpc-testnet.0g.ai\nCHAIN_ID=16602${features.includes("storage") ? "\nINDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai" : ""}`,
        networkConfig: OG_KNOWLEDGE.networks.testnet,
        codeExamples: {
          ...(features.includes("chain") ? { chain: { hardhatConfig: OG_KNOWLEDGE.chain.hardhatConfig, sampleContract: OG_KNOWLEDGE.chain.sampleContract, deployScript: OG_KNOWLEDGE.chain.deployScript } } : {}),
          ...(features.includes("storage") ? { storage: { setup: OG_KNOWLEDGE.storage.setup, upload: OG_KNOWLEDGE.storage.upload, download: OG_KNOWLEDGE.storage.download, kvStorage: OG_KNOWLEDGE.storage.kvStorage } } : {}),
          ...(features.includes("compute") ? { compute: { sdkSetup: OG_KNOWLEDGE.compute.sdkSetup, chatCompletion: OG_KNOWLEDGE.compute.chatCompletion, textToImage: OG_KNOWLEDGE.compute.textToImage, speechToText: OG_KNOWLEDGE.compute.speechToText } } : {}),
          ...(features.includes("da") ? { da: { overview: OG_KNOWLEDGE.da.overview, dockerSetup: OG_KNOWLEDGE.da.dockerSetup } } : {}),
          ...(features.includes("infts") ? { infts: { overview: OG_KNOWLEDGE.infts.overview, contractExample: OG_KNOWLEDGE.infts.contractExample } } : {}),
        },
        importantNotes: OG_KNOWLEDGE.importantNotes, links: OG_KNOWLEDGE.links,
      };
      return { content: [{ type: "text", text: JSON.stringify(scaffold, null, 2) }] };
    });

    // ── 6. NETWORK ────────────────────────────────────────────────────────────
    server.registerTool("zaxxie_network", {
      title: "0G Network Info",
      description: "Get 0G network details — RPCs, chain IDs, contract addresses, faucets, explorer URLs, SDK install commands.",
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

    // ── 7. MODELS ─────────────────────────────────────────────────────────────
    server.registerTool("zaxxie_models", {
      title: "0G AI Models",
      description: "List available AI models on 0G Compute Network with pricing — chatbots, text-to-image, speech-to-text.",
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
