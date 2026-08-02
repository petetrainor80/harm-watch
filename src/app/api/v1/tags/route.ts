import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyApiKey, rateLimitHeaders } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: auth.code, message: auth.message } },
      { status: auth.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const service = createServiceClient();
  const { data: tags, error } = await service
    .from("tags")
    .select("id, slug, label, kind, description, parent_id, sort_order")
    .eq("is_active", true)
    .eq("is_blocked", false)
    .order("kind")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("label");

  if (error) {
    console.error("v1 tags error", error);
    return NextResponse.json(
      { error: { code: "server_error", message: "Something went wrong." } },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { data: tags ?? [] },
    { headers: rateLimitHeaders(auth.key.rate_limit_per_hour) }
  );
}
