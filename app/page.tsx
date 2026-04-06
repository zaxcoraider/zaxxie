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

export default function Home() {
  return (
    <div style={{ background: "#0d0d14", minHeight: "100vh", color: "#e8e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: "1px solid #1e1e30", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>⚡ Zaxxie</span>
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
          MCP Server · Powered by 0G Zero Gravity
        </div>
        <h1 style={{
          fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05,
          letterSpacing: -2, margin: "0 0 20px",
          background: "linear-gradient(135deg, #fff 30%, #a78bfa 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Build on 0G.<br />Just describe your idea.
        </h1>
        <p style={{ fontSize: 18, color: "#888", maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.6 }}>
          Connect Zaxxie to Claude. Tell it what you want to build.
          Get a complete, working dApp — storage, AI inference, smart contracts, NFTs.
          No coding knowledge needed.
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

      {/* ── WHAT YOU CAN BUILD ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 24 }}>
          What you can build
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {[
            { icon: "🗄️", title: "Decentralized Storage", desc: "Upload files, images, videos to 0G Storage. Get a permanent root hash. No IPFS, no S3 — AI-optimized and verifiable.", tag: "0G Storage" },
            { icon: "🤖", title: "AI-Powered dApps", desc: "Run LLMs, text-to-image, speech-to-text — 90% cheaper than OpenAI. Fully decentralized GPU marketplace.", tag: "0G Compute" },
            { icon: "📜", title: "Smart Contracts", desc: "Deploy ERC-20 tokens, NFTs, custom contracts on 0G Chain. 11,000 TPS, sub-second finality, EVM-compatible.", tag: "0G Chain" },
            { icon: "🧠", title: "Intelligent NFTs", desc: "Tokenize AI agents as NFTs (ERC-7857). Sell, license, and transfer AI models with encrypted metadata.", tag: "INFTs" },
            { icon: "🔗", title: "Rollup DA Layer", desc: "Use 0G as the data availability layer for your OP Stack or Arbitrum rollup. Max blob 32MB.", tag: "0G DA" },
            { icon: "🚀", title: "Full-Stack dApps", desc: "Next.js frontend + Hardhat contracts + 0G Storage + Compute. Complete apps from a single prompt.", tag: "Full Stack" },
          ].map((item) => (
            <div key={item.title} style={{
              background: "#13131f", border: "1px solid #1e1e30",
              borderRadius: 12, padding: 20, transition: "border-color 0.2s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: 1,
                textTransform: "uppercase", marginBottom: 6,
              }}>{item.tag}</div>
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
              "Hey Zaxxie, build me a decentralized file storage app",
              "Create an AI chatbot that runs on 0G decentralized compute",
              "Deploy an ERC-20 token on 0G chain and build a frontend",
              "Build an INFT marketplace for AI agents",
              "I want users to upload images and get a shareable link",
              "Set up a rollup with 0G as the data availability layer",
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

      {/* ── NETWORK ENDPOINTS ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "70px 24px" }}>
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
            <div key={net.label} style={{ background: "#13131f", border: "1px solid #1e1e30", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{
                  background: net.badgeBg, color: net.badge,
                  fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 999, letterSpacing: 1,
                }}>{net.label}</span>
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
      </section>

      {/* ── TOOLS ── */}
      <section style={{ background: "#13131f", borderTop: "1px solid #1e1e30", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 24 }}>
            MCP Tools
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 10 }}>
            {[
              { name: "zaxxie_build", star: true, desc: "Describe any idea → get a structured project with every file written to disk automatically" },
              { name: "zaxxie_check_wallet", star: true, desc: "Live wallet balance, tx count, faucet eligibility — checks directly on 0G RPC" },
              { name: "zaxxie_check_tx", star: true, desc: "Live transaction status — success/fail, gas used, contract address, explorer link" },
              { name: "zaxxie_live_docs", star: true, desc: "Fetch latest docs directly from docs.0g.ai — always up to date" },
              { name: "zaxxie_onboard", star: false, desc: "MetaMask setup, add 0G network, get testnet tokens — full beginner guide" },
              { name: "zaxxie_troubleshoot", star: false, desc: "Paste any error → get the exact fix for 0G-specific issues" },
              { name: "zaxxie_get_docs", star: false, desc: "Complete 0G documentation — chain, storage, compute, DA, INFTs" },
              { name: "zaxxie_scaffold", star: false, desc: "Generate project scaffolds with package.json, configs, and working code" },
              { name: "zaxxie_network", star: false, desc: "RPCs, chain IDs, contract addresses, storage indexers, faucets" },
              { name: "zaxxie_models", star: false, desc: "Available AI models on 0G Compute with pricing and endpoints" },
            ].map((tool) => (
              <div key={tool.name} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                background: "#0d0d14", border: `1px solid ${tool.star ? "#6C3CE1" : "#1e1e30"}`,
                borderRadius: 10, padding: 16,
              }}>
                <code style={{
                  background: tool.star ? "#2d1b69" : "#1a1a2e",
                  color: tool.star ? "#c4b5fd" : "#888",
                  padding: "3px 8px", borderRadius: 5, fontSize: 12,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>{tool.name}</code>
                <span style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{tool.desc}</span>
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
