"use client";
import { useState, useEffect } from "react";

const MCP_CMD = "claude mcp add zaxxie --transport http https://zaxxie.vercel.app/api/mcp";

/* ─────────────── Copy Button ─────────────── */
function CopyBtn({ text, children }: { text: string; children?: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  function copy() { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }
  return (
    <button onClick={copy} className={`cpbtn${ok ? " ok" : ""}`}>
      {ok ? "✓ Copied!" : (children ?? "Copy")}
    </button>
  );
}

/* ─────────────── Typing terminal ─────────────── */
const DEMO_LINES = [
  { role: "user",    text: "Hey Zaxxie, build me an NFT marketplace on 0G with glassmorphism UI" },
  { role: "zaxxie",  text: "Detected: infts, storage — scaffolding Next.js + RainbowKit + 0G Storage..." },
  { role: "zaxxie",  text: "✓ Generated 14 files  ✓ components/ui.tsx  ✓ lib/storage.ts  ✓ contracts/NFT.sol" },
  { role: "user",    text: "Now push it to GitHub and deploy to Vercel" },
  { role: "zaxxie",  text: "✓ Created repo: github.com/you/nft-marketplace" },
  { role: "zaxxie",  text: "✓ Deployed → https://nft-marketplace-xyz.vercel.app" },
  { role: "user",    text: "Save the contract address to memory" },
  { role: "zaxxie",  text: "✓ Saved to memory — recall anytime with zaxxie_recall" },
];

function Terminal() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= DEMO_LINES.length) return;
    const t = setTimeout(() => setShown(s => s + 1), shown === 0 ? 800 : 1400);
    return () => clearTimeout(t);
  }, [shown]);
  return (
    <div className="terminal">
      <div className="terminal-bar">
        <span className="dot r" /><span className="dot y" /><span className="dot g" />
        <span className="terminal-title">zaxxie · claude code</span>
      </div>
      <div className="terminal-body">
        {DEMO_LINES.slice(0, shown).map((l, i) => (
          <div key={i} className={`tline ${l.role}`}>
            <span className="tpfx">{l.role === "user" ? "you" : "⚡"}</span>
            <span className="tmsg">{l.text}</span>
          </div>
        ))}
        {shown < DEMO_LINES.length && <span className="tcursor" />}
      </div>
    </div>
  );
}

/* ─────────────── Data ─────────────── */
const TOOLS = [
  { group: "Build & Generate", accent: "#8b5cf6", dim: "rgba(139,92,246,0.1)", icon: "⚙️", items: [
    { name: "zaxxie_build",    star: true, desc: "Main tool — plain English → every file, install commands, numbered steps. Supports style: glassmorphism / minimal / bento." },
    { name: "zaxxie_scaffold",             desc: "Same structured output as build with explicit feature selection." },
  ]},
  { group: "Agentic Flow", accent: "#6366f1", dim: "rgba(99,102,241,0.1)", icon: "🚀", items: [
    { name: "zaxxie_push_github",     desc: "Push all generated files to a new GitHub repo. Returns live repo URL." },
    { name: "zaxxie_deploy_vercel",   desc: "Deploy GitHub repo to Vercel and get a live dApp URL instantly." },
    { name: "zaxxie_upload",          desc: "Server-side upload to 0G Storage. Base64 in → root hash out." },
    { name: "zaxxie_deploy_contract", desc: "Paste Solidity → compiled with solc-js → deployed on 0G. Zero local tooling." },
    { name: "zaxxie_call_contract",   desc: "Read or write any deployed 0G contract. Reads need no key." },
  ]},
  { group: "Memory", accent: "#06b6d4", dim: "rgba(6,182,212,0.1)", icon: "🧠", items: [
    { name: "zaxxie_remember", desc: "Save contracts, root hashes, projects, notes — keyed to your wallet." },
    { name: "zaxxie_recall",   desc: "Retrieve everything saved for your wallet in one call." },
  ]},
  { group: "Live On-Chain", accent: "#10b981", dim: "rgba(16,185,129,0.1)", icon: "⛓️", items: [
    { name: "zaxxie_check_wallet",   desc: "Live balance + tx count from 0G RPC. Faucet links if empty." },
    { name: "zaxxie_check_tx",       desc: "Live tx status — confirmed/pending/failed, gas used, contract address." },
    { name: "zaxxie_faucet",         desc: "Check balance + exact instructions to get free testnet 0G tokens." },
    { name: "zaxxie_preflight",      desc: "Full health check before deploying — wallet, RPC, storage, compute." },
    { name: "zaxxie_verify_contract",desc: "Check if a contract is verified on 0G explorer. Returns ABI." },
    { name: "zaxxie_monitor",        desc: "Watch any deployed contract for events. Decoded args, last N blocks." },
  ]},
  { group: "Knowledge & Docs", accent: "#f59e0b", dim: "rgba(245,158,11,0.1)", icon: "📚", items: [
    { name: "zaxxie_live_docs",   desc: "Fetch latest docs from docs.0g.ai at call time — always current." },
    { name: "zaxxie_get_docs",    desc: "Complete cached 0G knowledge — chain, storage, compute, DA, INFTs." },
    { name: "zaxxie_live_models", desc: "Live AI model list from 0G compute marketplace. Real pricing, always current." },
    { name: "zaxxie_models",      desc: "Cached AI models on 0G Compute — LLMs, image gen, speech-to-text." },
    { name: "zaxxie_network",     desc: "RPCs, chain IDs, storage indexers, contract addresses, faucets." },
  ]},
  { group: "Bug Finder", accent: "#ef4444", dim: "rgba(239,68,68,0.1)", icon: "🐛", items: [
    { name: "zaxxie_debug_tx",        desc: "Failed tx hash → replayed on-chain → exact revert reason + fix suggestions." },
    { name: "zaxxie_audit_contract",  desc: "Paste Solidity → static security audit. Reentrancy, overflow, 10+ checks. Severity-rated." },
  ]},
  { group: "Guidance", accent: "#64748b", dim: "rgba(100,116,139,0.1)", icon: "🧭", items: [
    { name: "zaxxie_onboard",      desc: "MetaMask → add 0G network → get tokens → export key. Full beginner guide." },
    { name: "zaxxie_troubleshoot", desc: "Paste any error → get the exact fix for 0G-specific issues." },
  ]},
];

