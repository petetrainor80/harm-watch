import { NextRequest, NextResponse } from "next/server";
import { normaliseUrl } from "@/lib/url";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ count: 0 });

  let hash: string;
  try {
    ({ hash } = normaliseUrl(raw));
  } catch {
    return NextResponse.json({ count: 0 });
  }

  const supabase = createServiceClient();
  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("url_hash", hash);

  return NextResponse.json({ count: count ?? 0 });
}
