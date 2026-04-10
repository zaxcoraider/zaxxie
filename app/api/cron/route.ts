// Vercel Cron Job — auto-refresh 0G knowledge cache
// Schedule: configured in vercel.json → runs nightly at 02:00 UTC
// Fetches latest docs from docs.0g.ai and stores in Vercel KV so
// zaxxie_live_docs always returns fresh content without a user triggering it.

import { NextRequest, NextResponse } from "next/server";

const DOC_URLS: Record<string, string> = {
  storage:  "https://docs.0g.ai/build-with-0g/storage-sdk",
  compute:  "https://docs.0g.ai/build-with-0g/compute-network/sdk",
  chain:    "https://docs.0g.ai/run-a-node/testnet-information",
  da:       "https://docs.0g.ai/build-with-0g/da-integration",
  network:  "https://docs.0g.ai/run-a-node/testnet-information",
};

async function fetchDoc(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "zaxxie-cron/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  // Strip tags, collapse whitespace, cap at 10k chars
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10_000);
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const KV_CONFIGURED = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (!KV_CONFIGURED) {
    return NextResponse.json({ skipped: true, reason: "Vercel KV not configured" });
  }

  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  await Promise.allSettled(
    Object.entries(DOC_URLS).map(async ([topic, url]) => {
      try {
        const content = await fetchDoc(url);
        const { kv } = await import("@vercel/kv");
        await kv.set(`zaxxie:docs:${topic}`, content, { ex: 60 * 60 * 26 }); // 26h TTL
        results[topic] = `${content.length} chars cached`;
      } catch (e) {
        errors[topic] = (e as Error).message;
      }
    })
  );

  // Stamp last-run time
  const { kv } = await import("@vercel/kv");
  await kv.set("zaxxie:docs:last_refresh", new Date().toISOString(), { ex: 60 * 60 * 48 });

  return NextResponse.json({
    success: true,
    refreshedAt: new Date().toISOString(),
    results,
    errors: Object.keys(errors).length ? errors : undefined,
  });
}
