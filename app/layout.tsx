export const metadata = {
  title: "Zaxxie — The Ultimate 0G dApp Builder",
  description: "MCP Server for building full-stack dApps on 0G (Zero Gravity) — Chain, Storage, Compute, DA, INFTs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
