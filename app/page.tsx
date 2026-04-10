"use client";
import { useState } from "react";

const MCP_CMD = "claude mcp add zaxxie --transport http https://zaxxie.vercel.app/api/mcp";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} style={{
      background: copied ? "#16a34a" : "#6C3CE1",
      color: "#fff", border: "none", borderRadius: 6,
      padding: "6px 14px", fontSize: 13, fontWeight: 600,
      cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap",
    }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

const TIER_GROUPS = [
  {
    label: "Build & Generate",
    color: "#6C3CE1",
    bgColor: "#2d1b69",
    tools: [
      { name: "zaxxie_build", desc: "⭐ Main tool — describe any idea → every file written to disk, install commands, numbered steps" },
      { name: "zaxxie_scaffold", desc: "Same as build with explicit feature selection (storage, compute, chain, DA, INFTs)" },
    ],
  },
  {
    label: "Agentic Flow",
    color: "#7c3aed",
    bgColor: "#2e1065",
    tools: [
      { name: "zaxxie_push_github", desc: "Push all generated files directly to a new GitHub repo — no local git needed. Returns repo URL." },
      { name: "zaxxie_deploy_vercel", desc: "Deploy GitHub repo to Vercel and get a live dApp URL. Completes the idea → live URL pipeline." },
      { name: "zaxxie_upload", desc: "Server-side file upload to 0G Storage — base64 content → uploaded → root hash returned." },
      { name: "zaxxie_deploy_contract", desc: "Paste Solidity source → compiled on-server with solc-js → deployed to 0G testnet in one step." },
      { name: "zaxxie_call_contract", desc: "Read or write any deployed 0G contract — reads need no key, writes return tx hash." },
    ],
  },
  {
    label: "Memory",
    color: "#0891b2",
    bgColor: "#083344",
    tools: [
      { name: "zaxxie_remember", desc: "Save contracts, root hashes, projects, notes to persistent memory — keyed to your wallet address." },
      { name: "zaxxie_recall", desc: "Retrieve everything saved for your wallet — contracts, uploads, projects, notes." },
    ],
  },
  {
    label: "Live On-Chain",
    color: "#059669",
    bgColor: "#052e16",
    tools: [
      { name: "zaxxie_check_wallet", desc: "Live balance + tx count from 0G RPC — faucet links if empty, canDeploy flag." },
      { name: "zaxxie_check_tx", desc: "Live tx status — confirmed/pending/failed, gas used, block number, contract address." },
      { name: "zaxxie_faucet", desc: "Check balance + exact faucet instructions to get free testnet 0G tokens." },
      { name: "zaxxie_preflight", desc: "Full health check before deploying — wallet, RPC, storage indexer, compute marketplace." },
      { name: "zaxxie_verify_contract", desc: "Check if a contract is verified on 0G explorer + return ABI if available." },
      { name: "zaxxie_monitor", desc: "Watch any deployed contract for events — filter by name, scan last N blocks, decoded args." },
    ],
  },
  {
    label: "Knowledge & Docs",
    color: "#d97706",
    bgColor: "#2d1a00",
    tools: [
      { name: "zaxxie_live_docs", desc: "Fetch latest docs from docs.0g.ai — checks KV cache (nightly cron) then live fetch." },
      { name: "zaxxie_get_docs", desc: "Complete cached 0G docs — chain, storage, compute, DA, INFTs, network, or all." },
      { name: "zaxxie_live_models", desc: "Live AI model list from 0G compute marketplace — real pricing, real providers, always current." },
      { name: "zaxxie_models", desc: "Cached AI models on 0G Compute — LLMs, text-to-image, speech-to-text with pricing." },
      { name: "zaxxie_network", desc: "RPCs, chain IDs, storage indexers, contract addresses, faucets for testnet + mainnet." },
    ],
  },
  {
    label: "Guidance",
    color: "#6b7280",
    bgColor: "#111827",
    tools: [
      { name: "zaxxie_onboard", desc: "MetaMask setup → add 0G network → get tokens → export key. Full beginner guide." },
      { name: "zaxxie_troubleshoot", desc: "Paste any error → get the exact fix for 0G-specific issues instantly." },
    ],
  },
];

export default function Home() {
  return (
    <div style={{ background: "#0d0d14", minHeight: "100vh", color: "#e8e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: "1px solid #1e1e30", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>⚡ Zaxxie</span>
          <span style={{ background: "#1a0a3e", color: "#a78bfa", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, letterSpacing: 0.5 }}>
            22 Tools · v5.0
          </span>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
          <a href="https://docs.0g.ai" target="_blank" rel="noreferrer" style={{ color: "#888", textDecoration: "none" }}>Docs</a>
          <a href="https://build.0g.ai" target="_blank" rel="noreferrer" style={{ color: "#888", textDecoration: "none" }}>Build Hub</a>
          <a href="https://github.com/zaxcoraider/zaxxie" target="_blank" rel="noreferrer" style={{ color: "#888", textDecoration: "none" }}>GitHub</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ textAlign: "center", padding: "90px 24px 70px" }}>
        <div style={{
          display: "inline-block", background: "linear-gradient(135deg, #6C3CE1 0%, #a855f7 100%)",
          borderRadius: 999, padding: "4px 16px", fontSize: 12, fontWeight: 700,
          letterSpacing: 1, marginBottom: 24, color: "#fff", textTransform: "uppercase",
        }}>
          Agentic MCP Server · Powered by 0G Zero Gravity
        </div>
        <h1 style={{
          fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05,
          letterSpacing: -2, margin: "0 0 20px",
          background: "linear-gradient(135deg, #fff 30%, #a78bfa 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Idea → Live dApp.<br />One conversation.
        </h1>
        <p style={{ fontSize: 18, color: "#888", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.6 }}>
          Connect Zaxxie to Claude. Describe what you want to build.
          Zaxxie generates code, deploys contracts, pushes to GitHub,
          ships to Vercel — and remembers everything.
        </p>

        {/* Connect command */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          background: "#13131f", border: "1px solid #2a2a3f",
          borderRadius: 10, padding: "14px 18px", maxWidth: "100%",
        }}>
          <code style={{ color: "#a78bfa", fontSize: 14, wordBreak: "break-all", textAlign: "left" }}>
            {MCP_CMD}
          </code>
          <CopyButton text={MCP_CMD} />
        </div>
        <p style={{ fontSize: 13, color: "#555", marginTop: 12 }}>Paste this in your terminal · Works with Claude Code</p>
      </section>

      {/* ── AGENTIC FLOW ── */}
      <section style={{ background: "#13131f", borderTop: "1px solid #1e1e30", borderBottom: "1px solid #1e1e30", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 32, textAlign: "center" }}>
            The full agentic pipeline
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0 }}>
            {[
              { step: "1", label: "zaxxie_build", desc: "Generate all files" },
              { step: "→", label: "", desc: "" },
              { step: "2", label: "zaxxie_deploy_contract", desc: "Compile + deploy on-chain" },
              { step: "→", label: "", desc: "" },
              { step: "3", label: "zaxxie_push_github", desc: "Push to GitHub repo" },
              { step: "→", label: "", desc: "" },
              { step: "4", label: "zaxxie_deploy_vercel", desc: "Ship to Vercel" },
              { step: "→", label: "", desc: "" },
              { step: "5", label: "zaxxie_remember", desc: "Save to memory" },
            ].map((item, i) =>
              item.label === "" ? (
                <div key={i} style={{ color: "#333", fontSize: 24, padding: "0 8px" }}>→</div>
              ) : (
                <div key={i} style={{ background: "#0d0d14", border: "1px solid #2a2a3f", borderRadius: 10, padding: "14px 16px", textAlign: "center", minWidth: 130 }}>
                  <div style={{ color: "#6C3CE1", fontWeight: 800, fontSize: 11, marginBottom: 6 }}>STEP {item.step}</div>
                  <code style={{ color: "#a78bfa", fontSize: 11, display: "block", marginBottom: 4 }}>{item.label}</code>
                  <div style={{ color: "#555", fontSize: 11 }}>{item.desc}</div>
                </div>
              )
            )}
          </div>
          <p style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 24, marginBottom: 0 }}>
            From a single sentence to a live, deployed dApp — no terminal, no local tools, no manual steps.
          </p>
        </div>
      </section>

      {/* ── WHAT YOU CAN BUILD ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "70px 24px 80px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 24 }}>
          What you can build
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {[
            { icon: "🗄️", title: "Decentralized Storage", desc: "Upload files to 0G Storage directly from a conversation. Get a permanent root hash. No IPFS, no S3.", tag: "0G Storage" },
            { icon: "🤖", title: "AI-Powered dApps", desc: "Run LLMs, text-to-image, speech-to-text — 90% cheaper than OpenAI. Fully decentralized GPU marketplace.", tag: "0G Compute" },
            { icon: "📜", title: "Smart Contracts", desc: "Paste Solidity → compiled + deployed server-side. No local Hardhat. 11,000 TPS, sub-second finality.", tag: "0G Chain" },
            { icon: "🧠", title: "Intelligent NFTs", desc: "Tokenize AI agents as NFTs (ERC-7857). Sell, license, and transfer AI models with encrypted metadata.", tag: "INFTs" },
            { icon: "🔗", title: "Rollup DA Layer", desc: "Use 0G as the data availability layer for your OP Stack or Arbitrum rollup. Max blob 32MB.", tag: "0G DA" },
            { icon: "🚀", title: "Full-Stack dApps", desc: "Next.js + Hardhat + 0G Storage + Compute. Generated, pushed to GitHub, and deployed to Vercel.", tag: "Full Stack" },
          ].map((item) => (
            <div key={item.title} style={{
              background: "#13131f", border: "1px solid #1e1e30",
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{item.tag}</div>
              <strong style={{ fontSize: 15, display: "block", marginBottom: 6, color: "#f0f0f8" }}>{item.title}</strong>
              <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXAMPLE PROMPTS ── */}
      <section style={{ background: "#13131f", borderTop: "1px solid #1e1e30", borderBottom: "1px solid #1e1e30", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 28 }}>
            Try saying this to Claude
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12 }}>
            {[
              "Hey Zaxxie, build me a decentralized file storage app, push it to GitHub and deploy to Vercel",
              "Create an AI chatbot that runs on 0G decentralized compute and ship it live",
              "Deploy an ERC-20 token on 0G — here's my Solidity, compile and deploy it",
              "Upload my whitepaper to 0G Storage and save the root hash to memory",
              "What events has my contract 0xABC... emitted in the last 500 blocks?",
              "Recall all contracts I've deployed — my wallet is 0x...",
            ].map((prompt) => (
              <div key={prompt} style={{
                background: "#0d0d14", border: "1px solid #2a2a3f",
                borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#aaa",
                fontStyle: "italic",
              }}>
                &ldquo;{prompt}&rdquo;
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "70px 24px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 8 }}>
          22 MCP Tools
        </h2>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 36 }}>Grouped by capability. Starred tools are called most often by Claude.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {TIER_GROUPS.map((group) => (
            <div key={group.label}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: group.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: group.color, letterSpacing: 1, textTransform: "uppercase" }}>{group.label}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 10 }}>
                {group.tools.map((tool) => (
                  <div key={tool.name} style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    background: "#13131f", border: `1px solid #1e1e30`,
                    borderRadius: 10, padding: 16,
                  }}>
                    <code style={{
                      background: group.bgColor,
                      color: group.color,
                      padding: "3px 8px", borderRadius: 5, fontSize: 11,
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>{tool.name}</code>
                    <span style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{tool.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NETWORK ENDPOINTS ── */}
      <section style={{ background: "#13131f", borderTop: "1px solid #1e1e30", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 24 }}>
            Network endpoints
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              {
                label: "TESTNET", name: "Galileo", chainId: "16602", badge: "#16a34a", badgeBg: "#052e16",
                endpoints: [
                  ["EVM RPC", "https://evmrpc-testnet.0g.ai"],
                  ["Storage Indexer", "https://indexer-storage-testnet-turbo.0g.ai"],
                  ["Explorer", "https://chainscan-galileo.0g.ai"],
                  ["Storage Scan", "https://storagescan-galileo.0g.ai"],
                  ["Faucet", "https://faucet.0g.ai"],
                ],
              },
              {
                label: "MAINNET", name: "Aristotle", chainId: "16661", badge: "#2563eb", badgeBg: "#0c1a3a",
                endpoints: [
                  ["EVM RPC", "https://evmrpc.0g.ai"],
                  ["Storage Indexer", "https://indexer-storage-turbo.0g.ai"],
                  ["Explorer", "https://chainscan.0g.ai"],
                  ["Storage Scan", "https://storagescan.0g.ai"],
                  ["AI Marketplace", "https://compute-marketplace.0g.ai/inference"],
                ],
              },
            ].map((net) => (
              <div key={net.label} style={{ background: "#0d0d14", border: "1px solid #1e1e30", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ background: net.badgeBg, color: net.badge, fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 999, letterSpacing: 1 }}>{net.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#e0e0f0" }}>{net.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#555" }}>Chain ID: {net.chainId}</span>
                </div>
                {net.endpoints.map(([label, url]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 2 }}>{label}</span>
                    <code style={{ fontSize: 11, color: "#a78bfa", wordBreak: "break-all" }}>{url}</code>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #1e1e30", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ color: "#444", fontSize: 13, margin: 0 }}>
          Built for{" "}
          <a href="https://0g.ai" target="_blank" rel="noreferrer" style={{ color: "#6C3CE1", textDecoration: "none" }}>0G Zero Gravity</a>
          {" "}— The Largest AI L1 &nbsp;·&nbsp;
          <a href="https://build.0g.ai" target="_blank" rel="noreferrer" style={{ color: "#6C3CE1", textDecoration: "none" }}>Builder Hub</a>
          &nbsp;·&nbsp;
          <a href="https://github.com/zaxcoraider/zaxxie" target="_blank" rel="noreferrer" style={{ color: "#6C3CE1", textDecoration: "none" }}>GitHub</a>
          &nbsp;·&nbsp;
          <a href="https://discord.gg/0glabs" target="_blank" rel="noreferrer" style={{ color: "#6C3CE1", textDecoration: "none" }}>Discord</a>
        </p>
      </footer>

    </div>
  );
}
