# ⚡ Zaxxie

**Build on 0G. Just describe your idea.**

Zaxxie is an MCP server that connects Claude to the entire 0G Zero Gravity ecosystem. Tell it what you want to build in plain English — it generates a complete, working dApp with every file, every config, and step-by-step instructions. Glassmorphism UI, RainbowKit wallet connect, shadcn components — all included by default.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zaxcoraider/zaxxie)
&nbsp;
![Tools](https://img.shields.io/badge/MCP_Tools-24-7c3aed?style=flat-square)
![Version](https://img.shields.io/badge/version-5.2-6366f1?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)

---

## Connect

```bash
claude mcp add zaxxie --transport http https://zaxxie.vercel.app/api/mcp
```

Then say anything:

> *"Hey Zaxxie, build me a decentralized file storage app, push it to GitHub and deploy to Vercel"*
> *"Create an AI chatbot that runs on 0G decentralized compute and ship it live"*
> *"Deploy an ERC-20 token on 0G — here's my Solidity, compile and deploy it"*
> *"My tx 0xABC failed — what went wrong and how do I fix it?"*

---

## Architecture

```
User (plain English idea)
        │
        ▼
   Claude Code
        │  calls MCP tools
        ▼
┌──────────────────────────────────────────┐
│           ZAXXIE MCP SERVER              │
│       zaxxie.vercel.app/api/mcp          │
│                                          │
│  ┌──────────────┐  ┌───────────────────┐ │
│  │  24 Tools    │  │  0G Knowledge DB  │ │
│  │  (route.ts)  │  │  (og-docs.ts)     │ │
│  └──────┬───────┘  └───────────────────┘ │
│         │                                │
│  BUILD │ AGENTIC │ MEMORY │ LIVE │ DOCS  │
└─────────┬──────────────────┬─────────────┘
          │                  │
          ▼                  ▼
    0G RPC / Chain      Generated dApp
    live reads          every file written
    tx / balance        to disk by Claude
```

### Full Agentic Pipeline

```
zaxxie_build → zaxxie_deploy_contract → zaxxie_push_github → zaxxie_deploy_vercel → zaxxie_remember
     ↓                   ↓                      ↓                     ↓                    ↓
 All files          Compiled +              GitHub repo           Live Vercel            Saved to
 generated          deployed on 0G          created               URL returned           KV memory
```

From a single sentence to a live, deployed dApp — no terminal, no local tools required.

---

## 24 MCP Tools

### ⚙️ Build & Generate
| Tool | What it does |
|------|-------------|
| `zaxxie_build` | ⭐ Main tool — plain English idea → every file, install commands, numbered steps. Auto-detects 0G features. Supports `style` param: `glassmorphism` / `minimal` / `bento` |
| `zaxxie_scaffold` | Same structured output as build with explicit feature selection (storage, compute, chain, da, infts) |

### 🚀 Agentic Flow
| Tool | What it does |
|------|-------------|
| `zaxxie_push_github` | Push all generated files directly to a new GitHub repo. No local git needed — returns live repo URL |
| `zaxxie_deploy_vercel` | Deploy GitHub repo to Vercel and get a live dApp URL. Completes idea → live URL pipeline |
| `zaxxie_upload` | Server-side file upload to 0G Storage. Base64 content in → root hash out. No SDK setup needed |
| `zaxxie_deploy_contract` | Paste Solidity → compiled on-server with solc-js → deployed to 0G testnet. Zero local tooling |
| `zaxxie_call_contract` | Read or write any deployed 0G contract. Reads need no key; writes return tx hash |

### 🧠 Memory
| Tool | What it does |
|------|-------------|
| `zaxxie_remember` | Save contracts, root hashes, projects, and notes to persistent memory keyed to your wallet address |
| `zaxxie_recall` | Retrieve everything saved for your wallet — contracts, uploads, projects, notes — in one call |

### ⛓️ Live On-Chain
| Tool | What it does |
|------|-------------|
| `zaxxie_check_wallet` | Live balance + tx count from 0G RPC. Faucet links if empty, canDeploy flag included |
| `zaxxie_check_tx` | Live tx status — confirmed/pending/failed, gas used, block number, deployed contract address |
| `zaxxie_faucet` | Check balance + exact step-by-step instructions to get free testnet 0G tokens |
| `zaxxie_preflight` | Full health check before deploying — wallet, RPC, storage indexer, compute marketplace |
| `zaxxie_verify_contract` | Check if a contract is verified on 0G explorer. Returns ABI if available |
| `zaxxie_monitor` | Watch any deployed contract for events. Filter by name, scan last N blocks, decoded args |

### 📚 Knowledge & Docs
| Tool | What it does |
|------|-------------|
| `zaxxie_live_docs` | Fetch latest docs from docs.0g.ai at call time — always current, never stale |
| `zaxxie_get_docs` | Complete cached 0G knowledge — chain, storage, compute, DA, INFTs, network, or all |
| `zaxxie_live_models` | Live AI model list from 0G compute marketplace. Real pricing, real providers, always current |
| `zaxxie_models` | Cached AI models on 0G Compute — LLMs, text-to-image, speech-to-text with pricing |
| `zaxxie_network` | RPCs, chain IDs, storage indexers, contract addresses, faucets for testnet + mainnet |

### 🐛 Bug Finder
| Tool | What it does |
|------|-------------|
| `zaxxie_debug_tx` | Paste a failed tx hash → replayed on-chain → exact revert reason decoded + targeted fix suggestions |
| `zaxxie_audit_contract` | Paste Solidity → static security audit: reentrancy, overflow, access control + 10 more checks. Severity-rated |

### 🧭 Guidance
| Tool | What it does |
|------|-------------|
| `zaxxie_onboard` | MetaMask setup → add 0G network → get tokens → export key. Full beginner guide in one call |
| `zaxxie_troubleshoot` | Paste any error message → get the exact fix for 0G-specific issues instantly |

---

## Generated dApp UI

Every Next.js project built by Zaxxie ships with a production-ready UI out of the box:

| Feature | Detail |
|---------|--------|
| **Design styles** | `glassmorphism` (dark, backdrop-blur) · `minimal` (light, clean) · `bento` (grid layout) |
| **Wallet connect** | RainbowKit v2 — no private key inputs, MetaMask / WalletConnect / Coinbase Wallet |
| **CSS system** | Tailwind CSS + CSS custom properties for theme switching |
| **Components** | shadcn-style Button, Card, Input, Badge, StatusBox — in `components/ui.tsx` |
| **Page templates** | Storage · Compute · NFT mint · Token dashboard · DA submission · Full-stack |
| **Mobile** | Responsive from 320px. `px-4 sm:px-8` breakpoints throughout |
| **Utilities** | `cn()` helper via `clsx` + `tailwind-merge` in `lib/utils.ts` |

```bash
# Build with a specific UI style
zaxxie_build idea="NFT marketplace" style="glassmorphism"
zaxxie_build idea="token dashboard" style="minimal"
zaxxie_build idea="storage app" style="bento"
```

---

## What You Can Build

| | Feature | Stack |
|--|---------|-------|
| 🗄️ | Decentralized file storage | 0G Storage SDK |
| 🤖 | AI chatbot / inference app | 0G Compute + OpenAI-compatible API |
| 📜 | ERC-20 tokens, NFTs, custom contracts | 0G Chain + Hardhat |
| 🧠 | Intelligent NFT (INFT) marketplace | ERC-7857 + 0G Storage |
| 🔗 | Rollup data availability layer | 0G DA (OP Stack / Arbitrum) |
| 🚀 | Full-stack dApp | Next.js + RainbowKit + Tailwind + shadcn |

---

## Network

| | Testnet (Galileo) | Mainnet (Aristotle) |
|--|--|--|
| **Chain ID** | 16602 | 16661 |
| **EVM RPC** | `https://evmrpc-testnet.0g.ai` | `https://evmrpc.0g.ai` |
| **Storage Indexer** | `https://indexer-storage-testnet-turbo.0g.ai` | `https://indexer-storage-turbo.0g.ai` |
| **Explorer** | `https://chainscan-galileo.0g.ai` | `https://chainscan.0g.ai` |
| **Storage Scan** | `https://storagescan-galileo.0g.ai` | `https://storagescan.0g.ai` |
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

---

## Links

- [0G Website](https://0g.ai) · [Docs](https://docs.0g.ai) · [Builder Hub](https://build.0g.ai) · [Discord](https://discord.gg/0glabs)
- [Zaxxie Live](https://zaxxie.vercel.app) · [GitHub](https://github.com/zaxcoraider/zaxxie)

## License

MIT
