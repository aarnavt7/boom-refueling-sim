import { NextResponse } from "next/server";

import { createSergeantMessage, type SergeantRequestPayload } from "@/lib/sergeant/types";
import { getSergeantModelAdapter } from "@/lib/server/sergeant/adapter";

function isValidPayload(value: unknown): value is SergeantRequestPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybePayload = value as Partial<SergeantRequestPayload>;
  return Array.isArray(maybePayload.messages) && typeof maybePayload.context === "object" && maybePayload.context !== null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;

    if (!isValidPayload(payload)) {
      return NextResponse.json(
        {
          assistantMessage: createSergeantMessage({
            role: "assistant",
            kind: "system",
            content:
              "Sergeant could not read that request cleanly. Ask again and I will stay grounded in the current sim view.",
          }),
        },
        { status: 400 },
      );
    }

    const adapter = getSergeantModelAdapter();
    const response = await adapter.generateResponse(payload);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        assistantMessage: createSergeantMessage({
          role: "assistant",
          kind: "system",
          content:
            "Sergeant had trouble opening the response channel. I can still help once the local assistant route is reachable again.",
        }),
      },
      { status: 500 },
    );
  }
}
