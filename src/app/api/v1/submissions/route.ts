import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, rateLimitHeaders } from "@/lib/api-auth";

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
  status_changed_at: string | null;
  submission_tags: SubmissionTagRow[];
}

export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: auth.code, message: auth.message } },
      { status: auth.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const service = createServiceClient();

  const { searchParams } = new URL(request.url);
  const cursorParam = searchParams.get("cursor");
  const statusParam = searchParams.get("status") ?? "live";
  const categoryParam = searchParams.get("category");
  const domainParam = searchParams.get("domain");
  const sinceParam = searchParams.get("since");
  const limitMax = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10) || 100));

  // --- Build query ---
  let query = service
    .from("submissions")
    .select(
      `id, url_normalised, domain, status, report_count,
       first_reported_at, last_reported_at, status_changed_at,
       submission_tags(tags(slug, label, kind))`
    )
    .order("last_reported_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limitMax + 1);

  // Support comma-separated status values.
  const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (statuses.length === 1) {
    query = query.eq("status", statuses[0]);
  } else if (statuses.length > 1) {
    query = query.in("status", statuses);
  }

  if (domainParam) query = query.eq("domain", domainParam);
  if (sinceParam) query = query.gte("last_reported_at", sinceParam);

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
  const hasMore = allRows.length > limitMax;
  const pageRows = hasMore ? allRows.slice(0, limitMax) : allRows;

  // Filter by category after fetch (submission_tags join makes SQL filtering complex).
  const filtered = categoryParam
    ? pageRows.filter((s) =>
        s.submission_tags.some((st) => st.tags?.slug === categoryParam && st.tags?.kind === "category")
      )
    : pageRows;

  let nextCursor: string | null = null;
  if (hasMore && pageRows.length > 0) {
    const last = pageRows[pageRows.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ ts: last.last_reported_at, id: last.id })
    ).toString("base64");
  }

  const data = filtered.map((s) => ({
    id: s.id,
    url: s.url_normalised,
    domain: s.domain,
    status: s.status,
    report_count: s.report_count,
    categories: s.submission_tags
      .filter((st) => st.tags?.kind === "category")
      .map((st) => st.tags!.slug),
    descriptors: s.submission_tags
      .filter((st) => st.tags?.kind === "descriptor")
      .map((st) => st.tags!.slug),
    first_reported_at: s.first_reported_at,
    last_reported_at: s.last_reported_at,
    status_changed_at: s.status_changed_at ?? null,
  }));

  return NextResponse.json(
    { data, next_cursor: nextCursor, has_more: hasMore },
    { headers: rateLimitHeaders(auth.key.rate_limit_per_hour) }
  );
}
