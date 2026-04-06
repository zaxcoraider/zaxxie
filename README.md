# ⚡ Zaxxie

**Build on 0G. Just describe your idea.**

Zaxxie is an MCP server that connects Claude to the entire 0G Zero Gravity ecosystem. Tell it what you want to build — in plain English — and it generates a complete, working dApp with every file, every config, and step-by-step instructions. No coding knowledge required.

## Connect to Claude

```bash
claude mcp add zaxxie --transport http https://zaxxie.vercel.app/api/mcp
```

Then just say:

> *"Hey Zaxxie, build me a decentralized file storage app"*  
> *"Create an AI chatbot that runs on 0G compute"*  
> *"Deploy an ERC-20 token and build a frontend for it"*  
> *"Build an INFT marketplace for AI agents"*

---

## What you can build

### Decentralized Storage
Upload files, images, videos, and data to 0G Storage — AI-optimized, permanently verifiable, ultra-low cost. Get a root hash back and retrieve anything later. Supports browser uploads, streams, key-value store, and Go/TypeScript SDKs.

### AI-Powered dApps
Run LLMs, text-to-image (Stable Diffusion), and speech-to-text (Whisper) on 0G's decentralized GPU marketplace — 90% cheaper than OpenAI, fully on-chain, OpenAI-compatible API. No centralized provider.

### Smart Contracts on 0G Chain
Deploy Solidity contracts on a fully EVM-compatible chain with 11,000 TPS, sub-second finality, and low fees. Works with Hardhat, Foundry, and Remix. Supports Pectra + Cancun-Deneb.

### Intelligent NFTs (INFTs)
Tokenize AI agents as NFTs using the ERC-7857 standard. Encrypted metadata, secure transfers via TEE oracles, clone function, and AI-as-a-Service licensing — all on-chain.

### Data Availability (DA) for Rollups
Use 0G as the DA layer for your OP Stack or Arbitrum Nitro rollup. Max blob size 32MB. Infinitely scalable. Client, encoder, and retriever components available.

### Full-Stack dApps
Next.js frontend + Hardhat smart contracts + 0G Storage + 0G Compute — complete applications from a single conversation.

---

## MCP Tools

| Tool | What it does |
|------|-------------|
| `zaxxie_build` | **Main tool.** Describe any idea → complete project with every file, install commands, and step-by-step guide |
| `zaxxie_onboard` | Full beginner guide — MetaMask install, add 0G network, get testnet tokens, export private key |
| `zaxxie_troubleshoot` | Paste any error → get the exact fix for 0G-specific issues (EVM version, gas, storage, compute) |
| `zaxxie_get_docs` | Complete 0G documentation — chain, storage, compute, DA, INFTs, network |
| `zaxxie_scaffold` | Generate project scaffolds with package.json, configs, and working code examples |
| `zaxxie_network` | RPCs, chain IDs, contract addresses, faucets, storage indexers, explorer links |
| `zaxxie_models` | Available AI models on 0G Compute with pricing — LLMs, image, speech |

---

## Network

| | Testnet (Galileo) | Mainnet (Aristotle) |
|--|--|--|
| **Chain ID** | 16602 | 16661 |
| **EVM RPC** | `https://evmrpc-testnet.0g.ai` | `https://evmrpc.0g.ai` |
| **Storage Indexer** | `https://indexer-storage-testnet-turbo.0g.ai` | `https://indexer-storage-turbo.0g.ai` |
| **Explorer** | `https://chainscan-galileo.0g.ai` | `https://chainscan.0g.ai` |
| **Faucet** | `https://faucet.0g.ai` | — |

---

## Run Locally

```bash
git clone https://github.com/zaxcoraider/zaxxie.git
cd zaxxie
npm install
npm run dev
```

MCP endpoint: `http://localhost:3000/api/mcp`

```bash
claude mcp add zaxxie --transport http http://localhost:3000/api/mcp
```

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zaxcoraider/zaxxie)

---

## Links

- [0G Website](https://0g.ai)
- [0G Docs](https://docs.0g.ai)
- [Builder Hub](https://build.0g.ai)
- [Discord](https://discord.gg/0glabs)
- [Zaxxie Live](https://zaxxie.vercel.app)

## License

MIT
