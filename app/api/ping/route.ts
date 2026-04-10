// Keep-warm endpoint — called every 5 minutes by Vercel cron (Pro plan)
// Prevents cold starts on the MCP function by keeping it warm.
// Also useful as a health check: GET /api/ping
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "zaxxie-mcp",
    tools: 24,
    ts: new Date().toISOString(),
  });
}
