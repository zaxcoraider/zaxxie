export const metadata = {
  title: "Zaxxie — Build on 0G. Just describe your idea.",
  description: "MCP Server for 0G Zero Gravity. Connect to Claude Code and build full-stack dApps — storage, AI inference, smart contracts, INFTs — with glassmorphism UI, RainbowKit wallet connect, and one-click Vercel deploy.",
  openGraph: {
    title: "Zaxxie — Idea → Live dApp. One conversation.",
    description: "24 MCP tools. 0G Zero Gravity. Describe your idea — Zaxxie generates code, deploys contracts, pushes to GitHub, ships to Vercel.",
    url: "https://zaxxie.vercel.app",
    siteName: "Zaxxie",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zaxxie — Build on 0G. Just describe your idea.",
    description: "24 MCP tools for 0G Zero Gravity. Idea → Live dApp in one conversation.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#07070f" }}>{children}</body>
    </html>
  );
}
