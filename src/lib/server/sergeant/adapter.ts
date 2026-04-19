import "server-only";

import {
  type SergeantRequestPayload,
  type SergeantResponsePayload,
} from "@/lib/sergeant/types";
import { buildSergeantFallbackResponse } from "@/lib/server/sergeant/fallback";

export interface SergeantModelAdapter {
  generateResponse(input: SergeantRequestPayload): Promise<SergeantResponsePayload>;
}

class SergeantFallbackAdapter implements SergeantModelAdapter {
  async generateResponse(input: SergeantRequestPayload) {
    return buildSergeantFallbackResponse(input);
  }
}

export function getSergeantModelAdapter(): SergeantModelAdapter {
  /**
   * Phase 1 ships the route and adapter boundary now.
   * A real provider-backed adapter can replace this later without changing the client contract.
   */
  return new SergeantFallbackAdapter();
}
