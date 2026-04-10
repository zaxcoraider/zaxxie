"use client";
import { useState } from "react";

const MCP_CMD = "claude mcp add zaxxie --transport http https://zaxxie.vercel.app/api/mcp";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className={`copy-btn${copied ? " copied" : ""}`}>
      {copied ? "✓ Copied!" : label}
    </button>
  );
}

const TOOLS = [
  {
    group: "Build & Generate",
    accent: "#8b5cf6",
    dim: "rgba(139,92,246,0.12)",
    icon: "⚙️",
    items: [
      { name: "zaxxie_build", star: true, desc: "Main tool — plain English → every file, install commands, numbered steps. Auto-detects 0G features from your idea." },
      { name: "zaxxie_scaffold", desc: "Same structured output as build with explicit feature selection: storage, compute, chain, DA, INFTs." },
    ],
  },
  {
    group: "Agentic Flow",
    accent: "#6366f1",
    dim: "rgba(99,102,241,0.12)",
    icon: "🚀",
    items: [
      { name: "zaxxie_push_github", desc: "Push all generated files directly to a new GitHub repo. No local git needed — returns live repo URL." },
      { name: "zaxxie_deploy_vercel", desc: "Deploy GitHub repo to Vercel and get a live dApp URL. Completes idea → live URL in one conversation." },
      { name: "zaxxie_upload", desc: "Server-side file upload to 0G Storage. Base64 content in → root hash out. No SDK setup needed." },
      { name: "zaxxie_deploy_contract", desc: "Paste Solidity → compiled server-side with solc-js → deployed to 0G testnet. Zero local tooling." },
      { name: "zaxxie_call_contract", desc: "Read or write any deployed 0G contract. Reads need no key; writes return tx hash." },
    ],
  },
  {
    group: "Memory",
    accent: "#06b6d4",
    dim: "rgba(6,182,212,0.12)",
    icon: "🧠",
    items: [
      { name: "zaxxie_remember", desc: "Save contracts, root hashes, projects, and notes to persistent memory keyed to your wallet address." },
      { name: "zaxxie_recall", desc: "Retrieve everything saved for your wallet — contracts, uploads, projects, notes — in one call." },
    ],
  },
  {
    group: "Live On-Chain",
    accent: "#10b981",
    dim: "rgba(16,185,129,0.12)",
    icon: "⛓️",
    items: [
      { name: "zaxxie_check_wallet", desc: "Live balance + tx count from 0G RPC. Faucet links if empty, canDeploy flag included." },
      { name: "zaxxie_check_tx", desc: "Live tx status — confirmed/pending/failed, gas used, block number, deployed contract address." },
      { name: "zaxxie_faucet", desc: "Check balance + exact step-by-step instructions to get free testnet 0G tokens." },
      { name: "zaxxie_preflight", desc: "Full health check before deploying — wallet, RPC, storage indexer, compute marketplace." },
      { name: "zaxxie_verify_contract", desc: "Check if a contract is verified on 0G explorer. Returns ABI if available." },
      { name: "zaxxie_monitor", desc: "Watch any deployed contract for events. Filter by name, scan last N blocks, decoded args." },
    ],
  },
  {
    group: "Knowledge & Docs",
    accent: "#f59e0b",
    dim: "rgba(245,158,11,0.12)",
    icon: "📚",
    items: [
      { name: "zaxxie_live_docs", desc: "Fetch latest docs from docs.0g.ai at call time — always current, never stale." },
      { name: "zaxxie_get_docs", desc: "Complete cached 0G knowledge — chain, storage, compute, DA, INFTs, network, or all." },
      { name: "zaxxie_live_models", desc: "Live AI model list from 0G compute marketplace. Real pricing, real providers, always current." },
      { name: "zaxxie_models", desc: "Cached AI models on 0G Compute — LLMs, text-to-image, speech-to-text with pricing." },
      { name: "zaxxie_network", desc: "RPCs, chain IDs, storage indexers, contract addresses, faucets for testnet + mainnet." },
    ],
  },
  {
    group: "Bug Finder",
    accent: "#ef4444",
    dim: "rgba(239,68,68,0.12)",
    icon: "🐛",
    items: [
      { name: "zaxxie_debug_tx", desc: "Paste a failed tx hash → replayed on-chain → exact revert reason decoded + targeted fix suggestions." },
      { name: "zaxxie_audit_contract", desc: "Paste Solidity → static security audit: reentrancy, overflow, access control + 10 more checks. Severity-rated." },
    ],
  },
  {
    group: "Guidance",
    accent: "#64748b",
    dim: "rgba(100,116,139,0.12)",
    icon: "🧭",
    items: [
      { name: "zaxxie_onboard", desc: "MetaMask setup → add 0G network → get tokens → export key. Full beginner guide in one call." },
      { name: "zaxxie_troubleshoot", desc: "Paste any error message → get the exact fix for 0G-specific issues instantly." },
    ],
  },
];

