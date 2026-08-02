import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyApiKey, rateLimitHeaders } from "@/lib/api-auth";

interface SubmissionTagRow {
  tags: { slug: string; label: string; kind: string } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiKey(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: auth.code, message: auth.message } },
      { status: auth.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { id } = await params;
  const service = createServiceClient();

  const { data: s, error } = await service
    .from("submissions")
    .select(
      `id, url_normalised, domain, status, report_count,
       first_reported_at, last_reported_at, status_changed_at,
       submission_tags(tags(slug, label, kind))`
    )
    .eq("id", id)
    .single();

  if (error || !s) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Submission not found." } },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const tags = (s.submission_tags as unknown as SubmissionTagRow[]) ?? [];

  const data = {
    id: s.id,
    url: s.url_normalised,
    domain: s.domain,
    status: s.status,
    report_count: s.report_count,
    categories: tags.filter((t) => t.tags?.kind === "category").map((t) => t.tags!.slug),
    descriptors: tags.filter((t) => t.tags?.kind === "descriptor").map((t) => t.tags!.slug),
    first_reported_at: s.first_reported_at,
    last_reported_at: s.last_reported_at,
    status_changed_at: s.status_changed_at ?? null,
  };

  return NextResponse.json(
    { data },
    { headers: rateLimitHeaders(auth.key.rate_limit_per_hour) }
  );
}
