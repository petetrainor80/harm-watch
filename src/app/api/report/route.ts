import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { reportSchema } from "@/lib/schemas/report";
import {
  checkForBlockedCategories,
  recordBlockedRoutingEvent,
} from "@/lib/blocked-categories";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { normaliseUrl, hashIp } from "@/lib/url";
import { createServiceClient } from "@/lib/supabase/service";

function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_payload", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  // Validate shape
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Invalid request",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const { data } = parsed;

  // Honeypot — silent fake success, no DB writes
  if (data.company_url) {
    return NextResponse.json({ success: true });
  }

  // Blocked category check — server-side enforcement regardless of client state
  const blockResult = await checkForBlockedCategories(data.categories);
  if (blockResult.blocked) {
    await recordBlockedRoutingEvent(blockResult.slug);
    return NextResponse.json(
      {
        error: {
          code: "blocked_category",
          message:
            "This content must be reported to the appropriate authority directly.",
          redirect_url: blockResult.redirect_url,
          redirect_copy: blockResult.redirect_copy,
        },
      },
      { status: 422 }
    );
  }

  // Turnstile verification — fail closed
  const ip = getIp(request);
  const turnstileValid = await verifyTurnstileToken(data.turnstile_token, ip);
  if (!turnstileValid) {
    return NextResponse.json(
      { error: { code: "bot_protection_failed", message: "Security check failed. Please try again." } },
      { status: 403 }
    );
  }

  // Rate limit: 5/hour, 20/day per hashed IP
  const ipHash = hashIp(ip);
  const rateLimit = await checkRateLimit(ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message:
            "You have submitted too many reports recently. Please try again later.",
        },
      },
      {
        status: 429,
        headers: rateLimit.retryAfter
          ? { "Retry-After": String(rateLimit.retryAfter) }
          : {},
      }
    );
  }

  // Normalise the URL
  let urlResult: ReturnType<typeof normaliseUrl>;
  try {
    urlResult = normaliseUrl(data.url);
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_url",
          message: err instanceof Error ? err.message : "Invalid URL",
        },
      },
      { status: 422 }
    );
  }

  // Hash user agent (non-reversible, for deduplication only)
  const userAgentHash = data.turnstile_token
    ? createHash("sha256")
        .update(request.headers.get("user-agent") ?? "")
        .digest("hex")
    : null;

  const countryCode =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    null;

  // Atomic submission upsert + report insert via stored procedure
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("create_report", {
    p_url_original: data.url,
    p_url_normalised: urlResult.normalised,
    p_url_hash: urlResult.hash,
    p_domain: urlResult.domain,
    p_category_slugs: data.categories,
    p_descriptor_slugs: data.descriptors ?? [],
    p_context: data.context ?? null,
    p_reporter_email: data.reporter_email ?? null,
    p_ip_hash: ipHash,
    p_country_code: countryCode,
    p_user_agent_hash: userAgentHash,
    p_suggested_tag: data.suggested_tag ?? null,
  });

  if (error) {
    console.error("create_report error", { code: error.code });
    return NextResponse.json(
      { error: { code: "server_error", message: "Something went wrong. Please try again." } },
      { status: 500 }
    );
  }

  // 202 Accepted — minimal response, no submission ID or report count
  return NextResponse.json({ success: true }, { status: 202 });
}
