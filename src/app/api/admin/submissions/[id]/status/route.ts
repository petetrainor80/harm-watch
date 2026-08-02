import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["live", "pending_review", "removed", "rejected", "duplicate"]),
  status_note: z.string().min(1, "A status note is required").max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    return NextResponse.json(
      { error: parse.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 }
    );
  }

  const { status, status_note } = parse.data;
  const service = createServiceClient();

  const { data: current } = await service
    .from("submissions")
    .select("status, status_note")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const { error: updateError } = await service
    .from("submissions")
    .update({
      status,
      status_note,
      status_changed_at: new Date().toISOString(),
      status_changed_by: user.id,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "submission.status_changed",
    entity_type: "submission",
    entity_id: id,
    before: { status: current.status, status_note: current.status_note },
    after: { status, status_note },
  });

  return NextResponse.json({ ok: true });
}