const PIPELINE = [
  { step: "01", tool: "zaxxie_build", label: "Generate files" },
  { step: "02", tool: "zaxxie_deploy_contract", label: "Deploy on-chain" },
  { step: "03", tool: "zaxxie_push_github", label: "Push to GitHub" },
  { step: "04", tool: "zaxxie_deploy_vercel", label: "Ship to Vercel" },
  { step: "05", tool: "zaxxie_remember", label: "Save to memory" },
];

const WHAT_TO_BUILD = [
  { icon: "🗄️", tag: "0G Storage", title: "Decentralized Storage", desc: "Upload files to 0G Storage. Get a permanent root hash. No IPFS, no S3, no middlemen." },
  { icon: "🤖", tag: "0G Compute", title: "AI-Powered dApps", desc: "Run LLMs, image gen, speech-to-text — 90% cheaper than OpenAI. Fully decentralized GPU marketplace." },
  { icon: "📜", tag: "0G Chain", title: "Smart Contracts", desc: "Paste Solidity → compiled + deployed server-side. No local Hardhat. 11,000 TPS, sub-second finality." },
  { icon: "🧠", tag: "INFTs", title: "Intelligent NFTs", desc: "Tokenize AI agents as NFTs (ERC-7857). Sell, license, and transfer AI models with encrypted metadata." },
  { icon: "🔗", tag: "0G DA", title: "Rollup DA Layer", desc: "Use 0G as the data availability layer for your OP Stack or Arbitrum rollup. Max blob 32MB." },
  { icon: "🚀", tag: "Full Stack", title: "Full-Stack dApps", desc: "Next.js + RainbowKit + Tailwind + shadcn components. Generated, GitHub-pushed, Vercel-deployed." },
];

const PROMPTS = [
  "Hey Zaxxie, build me a decentralized file storage app, push it to GitHub and deploy to Vercel",
  "Create an AI chatbot that runs on 0G decentralized compute and ship it live",
  "Deploy an ERC-20 token on 0G — here's my Solidity, compile and deploy it",
  "Upload my whitepaper to 0G Storage and save the root hash to memory",
  "My tx 0xABC failed — what went wrong and how do I fix it?",
  "Audit this Solidity contract before I deploy it — find any bugs",
];

