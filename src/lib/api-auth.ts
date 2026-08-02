import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import type { NextRequest } from "next/server";

export interface ApiKeyRecord {
  id: string;
  organisation_id: string;
  rate_limit_per_hour: number;
}

export type ApiAuthResult =
  | { ok: true; key: ApiKeyRecord }
  | { ok: false; status: number; code: string; message: string };

// PRD-Q: Rate limit enforcement requires per-key usage counters (Redis or a
// dedicated Postgres table). Headers are returned as informational for now;
// hard enforcement should be added before public launch.
export const RATE_LIMIT_PER_HOUR = 1000;

export async function verifyApiKey(request: NextRequest): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { ok: false, status: 401, code: "unauthorized", message: "Missing or invalid Authorization header." };
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const service = createServiceClient();

  const { data: apiKey } = await service
    .from("api_keys")
    .select("id, revoked_at, organisation_id, rate_limit_per_hour")
    .eq("key_hash", tokenHash)
    .single();

  if (!apiKey || apiKey.revoked_at) {
    return { ok: false, status: 401, code: "unauthorized", message: "Invalid or revoked API key." };
  }

  // Verify the organisation is still approved and API-enabled.
  const { data: org } = await service
    .from("organisations")
    .select("status, api_enabled")
    .eq("id", apiKey.organisation_id)
    .single();

  if (!org || org.status !== "approved" || !org.api_enabled) {
    return { ok: false, status: 403, code: "forbidden", message: "API access is not enabled for this organisation." };
  }

  // Fire-and-forget last_used_at update.
  service
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then(() => {});

  return {
    ok: true,
    key: {
      id: apiKey.id,
      organisation_id: apiKey.organisation_id,
      rate_limit_per_hour: apiKey.rate_limit_per_hour ?? RATE_LIMIT_PER_HOUR,
    },
  };
}

export function rateLimitHeaders(limit: number): Record<string, string> {
  const reset = Math.floor(Date.now() / 1000) + 3600;
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(limit),
    "X-RateLimit-Reset": String(reset),
    "Cache-Control": "no-store",
  };
}