const FEATURES = [
  { icon: "🗄️", tag: "0G Storage",  title: "Decentralized Storage",  desc: "Upload files to 0G Storage. Get a permanent root hash. No IPFS, no S3, no middlemen." },
  { icon: "🤖", tag: "0G Compute",  title: "AI-Powered dApps",       desc: "Run LLMs, image gen, speech-to-text — 90% cheaper than OpenAI. Fully decentralized GPU marketplace." },
  { icon: "📜", tag: "0G Chain",    title: "Smart Contracts",         desc: "Paste Solidity → deployed server-side. No local Hardhat. 11,000 TPS, sub-second finality." },
  { icon: "🧠", tag: "INFTs",       title: "Intelligent NFTs",        desc: "Tokenize AI agents as NFTs (ERC-7857). Sell, license, and transfer AI models with encrypted metadata." },
  { icon: "🔗", tag: "0G DA",       title: "Rollup DA Layer",         desc: "Use 0G as the data availability layer for your OP Stack or Arbitrum rollup. Max blob 32MB." },
  { icon: "🚀", tag: "Full Stack",  title: "Full-Stack dApps",        desc: "Next.js + RainbowKit + Tailwind + shadcn. Generated, GitHub-pushed, Vercel-deployed." },
];

const PIPELINE = [
  { n: "01", tool: "zaxxie_build",           label: "All files generated"   },
  { n: "02", tool: "zaxxie_deploy_contract", label: "Contract on-chain"     },
  { n: "03", tool: "zaxxie_push_github",     label: "GitHub repo created"   },
  { n: "04", tool: "zaxxie_deploy_vercel",   label: "Live Vercel URL"       },
  { n: "05", tool: "zaxxie_remember",        label: "Saved to memory"       },
];

const PROMPTS = [
  "Build me a decentralized file storage app, push to GitHub and deploy to Vercel",
  "Create an AI chatbot running on 0G decentralized compute and ship it live",
  "Deploy an ERC-20 token on 0G — here's my Solidity, compile and deploy it",
  "Upload my whitepaper to 0G Storage and save the root hash to memory",
  "My tx 0xABC failed — what went wrong and how do I fix it?",
  "Audit this Solidity contract before I deploy it — find any security bugs",
];

