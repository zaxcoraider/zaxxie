/**
 * ZAXXIE v3 — Complete 0G Ecosystem Knowledge Base
 * 
 * Contains ALL 0G documentation:
 * - 0G Chain (EVM smart contracts, Hardhat, Foundry, precompiles)
 * - 0G Storage (TypeScript/Go SDK, upload/download, KV store, browser, streams)
 * - 0G Compute (AI inference, text-to-image, speech-to-text, fine-tuning)
 * - 0G DA (Data Availability, rollup integration, client/encoder/retriever)
 * - INFTs (Intelligent NFTs, ERC-7857, AI agent tokenization)
 * - Network config (testnet/mainnet RPCs, chain IDs, contract addresses, faucets)
 */

export const OG_KNOWLEDGE = {

  // ═══════════════════════════════════════════════════
  // NETWORK CONFIGURATION
  // ═══════════════════════════════════════════════════
  networks: {
    testnet: {
      name: "0G-Galileo-Testnet", chainId: 16602, tokenSymbol: "0G",
      rpc: "https://evmrpc-testnet.0g.ai",
      explorer: "https://chainscan-galileo.0g.ai",
      storageExplorer: "https://storagescan-galileo.0g.ai",
      faucet: "https://faucet.0g.ai",
      faucetGoogle: "https://cloud.google.com/application/web3/faucet/0g/galileo",
      computeMarketplace: "https://compute-marketplace.0g.ai/inference",
      thirdPartyRpcs: ["QuickNode","ThirdWeb","Ankr","dRPC"],
      contracts: {
        storageFlow: "0x22E03a6A89B950F1c82ec5e74F8eCa321a105296",
        storageMine: "0x00A9E9604b0538e06b268Fb297Df333337f9593b",
        storageReward: "0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69",
        daEntrance: "0xE75A073dA5bb7b0eC622170Fd268f35E675a957B",
        dASigners: "0x0000000000000000000000000000000000001000",
        wrapped0GBase: "0x0000000000000000000000000000000000001002",
      },
      storageIndexerRpc: "https://indexer-storage-testnet-turbo.0g.ai",
      verifierUrl: "https://chainscan-galileo.0g.ai/open/api",
      daEntranceContract: "0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9",
    },
    mainnet: {
      name: "0G-Aristotle-Mainnet", chainId: 16661, tokenSymbol: "0G",
      rpc: "https://evmrpc.0g.ai",
      explorer: "https://chainscan.0g.ai",
      storageExplorer: "https://storagescan.0g.ai",
      verifierUrl: "https://chainscan.0g.ai/open/api",
      storageIndexerRpc: "https://indexer-storage-turbo.0g.ai",
      contracts: {
        storageFlow: "0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526",
        storageMine: "0xCd01c5Cd953971CE4C2c9bFb95610236a7F414fe",
        storageReward: "0x457aC76B58ffcDc118AABD6DbC63ff9072880870",
      },
      thirdPartyRpcs: ["QuickNode", "ThirdWeb", "Ankr"],
    }
  },

  // ═══════════════════════════════════════════════════
  // ALL SDKs
  // ═══════════════════════════════════════════════════
  sdks: {
    storage_ts: { install: "npm install @0gfoundation/0g-ts-sdk ethers", starterKit: "https://github.com/0gfoundation/0g-storage-ts-starter-kit", repo: "https://github.com/0gfoundation/0g-ts-sdk" },
    storage_go: { install: "go get github.com/0gfoundation/0g-storage-client", starterKit: "https://github.com/0gfoundation/0g-storage-go-starter-kit" },
    compute_broker: { install: "pnpm add @0glabs/0g-serving-broker @types/crypto-js@4.2.2 crypto-js@4.2.0" },
    compute_cli: { install: "pnpm add @0glabs/0g-serving-broker -g" },
    python: { install: "pip install python-0g" },
    da_rust: { install: "cargo add 0g-da-rust-sdk", repo: "https://github.com/0gfoundation/0g-da-client" },
    inft: { install: "npm install @0glabs/0g-ts-sdk @openzeppelin/contracts ethers hardhat", repo: "https://github.com/0gfoundation/0g-agent-nft/tree/eip-7857-draft" },
  },

  // ═══════════════════════════════════════════════════
  // 0G CHAIN — Smart Contract Deployment
  // ═══════════════════════════════════════════════════
  chain: {
    overview: "0G Chain is fully EVM-compatible. 11,000 TPS per shard, sub-second finality, low fees. Supports Pectra & Cancun-Deneb. Use Hardhat, Foundry, or Remix. ALWAYS use --evm-version cancun.",
    sampleContract: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
contract MyToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    constructor(uint256 _initialSupply) { totalSupply = _initialSupply; balances[msg.sender] = _initialSupply; }
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount; balances[to] += amount; return true;
    }
}`,
    hardhatConfig: `require("@nomicfoundation/hardhat-toolbox"); require("@nomicfoundation/hardhat-verify"); require("dotenv").config();
