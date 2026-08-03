import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
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

  const service = createServiceClient();

  // Confirm the submission exists before we attempt anything
  const { data: submission } = await service
    .from("submissions")
    .select("id, url_normalised")
    .eq("id", id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Delete in dependency order (no CASCADE defined in schema)
  // 1. report_tags (FK → reports.id)
  const { data: reportIds } = await service
    .from("reports")
    .select("id")
    .eq("submission_id", id);

  if (reportIds && reportIds.length > 0) {
    const ids = reportIds.map((r) => r.id);
    const { error: rtErr } = await service
      .from("report_tags")
      .delete()
      .in("report_id", ids);
    if (rtErr) return NextResponse.json({ error: "Failed deleting report tags" }, { status: 500 });
  }

  // 2. submission_tags (FK → submissions.id)
  const { error: stErr } = await service
    .from("submission_tags")
    .delete()
    .eq("submission_id", id);
  if (stErr) return NextResponse.json({ error: "Failed deleting submission tags" }, { status: 500 });

  // 3. reports (FK → submissions.id)
  const { error: rErr } = await service
    .from("reports")
    .delete()
    .eq("submission_id", id);
  if (rErr) return NextResponse.json({ error: "Failed deleting reports" }, { status: 500 });

  // 4. submission itself
  const { error: sErr } = await service
    .from("submissions")
    .delete()
    .eq("id", id);
  if (sErr) return NextResponse.json({ error: "Failed deleting submission" }, { status: 500 });

  // Audit log entries referencing this entity_id are left in place intentionally —
  // they have no FK constraint and act as a record that this submission existed.
  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "submission.hard_deleted",
    entity_type: "submission",
    entity_id: id,
    before: { url_normalised: submission.url_normalised },
    after: null,
  });

  return NextResponse.json({ ok: true });
}
