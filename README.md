# ⚡ Zaxxie

**Build on 0G. Just describe your idea.**

Zaxxie is an MCP server that connects Claude to the entire 0G Zero Gravity ecosystem. Tell it what you want to build in plain English — it generates a complete, working dApp with every file, every config, and step-by-step instructions. No coding knowledge required.

---

## Connect

```bash
claude mcp add zaxxie --transport http https://zaxxie.vercel.app/api/mcp
```

Then say anything:

> *"Hey Zaxxie, build me a decentralized file storage app"*
> *"Create an AI chatbot that runs on 0G compute"*
> *"Deploy an ERC-20 token on 0G chain"*
> *"Build an INFT marketplace for AI agents"*

---

## Architecture

```
User (plain English idea)
        │
        ▼
   Claude Code
        │  calls MCP tools
        ▼
┌─────────────────────────────────────┐
│           ZAXXIE MCP SERVER         │
│       zaxxie.vercel.app/api/mcp     │
│                                     │
│  ┌─────────────┐  ┌──────────────┐  │
│  │  14 Tools   │  │ 0G Knowledge │  │
│  │  (route.ts) │  │  (og-docs.ts)│  │
│  └──────┬──────┘  └──────────────┘  │
│         │                           │
│  ┌──────▼──────────────────────┐    │
│  │        Tool Groups          │    │
│  │  BUILD  │ LIVE  │  CORE     │    │
│  └─────────────────────────────┘    │
└─────────┬──────────────┬────────────┘
          │              │
          ▼              ▼
    0G RPC/Chain    Generated Files
    (live reads)    written to disk
    (tx/balance)    by Claude Code
```

### How it works

1. User describes their idea to Claude
2. Claude calls `zaxxie_build` → receives structured JSON with every file
3. Claude Code writes all files directly to disk
4. Claude guides user through install → env setup → run
5. Live tools (`check_wallet`, `check_tx`, `preflight`) verify everything on-chain
6. `deploy_contract` deploys directly from the server — no local tools needed

---

## 14 Tools

### Build Tools
| Tool | What it does |
|------|-------------|
| `zaxxie_build` | ⭐ Main tool — plain English idea → complete project (all files, install commands, steps) |
| `zaxxie_scaffold` | Same as build with explicit feature selection |

### Live On-Chain Tools
| Tool | What it does |
|------|-------------|
| `zaxxie_check_wallet` | Live balance + tx count from 0G RPC — faucet links if empty |
| `zaxxie_check_tx` | Live tx status — confirmed/pending/failed, gas, contract address |
| `zaxxie_faucet` | Check balance + exact instructions to get free testnet tokens |
| `zaxxie_verify_contract` | Verification status on 0G explorer + ABI if available |
| `zaxxie_preflight` | Full health check — wallet, RPC, storage indexer, compute marketplace |
| `zaxxie_deploy_contract` | Server-side deploy — ABI + bytecode → deployed address + tx hash |

### Knowledge Tools
| Tool | What it does |
|------|-------------|
| `zaxxie_live_docs` | Fetch latest docs from docs.0g.ai at call time |
| `zaxxie_get_docs` | Cached 0G docs — chain, storage, compute, DA, INFTs, network |
| `zaxxie_network` | RPCs, chain IDs, storage indexers, contract addresses, faucets |
| `zaxxie_models` | Available AI models on 0G Compute with pricing |

### Guidance Tools
| Tool | What it does |
|------|-------------|
| `zaxxie_onboard` | MetaMask setup → add 0G network → get tokens → export key |
| `zaxxie_troubleshoot` | Paste any error → get the exact fix |

---

## What you can build

| | Feature | Stack |
|--|---------|-------|
| 🗄️ | Decentralized file storage | 0G Storage SDK |
| 🤖 | AI chatbot / inference app | 0G Compute + OpenAI-compatible API |
| 📜 | ERC-20 tokens, NFTs, custom contracts | 0G Chain + Hardhat |
| 🧠 | Intelligent NFT (INFT) marketplace | ERC-7857 + 0G Storage |
| 🔗 | Rollup data availability layer | 0G DA (OP Stack / Arbitrum) |
| 🚀 | Full-stack dApp | Next.js + Hardhat + Storage + Compute |

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

## 🔜 Coming Next

> *Things that will make Zaxxie go from "great" to "nothing like it exists"*

### 🔥 High Priority

**Inline Solidity Compilation (`solc-js`)**
Currently `zaxxie_deploy_contract` needs pre-compiled ABI + bytecode — user still has to run `npx hardhat compile` locally. Adding `solc-js` means: paste Solidity source → Zaxxie compiles + deploys in one step. Zero local tooling needed.

**Server-Side Storage Upload**
Add `@0gfoundation/0g-ts-sdk` to Zaxxie's own deps. A user could say *"upload this file to 0G"* and Zaxxie actually does it — returns the root hash. Right now it only generates the code to do it.

**Live Compute Provider Fetch**
`zaxxie_models` is hardcoded. 0G Compute providers change daily. Replace static list with a live fetch from the marketplace API so model names, pricing, and availability are always accurate.

### 🚀 Game Changers

**GitHub Push Tool**
Instead of returning a JSON files array that Claude writes locally, Zaxxie pushes the generated project directly to a new GitHub repo. User gets a repo URL — no local setup at all.

**Vercel Auto-Deploy**
After generating a project, trigger a Vercel deployment via API. User gets a live URL for their dApp without touching a terminal.

**Project Memory (KV Store)**
Remember what was built: deployed contract addresses, uploaded file hashes, which features were used. User can say *"continue my storage app from yesterday"* and Zaxxie picks up where it left off. Use Vercel KV or Upstash Redis.

**Auto-Refresh Knowledge**
A nightly cron job (Vercel cron) that fetches the latest from docs.0g.ai and updates `og-docs.ts` automatically. No more manually updating when 0G ships new SDK versions or contract addresses.

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

- [0G Website](https://0g.ai) · [Docs](https://docs.0g.ai) · [Builder Hub](https://build.0g.ai) · [Discord](https://discord.gg/0glabs)
- [Zaxxie Live](https://zaxxie.vercel.app) · [GitHub](https://github.com/zaxcoraider/zaxxie)

## License

MIT
