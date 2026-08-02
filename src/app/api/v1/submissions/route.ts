import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { defangUrl } from "@/lib/url";

interface SubmissionTagRow {
  tags: { slug: string; label: string; kind: string } | null;
}

interface SubmissionRow {
  id: string;
  url_normalised: string;
  domain: string;
  status: string;
  report_count: number;
  first_reported_at: string;
  last_reported_at: string;
  submission_tags: SubmissionTagRow[];
}

export async function GET(request: NextRequest) {
  // --- Auth ---
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Invalid or revoked API key." } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const service = createServiceClient();

  const { data: apiKey } = await service
    .from("api_keys")
    .select("id, revoked_at, organisation_id")
    .eq("key_hash", tokenHash)
    .single();

  if (!apiKey || apiKey.revoked_at) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Invalid or revoked API key." } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Update last_used_at (fire and forget — don't block the response)
  service
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then(() => {});

  // --- Pagination params ---
  const { searchParams } = new URL(request.url);
  const limitParam = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10) || 100)
  );
  const cursorParam = searchParams.get("cursor");

  // --- Build query ---
  let query = service
    .from("submissions")
    .select(
      `id, url_normalised, domain, status, report_count,
       first_reported_at, last_reported_at,
       submission_tags(tags(slug, label, kind))`
    )
    .eq("status", "live")
    .order("last_reported_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limitParam + 1);

  if (cursorParam) {
    let cursor: { ts: string; id: string } | null = null;
    try {
      cursor = JSON.parse(Buffer.from(cursorParam, "base64").toString("utf-8")) as { ts: string; id: string };
    } catch {
      return NextResponse.json(
        { error: { code: "invalid_cursor", message: "Invalid cursor." } },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (cursor) {
      query = query.or(
        `last_reported_at.lt.${cursor.ts},and(last_reported_at.eq.${cursor.ts},id.lt.${cursor.id})`
      );
    }
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("v1 submissions query error", error);
    return NextResponse.json(
      { error: { code: "server_error", message: "Something went wrong." } },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const allRows = (rows ?? []) as unknown as SubmissionRow[];
  const hasMore = allRows.length > limitParam;
  const pageRows = hasMore ? allRows.slice(0, limitParam) : allRows;

  let nextCursor: string | null = null;
  if (hasMore && pageRows.length > 0) {
    const last = pageRows[pageRows.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ ts: last.last_reported_at, id: last.id })
    ).toString("base64");
  }

  const data = pageRows.map((s) => ({
    id: s.id,
    url: defangUrl(s.url_normalised),
    domain: s.domain,
    report_count: s.report_count,
    categories: s.submission_tags
      .filter((st) => st.tags?.kind === "category")
      .map((st) => st.tags!.slug),
    first_reported_at: s.first_reported_at,
    last_reported_at: s.last_reported_at,
  }));

  return NextResponse.json(
    {
      data,
      meta: {
        has_more: hasMore,
        next_cursor: nextCursor,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
