# ⚡ Zaxxie

**The Ultimate 0G dApp Building Agent — powered by MCP**

Zaxxie gives Claude (and any MCP client) deep knowledge of the entire 0G ecosystem. Ask it to build full-stack dApps and it generates complete, working code with the correct SDKs, contract addresses, and configurations.

## Connect

```bash
claude mcp add zaxxie --transport http https://zaxxie.vercel.app/api/mcp
```

Then just ask:

> *"Hey Zaxxie, build me a dApp with 0G storage and compute"*

## 0G Components Covered

| Component | What Zaxxie Knows |
|-----------|-------------------|
| **0G Chain** | Smart contracts, Hardhat/Foundry config, deploy scripts, verification, precompiles |
| **0G Storage** | TypeScript SDK — upload, download, KV store, browser, streams |
| **0G Compute** | AI inference (LLM chat, text-to-image, speech-to-text), pricing, OpenAI-compatible API |
| **0G DA** | Data availability — client/encoder/retriever setup, rollup integration (OP Stack, Arbitrum) |
| **INFTs** | ERC-7857 standard, AI agent tokenization, marketplace, AI-as-a-Service |
| **Network** | Testnet & mainnet RPCs, chain IDs, contract addresses, faucets, explorers |

## Tools

| Tool | Description |
|------|-------------|
| `zaxxie_get_docs` | Full documentation for any 0G component |
| `zaxxie_scaffold` | Generate complete project scaffolds with all files |
| `zaxxie_network` | RPCs, chain IDs, contract addresses, faucet links |
| `zaxxie_models` | List available AI models with pricing |

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zaxcoraider/zaxxie)

## Run Locally

```bash
git clone https://github.com/zaxcoraider/zaxxie.git
cd zaxxie
npm install
npm run dev
```

Server runs at `http://localhost:3000/api/mcp`

## License

MIT
