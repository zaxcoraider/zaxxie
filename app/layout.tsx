export const metadata = {
  title: "Zaxxie — Build on 0G. Just describe your idea.",
  description: "MCP Server for 0G Zero Gravity. Connect to Claude and build full-stack dApps — storage, AI inference, smart contracts, INFTs — with no coding knowledge required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0d0d14" }}>{children}</body>
    </html>
  );
}
