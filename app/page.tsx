export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 780, margin: "0 auto", padding: "60px 20px", color: "#1a1a2e" }}>
      <h1 style={{ fontSize: 52, fontWeight: 800, marginBottom: 4, letterSpacing: -1 }}>
        ⚡ Zaxxie
      </h1>
      <p style={{ fontSize: 20, color: "#666", marginBottom: 40 }}>
        The Ultimate 0G dApp Building Agent — powered by MCP
      </p>

      <div style={{ background: "#1e1e2e", borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 8px 0" }}>Connect with Claude Code</p>
        <code style={{ color: "#a78bfa", fontSize: 15, wordBreak: "break-all" }}>
          claude mcp add zaxxie --transport http https://zaxxie.vercel.app/api/mcp
        </code>
      </div>

      <h2 style={{ fontSize: 22, marginBottom: 16 }}>What can Zaxxie build?</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {[
          { title: "0G Chain", desc: "Deploy smart contracts, ERC-20 tokens, Hardhat & Foundry", color: "#f5f3ff" },
          { title: "0G Storage", desc: "Upload/download files, KV store, browser & stream support", color: "#f0fdf4" },
          { title: "0G Compute", desc: "AI inference, text-to-image, speech-to-text, fine-tuning", color: "#fefce8" },
          { title: "0G DA", desc: "Data availability for rollups (OP Stack, Arbitrum Nitro)", color: "#fef2f2" },
          { title: "INFTs", desc: "AI agent NFTs via ERC-7857, marketplaces, AI-as-a-Service", color: "#eff6ff" },
          { title: "Full Stack", desc: "Next.js + Hardhat + 0G Storage + Compute — complete dApps", color: "#fdf4ff" },
        ].map((item) => (
          <div key={item.title} style={{ background: item.color, borderRadius: 10, padding: 16 }}>
            <strong style={{ fontSize: 15 }}>{item.title}</strong>
            <p style={{ fontSize: 13, color: "#555", margin: "4px 0 0 0" }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Network Endpoints</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        <div style={{ background: "#f8f8fa", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>TESTNET</span>
            <strong style={{ fontSize: 14 }}>Galileo — Chain ID 16602</strong>
          </div>
          {[
            ["EVM RPC", "https://evmrpc-testnet.0g.ai"],
            ["Storage Indexer", "https://indexer-storage-testnet-turbo.0g.ai"],
            ["Explorer", "https://chainscan-galileo.0g.ai"],
            ["Storage Scan", "https://storagescan-galileo.0g.ai"],
            ["Faucet", "https://faucet.0g.ai"],
          ].map(([label, url]) => (
            <div key={label} style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#888", display: "block" }}>{label}</span>
              <code style={{ fontSize: 11, color: "#6C3CE1", wordBreak: "break-all" }}>{url}</code>
            </div>
          ))}
        </div>

        <div style={{ background: "#f8f8fa", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>MAINNET</span>
            <strong style={{ fontSize: 14 }}>Aristotle — Chain ID 16661</strong>
          </div>
          {[
            ["EVM RPC", "https://evmrpc.0g.ai"],
            ["Storage Indexer", "https://indexer-storage-turbo.0g.ai"],
            ["Explorer", "https://chainscan.0g.ai"],
            ["Storage Scan", "https://storagescan.0g.ai"],
          ].map(([label, url]) => (
            <div key={label} style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#888", display: "block" }}>{label}</span>
              <code style={{ fontSize: 11, color: "#6C3CE1", wordBreak: "break-all" }}>{url}</code>
            </div>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Try it</h2>
      <div style={{ background: "#f8f8fa", borderRadius: 10, padding: 16, marginBottom: 32 }}>
        <p style={{ fontSize: 14, lineHeight: 2, margin: 0 }}>
          <em>&quot;Hey Zaxxie, build me a Next.js dApp with 0G storage and compute&quot;</em><br/>
          <em>&quot;Scaffold a Hardhat project to deploy an ERC-20 on 0G chain&quot;</em><br/>
          <em>&quot;Build an AI chatbot app using 0G decentralized inference&quot;</em><br/>
          <em>&quot;Create an INFT marketplace for AI agents on 0G&quot;</em>
        </p>
      </div>

      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Tools</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 40 }}>
        <thead><tr style={{ borderBottom: "2px solid #e5e7eb" }}>
          <th style={{ textAlign: "left", padding: 8 }}>Tool</th>
          <th style={{ textAlign: "left", padding: 8 }}>Description</th>
        </tr></thead>
        <tbody>
          {[
            ["zaxxie_build", "⭐ Main tool — describe any idea, get a complete runnable dApp with all files"],
            ["zaxxie_onboard", "Wallet setup, MetaMask, add 0G network, get testnet tokens — for beginners"],
            ["zaxxie_troubleshoot", "Fix common errors — EVM version, gas, storage, compute, deploy issues"],
            ["zaxxie_get_docs", "Full 0G docs — chain, storage, compute, DA, INFTs"],
            ["zaxxie_scaffold", "Generate complete project scaffolds with all code"],
            ["zaxxie_network", "RPCs, chain IDs, contracts, faucets, explorer links"],
            ["zaxxie_models", "List available AI models with pricing"],
          ].map(([tool, desc]) => (
            <tr key={tool} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: 8 }}><code style={{ background: "#f5f3ff", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>{tool}</code></td>
              <td style={{ padding: 8 }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ color: "#999", fontSize: 13 }}>
        Built for <a href="https://0g.ai" style={{ color: "#6C3CE1" }}>0G (Zero Gravity)</a> — The Largest AI L1 &nbsp;|&nbsp;
        <a href="https://build.0g.ai" style={{ color: "#6C3CE1" }}>Builder Hub</a> &nbsp;|&nbsp;
        <a href="https://github.com/zaxcoraider/zaxxie" style={{ color: "#6C3CE1" }}>GitHub</a>
      </p>
    </main>
  );
}
