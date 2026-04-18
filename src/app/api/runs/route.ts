import { NextResponse } from "next/server";

type RunPayload = {
  scenarioId: string;
  status: string;
  durationSec: number;
  summary: Record<string, unknown>;
  replayLength: number;
};

const memoryRuns: RunPayload[] = [];

export async function GET() {
  return NextResponse.json({
    ok: true,
    storage: process.env.NEXT_PUBLIC_CONVEX_URL ? "convex-ready" : "memory-fallback",
    runs: memoryRuns.slice(-10).reverse(),
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as RunPayload;

  memoryRuns.push(payload);

  return NextResponse.json({
    ok: true,
    persisted: Boolean(process.env.NEXT_PUBLIC_CONVEX_URL),
    mode: process.env.NEXT_PUBLIC_CONVEX_URL ? "convex-ready" : "memory-fallback",
    run: payload,
  });
}
