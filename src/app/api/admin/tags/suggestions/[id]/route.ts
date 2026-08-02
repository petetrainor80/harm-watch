import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  // When approving: optionally create a new tag or link to an existing one.
  new_tag_slug: z.string().min(1).max(60).optional(),
  new_tag_label: z.string().min(1).max(100).optional(),
  resolved_tag_id: z.string().uuid().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: suggestionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const { action, new_tag_slug, new_tag_label, resolved_tag_id } = parse.data;
  const service = createServiceClient();

  const { data: suggestion } = await service
    .from("tag_suggestions")
    .select("id, raw_text, status, report_id")
    .eq("id", suggestionId)
    .single();

  if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  if (suggestion.status !== "pending") {
    return NextResponse.json({ error: "Suggestion already resolved." }, { status: 409 });
  }

  if (action === "reject") {
    await service
      .from("tag_suggestions")
      .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", suggestionId);
    return NextResponse.json({ ok: true });
  }

  // Approve path.
  let tagId = resolved_tag_id ?? null;

  if (!tagId && new_tag_slug && new_tag_label) {
    // Create a new tag.
    const { data: newTag, error: tagErr } = await service
      .from("tags")
      .insert({
        slug: new_tag_slug,
        label: new_tag_label,
        kind: "descriptor",
        is_active: true,
        is_blocked: false,
      })
      .select("id")
      .single();

    if (tagErr || !newTag) {
      return NextResponse.json({ error: "Could not create tag." }, { status: 500 });
    }
    tagId = newTag.id;
  }

  await service
    .from("tag_suggestions")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      resolved_tag_id: tagId,
    })
    .eq("id", suggestionId);

  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "tag_suggestion.approved",
    entity_type: "tag_suggestions",
    entity_id: suggestionId,
    after: { resolved_tag_id: tagId, raw_text: suggestion.raw_text },
  });

  return NextResponse.json({ ok: true, tag_id: tagId });
}