module.exports = {
  solidity: { version: "0.8.19", settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } } },
  networks: {
    "0g-testnet": { url: "https://evmrpc-testnet.0g.ai", chainId: 16602, accounts: [process.env.PRIVATE_KEY] },
    "0g-mainnet": { url: "https://evmrpc.0g.ai", chainId: 16661, accounts: [process.env.PRIVATE_KEY] }
  },
  etherscan: {
    apiKey: { "0g-testnet": "placeholder", "0g-mainnet": "placeholder" },
    customChains: [
      { network: "0g-testnet", chainId: 16602, urls: { apiURL: "https://chainscan-galileo.0g.ai/open/api", browserURL: "https://chainscan-galileo.0g.ai" } },
      { network: "0g-mainnet", chainId: 16661, urls: { apiURL: "https://chainscan.0g.ai/open/api", browserURL: "https://chainscan.0g.ai" } }
    ]
  }
};`,
    deployScript: `async function main() { const C = await ethers.getContractFactory("MyToken"); const c = await C.deploy(1000000); await c.deployed(); console.log("Deployed:", c.address); } main().catch(e => { console.error(e); process.exitCode = 1; });
// Run: npx hardhat run scripts/deploy.js --network 0g-testnet`,
    foundryDeploy: `forge create --rpc-url https://evmrpc-testnet.0g.ai --private-key $PRIVATE_KEY --evm-version cancun src/MyToken.sol:MyToken --constructor-args 1000000`,
    verify: `npx hardhat verify DEPLOYED_CONTRACT_ADDRESS --network 0g-testnet`,
    precompiles: { DASigners: "0x0000000000000000000000000000000000001000", Wrapped0GBase: "0x0000000000000000000000000000000000001002" },
    deploymentScripts: "https://github.com/0gfoundation/0g-deployment-scripts",
  },

  // ═══════════════════════════════════════════════════
  // 0G STORAGE — Full SDK Examples
  // ═══════════════════════════════════════════════════
  storage: {
    overview: "Decentralized, AI-optimized storage with ultra-low costs and verifiable permanence. TypeScript and Go SDKs available.",
    setup: `import { ZgFile, Indexer, Batcher, KvClient } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

// Testnet (Galileo)
const RPC_URL = 'https://evmrpc-testnet.0g.ai';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai'; // Public storage indexer (testnet)

// Mainnet (Aristotle)
// const RPC_URL = 'https://evmrpc.0g.ai';
// const INDEXER_RPC = 'https://indexer-storage-turbo.0g.ai'; // Public storage indexer (mainnet)

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const indexer = new Indexer(INDEXER_RPC);`,
    upload: `async function uploadFile(filePath) {
  const file = await ZgFile.fromFilePath(filePath);
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr) throw new Error(treeErr);
  console.log("Root Hash:", tree?.rootHash());
  const [tx, uploadErr] = await indexer.upload(file, RPC_URL, signer);
  if (uploadErr) throw new Error(uploadErr);
  console.log("Upload TX:", tx);
  await file.close();
  return { rootHash: tree?.rootHash(), txHash: tx };
}`,
    download: `async function downloadFile(rootHash, outputPath) {
  const err = await indexer.download(rootHash, outputPath, true);
  if (err) throw new Error(err);
  console.log("Downloaded!");
}`,
    kvStorage: `// Key-Value Storage on 0G
async function uploadKV(streamId, key, value) {
  const [nodes, err] = await indexer.selectNodes(1);
  if (err) throw new Error(err);
  const batcher = new Batcher(1, nodes, flowContract, RPC_URL);
  batcher.streamDataBuilder.set(streamId, Buffer.from(key), Buffer.from(value));
  const [tx, batchErr] = await batcher.exec();
  if (batchErr) throw new Error(batchErr);
}
async function downloadKV(streamId, key) {
  const kvClient = new KvClient("http://3.101.147.150:6789");
  return await kvClient.getValue(streamId, ethers.encodeBase64(Buffer.from(key)));
}`,
    browser: `import { Blob, Indexer } from '@0gfoundation/0g-ts-sdk/browser';
const file = new Blob(blob);
const [tree, err] = await file.merkleTree();
if (!err) console.log("Root Hash:", tree.rootHash());`,
    stream: `import { Readable } from 'stream';
async function uploadStream() {
  const stream = new Readable(); stream.push('Hello 0G!'); stream.push(null);
  const file = await ZgFile.fromStream(stream, 'hello.txt');
  const [tx, err] = await indexer.upload(file, RPC_URL, signer);
}
async function downloadStream(rootHash) {
  const stream = await indexer.downloadFileAsStream(rootHash);
  stream.pipe(fs.createWriteStream('output.txt'));
}`,
  },

  // ═══════════════════════════════════════════════════
  // 0G COMPUTE — AI Inference, Text-to-Image, Speech-to-Text
  // ═══════════════════════════════════════════════════
  compute: {
    overview: "Decentralized GPU marketplace. 90% cheaper than centralized. OpenAI-compatible API. Supports LLM chat, text-to-image (Stable Diffusion), speech-to-text (Whisper), fine-tuning. TEE verification.",
    services: {
      testnet: [
        { model: "qwen-2.5-7b-instruct", type: "Chatbot", inputPrice: "0.05 0G/1M tokens", outputPrice: "0.10 0G/1M tokens" },
        { model: "qwen-image-edit-2511", type: "Image-Edit", outputPrice: "0.005 0G/image" },
      ],
      mainnet: [
        { model: "GLM-5-FP8", type: "Chatbot", inputPrice: "1 0G/1M", outputPrice: "3.2 0G/1M" },
        { model: "deepseek-chat-v3-0324", type: "Chatbot", inputPrice: "0.30 0G/1M", outputPrice: "1.00 0G/1M" },
        { model: "gpt-oss-120b", type: "Chatbot", inputPrice: "0.10 0G/1M", outputPrice: "0.49 0G/1M" },
        { model: "whisper-large-v3", type: "Speech-to-Text", inputPrice: "0.05 0G/1M", outputPrice: "0.11 0G/1M" },
        { model: "z-image", type: "Text-to-Image", outputPrice: "0.003 0G/image" },
      ],
    },
    sdkSetup: `import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { BrowserProvider } from 'ethers';
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const broker = await createZGComputeNetworkBroker(signer);
await broker.ledger.addLedger("0.1"); // Fund ~10,000 requests`,
    listProviders: `const services = await broker.inference.listService();
services.forEach(s => console.log(s.provider, s.model, s.url, s.inputPrice, s.verifiability));`,
    chatCompletion: `// OpenAI-compatible chat completion
const OpenAI = require('openai');
const client = new OpenAI({ baseURL: service.url + '/v1/proxy', apiKey: 'app-sk-YOUR_SECRET' });
const completion = await client.chat.completions.create({
  model: service.model,
  messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: 'Hello!' }]
});
console.log(completion.choices[0].message);`,
    textToImage: `// Text-to-Image generation
const response = await client.images.generate({
  model: service.model,
  prompt: 'A cute baby sea otter playing in the water',
  n: 1, size: '1024x1024'
});
console.log(response.data);`,
    speechToText: `// Speech-to-Text transcription
const transcription = await client.audio.transcriptions.create({
  file: fs.createReadStream('audio.ogg'),
  model: 'whisper-large-v3',
  response_format: 'json'
});
console.log(transcription.text);`,
    cliCommands: `# CLI Quick Start
pnpm add @0glabs/0g-serving-broker -g
0g-compute-cli setup-network
0g-compute-cli login
0g-compute-cli deposit --amount 10
0g-compute-cli inference list-providers
0g-compute-cli inference verify --provider <ADDR>
0g-compute-cli inference get-secret --provider <ADDR>  # Get Bearer token
0g-compute-cli ui start-web  # Launch web UI at localhost:3090`,
    directApiCurl: `curl <service_url>/v1/proxy/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer app-sk-<YOUR_SECRET>" \\
  -d '{"model":"<model>","messages":[{"role":"user","content":"Hello!"}]}'`,
  },

  // ═══════════════════════════════════════════════════
  // 0G DA — Data Availability
  // ═══════════════════════════════════════════════════
  da: {
    overview: "Infinitely scalable data availability layer. Max blob size: 32,505,852 bytes. Used by rollups (OP Stack, Arbitrum Nitro) and appchains.",
    components: "DA Client (submits data) + DA Encoder (GPU encoding, requires RTX 4090) + DA Retriever (downloads data)",
    clientRepo: "https://github.com/0gfoundation/0g-da-client",
    encoderRepo: "https://github.com/0gfoundation/0g-da-encoder",
    retrieverRepo: "https://github.com/0gfoundation/0g-da-retriever",
    exampleRepo: "https://github.com/0gfoundation/0g-da-example-rust",
    dockerSetup: `# DA Client
git clone https://github.com/0gfoundation/0g-da-client.git && cd 0g-da-client
docker build -t 0g-da-client -f combined.Dockerfile .
# Set envfile.env with COMBINED_SERVER_CHAIN_RPC, COMBINED_SERVER_PRIVATE_KEY, ENTRANCE_CONTRACT_ADDR
docker run -d --env-file envfile.env --name 0g-da-client -v ./run:/runtime -p 51001:51001 0g-da-client combined

# DA Retriever
git clone https://github.com/0gfoundation/0g-da-retriever.git && cd 0g-da-retriever
docker build -t 0g-da-retriever .
docker run -d --name 0g-da-retriever -p 34005:34005 0g-da-retriever`,
    envConfig: `COMBINED_SERVER_CHAIN_RPC=https://evmrpc-testnet.0g.ai
COMBINED_SERVER_PRIVATE_KEY=YOUR_PRIVATE_KEY
ENTRANCE_CONTRACT_ADDR=0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9
DISPERSER_SERVER_GRPC_PORT=51001
BATCHER_DASIGNERS_CONTRACT_ADDRESS=0x0000000000000000000000000000000000001000`,
    rollups: ["OP Stack on 0G DA", "Arbitrum Nitro on 0G DA"],
    verification: `// Rust verification
// Add to Cargo.toml: zg-encoder = { git = "https://github.com/0gfoundation/0g-da-encoder.git" }
// Use zg_encoder::EncodedSlice::verify for verification`,
  },

  // ═══════════════════════════════════════════════════
  // INFTs — Intelligent NFTs (ERC-7857)
  // ═══════════════════════════════════════════════════
  infts: {
    overview: "INFTs tokenize AI agents as NFTs using ERC-7857 standard. Encrypted metadata, secure transfers via TEE oracles, clone function, authorized usage for AI-as-a-Service.",
    standard: "ERC-7857",
    features: ["Privacy-preserving encrypted metadata", "Secure metadata transfer via TEE oracles", "Dynamic AI agent lifecycle", "Clone function for agent templates", "Authorized usage without ownership transfer", "Decentralized storage via 0G Storage", "AI-as-a-Service (AIaaS) models"],
    transferFlow: "1. Encrypt & Commit → 2. Oracle Processing (TEE) → 3. Re-encrypt for Receiver → 4. Secure Key Delivery → 5. Verify & Finalize → 6. Access Granted",
    useCases: ["AI Agent Marketplaces", "Personalized Automation (DeFi trading, airdrop claiming)", "Enterprise AI Solutions", "AI-as-a-Service", "Agent Collaboration / Composition", "IP Monetization"],
    setupCode: `npm install @0glabs/0g-ts-sdk @openzeppelin/contracts ethers hardhat
export PRIVATE_KEY="your-private-key"
export OG_RPC_URL="https://evmrpc-testnet.0g.ai"
export OG_STORAGE_URL="https://storage-testnet.0g.ai"
export OG_COMPUTE_URL="https://compute-testnet.0g.ai"`,
    contractExample: `// scripts/deploy.js
const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const oracle = await MockOracle.deploy(); await oracle.deployed();
  const INFT = await ethers.getContractFactory("INFT");
  const inft = await INFT.deploy("AI Agent NFTs", "AINFT", oracle.address);
  await inft.deployed();
  console.log("Oracle:", oracle.address, "INFT:", inft.address);
}
main().catch(e => { console.error(e); process.exitCode = 1; });`,
    repo: "https://github.com/0gfoundation/0g-agent-nft/tree/eip-7857-draft",
  },

  // ═══════════════════════════════════════════════════
  // IMPORTANT NOTES & GOTCHAS
  // ═══════════════════════════════════════════════════
  importantNotes: [
    "ALWAYS use --evm-version cancun when compiling Solidity for 0G Chain",
    "Testnet Chain ID: 16602, Mainnet Chain ID: 16661",
    "ethers is a PEER dependency — always install alongside 0G SDKs",
    "0G Chain is fully EVM-compatible — Hardhat, Foundry, Remix all work",
    "Storage SDK: Always call file.close() after upload operations",
    "Storage SDK: Save the root hash — you need it to download later",
    "Compute: Request headers are SINGLE-USE — generate new for each request",
    "Compute: Uses OpenAI-compatible API format (chat completions, images, audio)",
    "Compute: Supports chatbot, text-to-image, and speech-to-text services",
    "Compute CLI: Use 0g-compute-cli inference get-secret for Bearer token",
    "DA: Max blob size is 32,505,852 bytes",
    "DA Encoder requires NVIDIA GPU (RTX 4090 tested)",
    "INFTs use ERC-7857 standard — not ERC-721",
    "Faucet: 0.1 0G per day — join Discord for more",
    "Works with ANY EVM chain, Non-EVM chains, and Web2 apps",
    "Precompiles: DASigners at 0x...1000, Wrapped0GBase at 0x...1002",
  ],

  // ═══════════════════════════════════════════════════
  // ECOSYSTEM LINKS
  // ═══════════════════════════════════════════════════
  links: {
    website: "https://0g.ai",
    docs: "https://docs.0g.ai",
    builderHub: "https://build.0g.ai",
    github: "https://github.com/0gfoundation",
    discord: "https://discord.gg/0glabs",
    telegram: "https://t.me/zgcommunity",
    twitter: "https://x.com/0g_labs",
    hub: "https://hub.0g.ai",
    faucet: "https://faucet.0g.ai",
    chainExplorer: "https://chainscan.0g.ai",
    storageExplorer: "https://storagescan.0g.ai",
    ecosystemExplorer: "https://explorer.0g.ai",
    computeMarketplace: "https://compute-marketplace.0g.ai/inference",
  },
};