export default function Home() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #07070f; color: #e2e2f0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
        a { text-decoration: none; }
        code { font-family: "SF Mono", "Fira Code", Consolas, monospace; }

        /* Glassmorphism card */
        .glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
          border-radius: 16px;
        }

        /* Copy button */
        .copy-btn {
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .copy-btn:hover { background: #6d28d9; }
        .copy-btn:active { transform: scale(0.97); }
        .copy-btn.copied { background: #059669; }

        /* Nav */
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 60px;
          background: rgba(7,7,15,0.85);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
        }
        .nav-logo { font-weight: 800; font-size: 18px; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; }
        .nav-badge { background: rgba(124,58,237,0.2); color: #a78bfa; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid rgba(167,139,250,0.3); }
        .nav-links { display: flex; gap: 28px; }
        .nav-links a { color: #666; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: #a78bfa; }

        /* Hero */
        .hero { text-align: center; padding: 100px 24px 80px; position: relative; overflow: hidden; }
        .hero::before {
          content: "";
          position: absolute;
          top: -200px; left: 50%; transform: translateX(-50%);
          width: 900px; height: 600px;
          background: radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.35);
          border-radius: 999px; padding: 5px 16px;
          font-size: 12px; font-weight: 700; letter-spacing: 1px;
          color: #a78bfa; text-transform: uppercase; margin-bottom: 28px;
        }
        .hero-title {
          font-size: clamp(44px, 8vw, 88px);
          font-weight: 900; line-height: 1.03; letter-spacing: -3px;
          margin: 0 0 24px;
          background: linear-gradient(135deg, #fff 30%, #a78bfa 70%, #818cf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub { font-size: 18px; color: #777; max-width: 540px; margin: 0 auto 48px; line-height: 1.7; }
        .hero-cmd {
          display: inline-flex; align-items: center; gap: 14px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 14px 18px; max-width: 100%;
          box-shadow: 0 0 40px rgba(124,58,237,0.1);
        }
        .hero-cmd code { color: #c4b5fd; font-size: 13.5px; word-break: break-all; text-align: left; }
        .hero-hint { font-size: 12px; color: #444; margin-top: 12px; }

        /* Stats */
        .stats { display: flex; justify-content: center; gap: 0; flex-wrap: wrap; padding: 0 24px 72px; }
        .stat { text-align: center; padding: 0 40px; border-right: 1px solid rgba(255,255,255,0.06); }
        .stat:last-child { border-right: none; }
        .stat-num { font-size: 36px; font-weight: 800; letter-spacing: -1px; color: #fff; }
        .stat-label { font-size: 12px; color: #555; margin-top: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Section label */
        .section-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #555; text-transform: uppercase; margin-bottom: 24px; }

        /* Pipeline */
        .pipeline { background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 64px 24px; }
        .pipeline-inner { max-width: 960px; margin: 0 auto; }
        .pipeline-steps { display: flex; align-items: stretch; gap: 0; overflow-x: auto; padding-bottom: 4px; }
        .pipeline-step {
          flex: 1; min-width: 148px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 20px 16px; text-align: center; position: relative;
        }
        .pipeline-step-num { font-size: 10px; font-weight: 700; color: #555; letter-spacing: 1px; margin-bottom: 10px; }
        .pipeline-step-tool { font-size: 11px; color: #a78bfa; font-weight: 600; margin-bottom: 6px; word-break: break-all; }
        .pipeline-step-label { font-size: 12px; color: #666; }
        .pipeline-arrow { display: flex; align-items: center; padding: 0 6px; color: #333; font-size: 18px; flex-shrink: 0; }
        .pipeline-caption { text-align: center; color: #444; font-size: 13px; margin-top: 24px; }

        /* What to build */
        .build-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
        .build-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 22px;
          transition: border-color 0.2s, background 0.2s;
        }
        .build-card:hover { border-color: rgba(167,139,250,0.25); background: rgba(167,139,250,0.04); }
        .build-icon { font-size: 28px; margin-bottom: 12px; }
        .build-tag { font-size: 10px; font-weight: 700; color: #a78bfa; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
        .build-title { font-size: 15px; font-weight: 700; color: #f0f0fa; margin-bottom: 8px; }
        .build-desc { font-size: 13px; color: #666; line-height: 1.6; margin: 0; }

        /* Prompts */
        .prompts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 10px; }
        .prompt-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 14px 18px;
          font-size: 14px; color: #666; line-height: 1.6; font-style: italic;
          transition: border-color 0.2s;
        }
        .prompt-card:hover { border-color: rgba(255,255,255,0.12); color: #888; }

        /* Tools */
        .tool-group { margin-bottom: 28px; }
        .tool-group-header {
          display: flex; align-items: center; gap: 12px;
          cursor: pointer; user-select: none;
          padding: 14px 18px;
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; margin-bottom: 0;
          transition: background 0.2s;
        }
        .tool-group-header:hover { background: rgba(255,255,255,0.04); }
        .tool-group-header.open { border-radius: 12px 12px 0 0; border-bottom-color: transparent; }
        .tool-group-icon { font-size: 16px; }
        .tool-group-name { font-weight: 700; font-size: 14px; }
        .tool-group-count { margin-left: auto; font-size: 12px; color: #555; }
        .tool-group-chevron { color: #555; font-size: 12px; transition: transform 0.2s; }
        .tool-group-chevron.open { transform: rotate(180deg); }
        .tool-list {
          border: 1px solid rgba(255,255,255,0.06); border-top: none;
          border-radius: 0 0 12px 12px; overflow: hidden;
        }
        .tool-item {
          display: flex; align-items: flex-start; gap: 14;
          padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .tool-item:last-child { border-bottom: none; }
        .tool-item:hover { background: rgba(255,255,255,0.02); }
        .tool-name-wrap { display: flex; align-items: center; gap: 8px; flex-shrink: 0; min-width: 200px; }
        .tool-name { font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 6px; white-space: nowrap; }
        .tool-star { color: #f59e0b; font-size: 12px; }
        .tool-desc { font-size: 13px; color: #666; line-height: 1.55; }

        /* Network */
        .net-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .net-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 22px; }
        .net-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .net-badge { font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; letter-spacing: 1px; }
        .net-name { font-weight: 700; font-size: 15px; color: #f0f0fa; }
        .net-chainid { margin-left: auto; font-size: 12px; color: #555; }
        .net-row { margin-bottom: 12px; }
        .net-row-label { font-size: 10px; color: #555; display: block; margin-bottom: 3px; letter-spacing: 0.5px; font-weight: 600; text-transform: uppercase; }
        .net-row-val { font-size: 11.5px; color: #a78bfa; word-break: break-all; }

        /* Footer */
        .footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 36px 24px; text-align: center; }
        .footer p { color: #444; font-size: 13px; margin: 0; line-height: 2; }
        .footer a { color: #7c3aed; transition: color 0.2s; }
        .footer a:hover { color: #a78bfa; }

        /* Section wrapper */
        .section { max-width: 960px; margin: 0 auto; padding: 72px 24px; }
        .section-alt { background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 72px 24px; }

        /* Responsive */
        @media (max-width: 640px) {
          .nav { padding: 0 20px; }
          .nav-links { gap: 16px; }
          .nav-links a { font-size: 13px; }
          .hero { padding: 72px 20px 60px; }
          .hero-title { letter-spacing: -1.5px; }
          .hero-sub { font-size: 16px; }
          .stat { padding: 0 20px; }
          .stat-num { font-size: 28px; }
          .net-grid { grid-template-columns: 1fr; }
          .tool-name-wrap { min-width: 160px; }
          .pipeline-steps { gap: 4px; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-logo">
          <span>⚡ Zaxxie</span>
          <span className="nav-badge">24 Tools · v5.2</span>
        </div>
        <div className="nav-links">
          <a href="https://docs.0g.ai" target="_blank" rel="noreferrer">Docs</a>
          <a href="https://build.0g.ai" target="_blank" rel="noreferrer">Build Hub</a>
          <a href="https://github.com/zaxcoraider/zaxxie" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span>⚡</span>
          Agentic MCP Server · Powered by 0G Zero Gravity
        </div>
        <h1 className="hero-title">
          Idea → Live dApp.<br />One conversation.
        </h1>
        <p className="hero-sub">
          Connect Zaxxie to Claude. Describe what you want to build.
          Zaxxie generates code, deploys contracts, pushes to GitHub,
          ships to Vercel — and remembers everything.
        </p>
        <div className="hero-cmd">
          <code>{MCP_CMD}</code>
          <CopyButton text={MCP_CMD} />
        </div>
        <p className="hero-hint">Paste this in your terminal · Works with Claude Code</p>
      </section>

      {/* ── STATS ── */}
      <div className="stats">
        {[
          { num: "24", label: "MCP Tools" },
          { num: "5", label: "0G Features" },
          { num: "3", label: "UI Styles" },
          { num: "1", label: "Conversation" },
        ].map((s) => (
          <div key={s.label} className="stat">
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── PIPELINE ── */}
      <div className="section-alt">
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="section-label" style={{ textAlign: "center", marginBottom: 36 }}>
            The full agentic pipeline
          </div>
          <div className="pipeline-steps">
            {PIPELINE.map((p, i) => (
              <>
                <div key={p.step} className="pipeline-step">
                  <div className="pipeline-step-num">STEP {p.step}</div>
                  <code className="pipeline-step-tool">{p.tool}</code>
                  <div className="pipeline-step-label">{p.label}</div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div key={`arrow-${i}`} className="pipeline-arrow">→</div>
                )}
              </>
            ))}
          </div>
          <p className="pipeline-caption">
            From a single sentence to a live, deployed dApp — no terminal, no local tools, no manual steps.
          </p>
        </div>
      </div>

      {/* ── WHAT YOU CAN BUILD ── */}
      <div className="section">
        <div className="section-label">What you can build</div>
        <div className="build-grid">
          {WHAT_TO_BUILD.map((item) => (
            <div key={item.title} className="build-card">
              <div className="build-icon">{item.icon}</div>
              <div className="build-tag">{item.tag}</div>
              <div className="build-title">{item.title}</div>
              <p className="build-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── EXAMPLE PROMPTS ── */}
      <div className="section-alt">
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="section-label">Try saying this to Claude</div>
          <div className="prompts-grid">
            {PROMPTS.map((p) => (
              <div key={p} className="prompt-card">&ldquo;{p}&rdquo;</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOOLS ── */}
      <div className="section">
        <div className="section-label">24 MCP Tools — click a group to expand</div>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 28, marginTop: 0 }}>
          Grouped by capability. ★ marks tools called most often by Claude.
        </p>
        {TOOLS.map((group) => {
          const isOpen = openGroup === group.group;
          return (
            <div key={group.group} className="tool-group">
              <div
                className={`tool-group-header${isOpen ? " open" : ""}`}
                onClick={() => setOpenGroup(isOpen ? null : group.group)}
                style={{ borderColor: isOpen ? `${group.accent}44` : undefined }}
              >
                <span className="tool-group-icon">{group.icon}</span>
                <span className="tool-group-name" style={{ color: group.accent }}>{group.group}</span>
                <span className="tool-group-count">{group.items.length} tools</span>
                <span className={`tool-group-chevron${isOpen ? " open" : ""}`}>▼</span>
              </div>
              {isOpen && (
                <div className="tool-list">
                  {group.items.map((tool) => (
                    <div key={tool.name} className="tool-item">
                      <div className="tool-name-wrap">
                        <code
                          className="tool-name"
                          style={{ background: group.dim, color: group.accent }}
                        >
                          {tool.name}
                        </code>
                        {"star" in tool && tool.star && <span className="tool-star">★</span>}
                      </div>
                      <span className="tool-desc">{tool.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── NETWORK ENDPOINTS ── */}
      <div className="section-alt">
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="section-label">Network endpoints</div>
          <div className="net-grid">
            {[
              {
                label: "TESTNET", name: "Galileo", chainId: "16602",
                badgeStyle: { background: "rgba(16,185,129,0.12)", color: "#10b981" },
                rows: [
                  ["EVM RPC", "https://evmrpc-testnet.0g.ai"],
                  ["Storage Indexer", "https://indexer-storage-testnet-turbo.0g.ai"],
                  ["Explorer", "https://chainscan-galileo.0g.ai"],
                  ["Storage Scan", "https://storagescan-galileo.0g.ai"],
                  ["Faucet", "https://faucet.0g.ai"],
                ],
              },
              {
                label: "MAINNET", name: "Aristotle", chainId: "16661",
                badgeStyle: { background: "rgba(59,130,246,0.12)", color: "#3b82f6" },
                rows: [
                  ["EVM RPC", "https://evmrpc.0g.ai"],
                  ["Storage Indexer", "https://indexer-storage-turbo.0g.ai"],
                  ["Explorer", "https://chainscan.0g.ai"],
                  ["Storage Scan", "https://storagescan.0g.ai"],
                  ["AI Marketplace", "https://compute-marketplace.0g.ai/inference"],
                ],
              },
            ].map((net) => (
              <div key={net.label} className="net-card">
                <div className="net-header">
                  <span className="net-badge" style={net.badgeStyle}>{net.label}</span>
                  <span className="net-name">{net.name}</span>
                  <span className="net-chainid">Chain ID: {net.chainId}</span>
                </div>
                {net.rows.map(([label, val]) => (
                  <div key={label} className="net-row">
                    <span className="net-row-label">{label}</span>
                    <code className="net-row-val">{val}</code>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <p>
          Built for{" "}
          <a href="https://0g.ai" target="_blank" rel="noreferrer">0G Zero Gravity</a>
          {" "}— The Largest AI L1
          &nbsp;·&nbsp;
          <a href="https://build.0g.ai" target="_blank" rel="noreferrer">Builder Hub</a>
          &nbsp;·&nbsp;
          <a href="https://github.com/zaxcoraider/zaxxie" target="_blank" rel="noreferrer">GitHub</a>
          &nbsp;·&nbsp;
          <a href="https://discord.gg/0glabs" target="_blank" rel="noreferrer">Discord</a>
        </p>
        <p style={{ marginTop: 8, fontSize: 12 }}>
          Zaxxie v5.2 · 24 MCP Tools · Claude Code · 0G Zero Gravity
        </p>
      </footer>
    </>
  );
}
