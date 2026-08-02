import { NextResponse } from "next/server";
import { reportSchema } from "@/lib/schemas/report";
import {
  checkForBlockedCategories,
  recordBlockedRoutingEvent,
} from "@/lib/blocked-categories";

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

  // Honeypot — return a fake success so bots get no signal
  if (data.company_url) {
    return NextResponse.json({ success: true });
  }

  // ── Blocked category check ────────────────────────────────────────────────
  // Enforced here on the server regardless of what the client sent.
  // Data-driven from tags.is_blocked. See PRD section 5.
  const blockResult = await checkForBlockedCategories(data.categories);

  if (blockResult.blocked) {
    // Record counter only — no URL, no IP, no payload
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

  // M3: Verify Cloudflare Turnstile token
  // M3: Rate limit on ip_hash (5/hour, 20/day)
  // M3: Normalise URL, compute url_hash
  // M3: Upsert submission, insert report, insert report_tags, insert tag_suggestion
  // M3: Return minimal success (no submission ID, no report count)

  return NextResponse.json({ success: true }, { status: 202 });
}
