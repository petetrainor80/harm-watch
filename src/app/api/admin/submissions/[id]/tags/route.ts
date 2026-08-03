import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ slug: z.string().min(1) });

async function getAdminUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") return null;
  return user;
}

// POST — add a category tag to a submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 422 });

  const { slug } = parsed.data;
  const service = createServiceClient();

  const { data: tag } = await service
    .from("tags").select("id, slug, kind").eq("slug", slug).single();
  if (!tag || tag.kind !== "category") {
    return NextResponse.json({ error: "Unknown category slug" }, { status: 422 });
  }

  // PRD-Q: submission_tags is trigger-managed; admin writes use report_count=0
  // to indicate operator override. The trigger may update count on future reports.
  const { error } = await service.from("submission_tags").upsert(
    { submission_id: id, tag_id: tag.id, report_count: 0 },
    { onConflict: "submission_id,tag_id", ignoreDuplicates: true }
  );
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "submission.tag_added",
    entity_type: "submissions",
    entity_id: id,
    after: { tag_slug: slug },
  });

  return NextResponse.json({ success: true });
}

// DELETE — remove a category tag from a submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 422 });

  const { slug } = parsed.data;
  const service = createServiceClient();

  const { data: tag } = await service
    .from("tags").select("id").eq("slug", slug).single();
  if (!tag) return NextResponse.json({ error: "Unknown tag slug" }, { status: 422 });

  const { error } = await service
    .from("submission_tags")
    .delete()
    .eq("submission_id", id)
    .eq("tag_id", tag.id);
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "submission.tag_removed",
    entity_type: "submissions",
    entity_id: id,
    after: { tag_slug: slug },
  });

  return NextResponse.json({ success: true });
}
