import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { defangUrl } from "@/lib/url";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("submissions")
    .select(
      `id, url_normalised, domain, status, report_count,
       first_reported_at, last_reported_at,
       submission_tags(tags(slug, label, kind))`
    )
    .order("last_reported_at", { ascending: false })
    .limit(5000);

  if (status && status !== "all") query = query.eq("status", status);
  if (search) query = query.ilike("url_normalised", `%${search}%`);

  const { data: submissions } = await query;

  const rows = (submissions ?? []).map((s) => {
    const tags = (s.submission_tags as unknown as { tags: { slug: string; kind: string } | null }[]) ?? [];
    const categories = tags.filter((t) => t.tags?.kind === "category").map((t) => t.tags!.slug).join("|");
    const descriptors = tags.filter((t) => t.tags?.kind === "descriptor").map((t) => t.tags!.slug).join("|");
    return [
      s.id,
      defangUrl(s.url_normalised),
      s.domain,
      s.status,
      s.report_count,
      categories,
      descriptors,
      new Date(s.first_reported_at).toISOString(),
      new Date(s.last_reported_at).toISOString(),
    ];
  });

  const header = ["id", "url", "domain", "status", "report_count", "categories", "descriptors", "first_reported_at", "last_reported_at"];
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvCell(value: unknown): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