/* ─────────────── Page ─────────────── */
export default function Home() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #07070f; color: #ddddf0;
               font-family: system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
        code { font-family: "SF Mono", "Fira Code", Consolas, monospace; }

        /* ── Keyframes ── */
        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow     { 0%,100% { opacity:.4; } 50% { opacity:.8; } }
        @keyframes blink    { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes gradShift{ 0% { background-position:0% 50%; } 100% { background-position:200% 50%; } }
        @keyframes spin     { to { transform:rotate(360deg); } }

        /* ── Nav ── */
        .nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 62px;
          background: rgba(7,7,15,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        }
        .nav-left  { display:flex; align-items:center; gap:12px; }
        .nav-logo  { font-weight:800; font-size:18px; letter-spacing:-.5px; color:#fff; }
        .nav-logo span { color:#8b5cf6; }
        .nav-pill  {
          background: rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3);
          color:#a78bfa; font-size:11px; font-weight:700; padding:3px 10px;
          border-radius:999px; letter-spacing:.5px;
        }
        .nav-links { display:flex; gap:28px; }
        .nav-links a { color:#555; font-size:14px; font-weight:500; transition:color .2s; }
        .nav-links a:hover { color:#a78bfa; }
        .nav-cta {
          background:#7c3aed; color:#fff; font-size:13px; font-weight:600;
          padding:8px 18px; border-radius:8px; border:none; cursor:pointer;
          transition:background .2s, transform .1s;
        }
        .nav-cta:hover { background:#6d28d9; }
        .nav-cta:active { transform:scale(.97); }

        /* ── Hero ── */
        .hero {
          position: relative; text-align: center;
          padding: 110px 24px 80px; overflow: hidden;
        }
        .hero-orb {
          position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none;
          animation: glow 4s ease-in-out infinite;
        }
        .hero-orb-1 { width:700px; height:500px; top:-180px; left:50%; transform:translateX(-50%);
                      background:radial-gradient(ellipse,rgba(124,58,237,.25) 0%,transparent 70%); }
        .hero-orb-2 { width:400px; height:300px; bottom:-100px; left:10%;
                      background:radial-gradient(ellipse,rgba(99,102,241,.12) 0%,transparent 70%); animation-delay:2s; }
        .hero-orb-3 { width:300px; height:250px; bottom:-80px; right:8%;
                      background:radial-gradient(ellipse,rgba(6,182,212,.1) 0%,transparent 70%); animation-delay:1s; }

        .hero-eyebrow {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(139,92,246,.12); border:1px solid rgba(139,92,246,.3);
          border-radius:999px; padding:5px 18px;
          font-size:11px; font-weight:700; letter-spacing:1.2px; color:#a78bfa;
          text-transform:uppercase; margin-bottom:32px;
          animation: fadeUp .6s ease both;
        }
        .hero-eyebrow-dot { width:6px; height:6px; border-radius:50%; background:#8b5cf6; animation:glow 2s infinite; }

        .hero-title {
          font-size:clamp(48px,9vw,96px); font-weight:900;
          line-height:1.02; letter-spacing:-3.5px; margin:0 0 28px;
          background: linear-gradient(135deg, #fff 20%, #c4b5fd 55%, #818cf8 80%, #38bdf8 100%);
          background-size:200% 200%;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
          animation: fadeUp .7s .1s ease both, gradShift 6s linear infinite;
        }
        .hero-sub {
          font-size:18px; color:#6b6b8a; max-width:520px;
          margin:0 auto 52px; line-height:1.75;
          animation: fadeUp .7s .2s ease both;
        }

        .hero-cmd-wrap {
          display:inline-flex; align-items:center; gap:14px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.09);
          border-radius:14px; padding:14px 16px 14px 20px;
          max-width:100%; box-shadow:0 0 60px rgba(124,58,237,.12);
          animation: fadeUp .7s .3s ease both;
        }
        .hero-cmd-wrap code { color:#c4b5fd; font-size:13.5px; word-break:break-all; text-align:left; }

        .hero-hint { font-size:12px; color:#3a3a55; margin-top:14px; animation:fadeUp .7s .4s ease both; }

        /* ── Copy button ── */
        .cpbtn {
          background:#7c3aed; color:#fff; border:none; border-radius:8px;
          padding:9px 18px; font-size:13px; font-weight:600;
          cursor:pointer; transition:background .2s, transform .1s; white-space:nowrap; flex-shrink:0;
        }
        .cpbtn:hover  { background:#6d28d9; }
        .cpbtn:active { transform:scale(.97); }
        .cpbtn.ok     { background:#059669; }

        /* ── Stats ── */
        .stats-row {
          display:flex; justify-content:center; flex-wrap:wrap;
          padding:0 24px 80px; gap:0;
          animation: fadeUp .7s .4s ease both;
        }
        .stat { text-align:center; padding:0 44px; border-right:1px solid rgba(255,255,255,0.06); }
        .stat:last-child { border-right:none; }
        .stat-n { font-size:38px; font-weight:800; letter-spacing:-1.5px; color:#fff; }
        .stat-l { font-size:11px; color:#444; margin-top:5px; letter-spacing:.8px; text-transform:uppercase; font-weight:600; }

        /* ── Terminal ── */
        .terminal {
          background:#0b0b17; border:1px solid rgba(255,255,255,0.08);
          border-radius:14px; overflow:hidden;
          box-shadow:0 24px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(139,92,246,.15);
          max-width:680px; margin:0 auto;
        }
        .terminal-bar {
          display:flex; align-items:center; gap:7px; padding:12px 16px;
          background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .dot { width:12px; height:12px; border-radius:50%; }
        .dot.r { background:#ff5f57; }
        .dot.y { background:#febc2e; }
        .dot.g { background:#28c840; }
        .terminal-title { margin-left:auto; font-size:12px; color:#444; }
        .terminal-body { padding:20px; min-height:200px; }
        .tline { display:flex; gap:10px; margin-bottom:14px; animation:fadeUp .3s ease both; }
        .tpfx { font-size:12px; font-weight:700; flex-shrink:0; min-width:32px; margin-top:1px; }
        .tline.user .tpfx   { color:#6366f1; }
        .tline.zaxxie .tpfx { color:#8b5cf6; }
        .tmsg { font-size:13px; color:#b0b0d0; line-height:1.6; }
        .tline.user .tmsg   { color:#e0e0f8; }
        .tline.zaxxie .tmsg { color:#9090c0; }
        .tcursor {
          display:inline-block; width:8px; height:16px;
          background:#7c3aed; border-radius:2px; margin-top:2px;
          animation:blink .8s step-end infinite;
        }

        /* ── Section wrappers ── */
        .sec  { max-width:980px; margin:0 auto; padding:80px 24px; }
        .sec-alt { background:rgba(255,255,255,0.018); border-top:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05); padding:80px 24px; }
        .sec-alt-inner { max-width:980px; margin:0 auto; }
        .sec-label { font-size:11px; font-weight:700; letter-spacing:2px; color:#444; text-transform:uppercase; margin-bottom:28px; }

        /* ── Pipeline ── */
        .pipe-row  { display:flex; align-items:stretch; gap:0; overflow-x:auto; padding-bottom:4px; }
        .pipe-step {
          flex:1; min-width:140px;
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
          border-radius:12px; padding:18px 14px; text-align:center;
          transition:border-color .2s, background .2s;
        }
        .pipe-step:hover { border-color:rgba(139,92,246,.35); background:rgba(139,92,246,.05); }
        .pipe-n    { font-size:10px; font-weight:700; color:#444; letter-spacing:1px; margin-bottom:10px; }
        .pipe-tool { font-size:10.5px; color:#a78bfa; font-weight:600; margin-bottom:5px; word-break:break-all; }
        .pipe-lbl  { font-size:11px; color:#555; }
        .pipe-arr  { display:flex; align-items:center; padding:0 6px; color:#2a2a40; font-size:18px; flex-shrink:0; }
        .pipe-cap  { text-align:center; color:#383858; font-size:13px; margin-top:20px; }

        /* ── Feature cards ── */
        .feat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
        .feat-card {
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
          border-radius:14px; padding:24px; position:relative; overflow:hidden;
          transition:border-color .25s, background .25s, transform .2s;
        }
        .feat-card::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(139,92,246,.05) 0%,transparent 60%);
          opacity:0; transition:opacity .25s;
        }
        .feat-card:hover { border-color:rgba(167,139,250,.28); transform:translateY(-2px); }
        .feat-card:hover::before { opacity:1; }
        .feat-icon  { font-size:30px; margin-bottom:12px; }
        .feat-tag   { font-size:10px; font-weight:700; color:#8b5cf6; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:7px; }
        .feat-title { font-size:15px; font-weight:700; color:#f0f0fa; margin-bottom:8px; }
        .feat-desc  { font-size:13px; color:#585878; line-height:1.65; margin:0; }

        /* ── Prompt cards ── */
        .prompt-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:10px; }
        .prompt-card {
          background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06);
          border-radius:10px; padding:14px 18px; font-size:13.5px; color:#555;
          line-height:1.65; font-style:italic; cursor:pointer;
          transition:border-color .2s, color .2s, background .2s;
          display:flex; align-items:flex-start; gap:10px;
        }
        .prompt-card:hover { border-color:rgba(255,255,255,.12); color:#888; background:rgba(255,255,255,.03); }
        .prompt-q { color:#7c3aed; font-style:normal; font-size:15px; flex-shrink:0; margin-top:1px; }

        /* ── Tool groups ── */
        .tg-wrap   { display:flex; flex-direction:column; gap:10px; }
        .tg-header {
          display:flex; align-items:center; gap:12px;
          padding:14px 18px; cursor:pointer; user-select:none;
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
          border-radius:12px; transition:background .15s;
        }
        .tg-header:hover { background:rgba(255,255,255,.04); }
        .tg-header.open  { border-radius:12px 12px 0 0; border-bottom-color:transparent; }
        .tg-icon  { font-size:15px; }
        .tg-name  { font-weight:700; font-size:14px; flex:1; }
        .tg-count { font-size:12px; color:#444; }
        .tg-chev  { font-size:11px; color:#444; transition:transform .2s; }
        .tg-chev.open { transform:rotate(180deg); }
        .tg-list  {
          border:1px solid rgba(255,255,255,0.06); border-top:none;
          border-radius:0 0 12px 12px; overflow:hidden;
        }
        .tg-item  {
          display:flex; align-items:flex-start; gap:14px;
          padding:13px 18px; border-bottom:1px solid rgba(255,255,255,0.04);
          transition:background .15s;
        }
        .tg-item:last-child { border-bottom:none; }
        .tg-item:hover { background:rgba(255,255,255,.02); }
        .tg-name-box { display:flex; align-items:center; gap:7px; flex-shrink:0; min-width:210px; }
        .tg-tool { font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:6px; white-space:nowrap; }
        .tg-star { color:#f59e0b; font-size:13px; }
        .tg-desc { font-size:13px; color:#555; line-height:1.6; }

        /* ── How it works ── */
        .hiw-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; }
        .hiw-card {
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
          border-radius:14px; padding:22px 20px;
        }
        .hiw-num  { font-size:32px; font-weight:800; color:rgba(139,92,246,.3); letter-spacing:-1px; margin-bottom:10px; }
        .hiw-head { font-size:14px; font-weight:700; color:#e0e0f8; margin-bottom:8px; }
        .hiw-body { font-size:13px; color:#555; line-height:1.6; margin:0; }

        /* ── Network ── */
        .net-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .net-card {
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
          border-radius:14px; padding:24px;
        }
        .net-head { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
        .net-badge { font-size:10px; font-weight:800; padding:3px 10px; border-radius:999px; letter-spacing:1px; }
        .net-name  { font-weight:700; font-size:15px; color:#f0f0fa; }
        .net-cid   { margin-left:auto; font-size:12px; color:#444; }
        .net-row   { margin-bottom:13px; }
        .net-lbl   { font-size:10px; color:#444; display:block; margin-bottom:3px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
        .net-val   { font-size:11.5px; color:#a78bfa; word-break:break-all; }

        /* ── Footer ── */
        .footer { border-top:1px solid rgba(255,255,255,.05); padding:40px 24px; text-align:center; }
        .footer p { color:#333; font-size:13px; margin:0 0 6px; line-height:2; }
        .footer a { color:#7c3aed; transition:color .2s; }
        .footer a:hover { color:#a78bfa; }
        .footer-badge {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(139,92,246,.1); border:1px solid rgba(139,92,246,.2);
          border-radius:999px; padding:4px 14px; font-size:11px; color:#7c3aed; font-weight:600;
          margin-bottom:16px;
        }

        /* ── Responsive ── */
        @media(max-width:700px){
          .nav { padding:0 20px; }
          .nav-links { gap:16px; }
          .nav-cta { display:none; }
          .hero { padding:80px 20px 60px; }
          .hero-title { letter-spacing:-2px; }
          .stat { padding:0 22px; }
          .stat-n { font-size:28px; }
          .net-grid { grid-template-columns:1fr; }
          .tg-name-box { min-width:160px; }
          .sec { padding:60px 20px; }
        }
        @media(max-width:480px){
          .pipe-row { gap:4px; }
          .pipe-step { min-width:120px; }
          .hero-cmd-wrap { flex-direction:column; align-items:stretch; }
          .cpbtn { text-align:center; }
        }
      `}</style>

      {/* ══ NAV ══ */}
      <nav className="nav">
        <div className="nav-left">
          <span className="nav-logo">⚡ <span>Zaxxie</span></span>
          <span className="nav-pill">24 Tools · v5.2</span>
        </div>
        <div className="nav-links">
          <a href="https://docs.0g.ai" target="_blank" rel="noreferrer">Docs</a>
          <a href="https://build.0g.ai" target="_blank" rel="noreferrer">Build Hub</a>
          <a href="https://github.com/zaxcoraider/zaxxie" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <CopyBtn text={MCP_CMD}>Connect to Claude</CopyBtn>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          Agentic MCP Server · Powered by 0G Zero Gravity
        </div>

        <h1 className="hero-title">
          Idea → Live dApp.<br />One conversation.
        </h1>

        <p className="hero-sub">
          Connect Zaxxie to Claude. Describe what you want to build.
          Zaxxie generates every file, deploys contracts, pushes to GitHub,
          and ships to Vercel — then remembers everything.
        </p>

        <div className="hero-cmd-wrap">
          <code>{MCP_CMD}</code>
          <CopyBtn text={MCP_CMD} />
        </div>
        <p className="hero-hint">Paste this in your terminal · Works with Claude Code</p>
      </section>

      {/* ══ STATS ══ */}
      <div className="stats-row">
        {[
          { n: "24",    l: "MCP Tools"       },
          { n: "5",     l: "0G Features"     },
          { n: "3",     l: "UI Styles"       },
          { n: "11K",   l: "TPS on 0G"       },
          { n: "1",     l: "Conversation"    },
        ].map(s => (
          <div key={s.l} className="stat">
            <div className="stat-n">{s.n}</div>
            <div className="stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      {/* ══ TERMINAL DEMO ══ */}
      <div className="sec-alt">
        <div className="sec-alt-inner">
          <div className="sec-label" style={{ textAlign:"center", marginBottom:36 }}>See it in action</div>
          <Terminal />
        </div>
      </div>

      {/* ══ HOW IT WORKS ══ */}
      <div className="sec">
        <div className="sec-label">How it works</div>
        <div className="hiw-grid">
          {[
            { n:"01", h:"Install in one command", b:"Run the claude mcp add command in your terminal. Zaxxie is instantly available as 24 tools inside Claude." },
            { n:"02", h:"Describe your idea",     b:"Just tell Claude what you want to build — in plain English. No technical specs, no boilerplate." },
            { n:"03", h:"Claude calls Zaxxie",    b:"Claude auto-detects 0G features (storage, compute, chain, DA, INFTs) and calls the right tools." },
            { n:"04", h:"Every file generated",   b:"zaxxie_build returns a structured JSON with every file — TypeScript, Solidity, config, env, README." },
            { n:"05", h:"Deployed in one shot",   b:"Contract compiled + deployed on-chain. Code pushed to GitHub. Live URL from Vercel. All in one conversation." },
          ].map(c => (
            <div key={c.n} className="hiw-card">
              <div className="hiw-num">{c.n}</div>
              <div className="hiw-head">{c.h}</div>
              <p className="hiw-body">{c.b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PIPELINE ══ */}
      <div className="sec-alt">
        <div className="sec-alt-inner">
          <div className="sec-label" style={{ textAlign:"center", marginBottom:36 }}>Full agentic pipeline</div>
          <div className="pipe-row">
            {PIPELINE.map((p, i) => (
              <>
                <div key={p.n} className="pipe-step">
                  <div className="pipe-n">STEP {p.n}</div>
                  <code className="pipe-tool">{p.tool}</code>
                  <div className="pipe-lbl">{p.label}</div>
                </div>
                {i < PIPELINE.length - 1 && <div key={`a${i}`} className="pipe-arr">→</div>}
              </>
            ))}
          </div>
          <p className="pipe-cap">From a single sentence to a live, deployed dApp — no terminal, no local tools, no manual steps.</p>
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <div className="sec">
        <div className="sec-label">What you can build</div>
        <div className="feat-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feat-card">
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-tag">{f.tag}</div>
              <div className="feat-title">{f.title}</div>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PROMPTS ══ */}
      <div className="sec-alt">
        <div className="sec-alt-inner">
          <div className="sec-label">Try saying this to Claude</div>
          <div className="prompt-grid">
            {PROMPTS.map(p => (
              <div key={p} className="prompt-card">
                <span className="prompt-q">&ldquo;</span>
                <span>{p}&rdquo;</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TOOLS ══ */}
      <div className="sec">
        <div className="sec-label">24 MCP Tools — click a category to expand</div>
        <p style={{ color:"#383858", fontSize:13, marginBottom:28, marginTop:0 }}>
          ★ marks tools called most often by Claude automatically.
        </p>
        <div className="tg-wrap">
          {TOOLS.map(g => {
            const isOpen = open === g.group;
            return (
              <div key={g.group}>
                <div
                  className={`tg-header${isOpen ? " open" : ""}`}
                  onClick={() => setOpen(isOpen ? null : g.group)}
                  style={{ borderColor: isOpen ? `${g.accent}44` : undefined }}
                >
                  <span className="tg-icon">{g.icon}</span>
                  <span className="tg-name" style={{ color:g.accent }}>{g.group}</span>
                  <span className="tg-count">{g.items.length} tools</span>
                  <span className={`tg-chev${isOpen ? " open" : ""}`}>▼</span>
                </div>
                {isOpen && (
                  <div className="tg-list">
                    {g.items.map((t) => (
                      <div key={t.name} className="tg-item">
                        <div className="tg-name-box">
                          <code className="tg-tool" style={{ background:g.dim, color:g.accent }}>{t.name}</code>
                          {"star" in t && t.star && <span className="tg-star">★</span>}
                        </div>
                        <span className="tg-desc">{t.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ NETWORK ══ */}
      <div className="sec-alt">
        <div className="sec-alt-inner">
          <div className="sec-label">Network endpoints</div>
          <div className="net-grid">
            {[
              { label:"TESTNET", name:"Galileo",   chainId:"16602",
                bs:{ background:"rgba(16,185,129,.12)", color:"#10b981" },
                rows:[["EVM RPC","https://evmrpc-testnet.0g.ai"],["Storage Indexer","https://indexer-storage-testnet-turbo.0g.ai"],["Explorer","https://chainscan-galileo.0g.ai"],["Storage Scan","https://storagescan-galileo.0g.ai"],["Faucet","https://faucet.0g.ai"]] },
              { label:"MAINNET", name:"Aristotle", chainId:"16661",
                bs:{ background:"rgba(59,130,246,.12)", color:"#3b82f6" },
                rows:[["EVM RPC","https://evmrpc.0g.ai"],["Storage Indexer","https://indexer-storage-turbo.0g.ai"],["Explorer","https://chainscan.0g.ai"],["Storage Scan","https://storagescan.0g.ai"],["AI Marketplace","https://compute-marketplace.0g.ai/inference"]] },
            ].map(net => (
              <div key={net.label} className="net-card">
                <div className="net-head">
                  <span className="net-badge" style={net.bs}>{net.label}</span>
                  <span className="net-name">{net.name}</span>
                  <span className="net-cid">Chain ID: {net.chainId}</span>
                </div>
                {net.rows.map(([lbl, val]) => (
                  <div key={lbl} className="net-row">
                    <span className="net-lbl">{lbl}</span>
                    <code className="net-val">{val}</code>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="footer-badge">⚡ Built for 0G Zero Gravity — The Largest AI L1</div>
        <p>
          <a href="https://0g.ai" target="_blank" rel="noreferrer">0G Website</a>
          &nbsp;·&nbsp;
          <a href="https://docs.0g.ai" target="_blank" rel="noreferrer">Docs</a>
          &nbsp;·&nbsp;
          <a href="https://build.0g.ai" target="_blank" rel="noreferrer">Builder Hub</a>
          &nbsp;·&nbsp;
          <a href="https://discord.gg/0glabs" target="_blank" rel="noreferrer">Discord</a>
          &nbsp;·&nbsp;
          <a href="https://github.com/zaxcoraider/zaxxie" target="_blank" rel="noreferrer">GitHub</a>
        </p>
        <p style={{ color:"#252535", fontSize:12 }}>
          Zaxxie v5.2 · 24 MCP Tools · Claude Code · 0G Zero Gravity
        </p>
      </footer>
    </>
  );
}
