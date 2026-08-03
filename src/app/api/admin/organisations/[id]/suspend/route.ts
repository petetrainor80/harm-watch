import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const bodySchema = z.object({
  action: z.enum(["suspend", "reinstate"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { message: "Unauthorised" } }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: { message: "Forbidden" } }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Invalid request" } }, { status: 422 });
  }

  const { action } = parsed.data;
  const service = createServiceClient();

  const { data: org, error: orgErr } = await service
    .from("organisations")
    .select("id, status")
    .eq("id", orgId)
    .single();

  if (orgErr || !org) {
    return NextResponse.json({ error: { message: "Organisation not found" } }, { status: 404 });
  }

  const expectedCurrent = action === "suspend" ? "approved" : "suspended";
  if (org.status !== expectedCurrent) {
    return NextResponse.json(
      { error: { message: `Organisation is not currently ${expectedCurrent}` } },
      { status: 409 }
    );
  }

  const newStatus = action === "suspend" ? "suspended" : "approved";

  await service.from("organisations").update({ status: newStatus }).eq("id", orgId);

  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: `organisation.${action}`,
    entity_type: "organisations",
    entity_id: orgId,
    after: { status: newStatus },
  });

  return NextResponse.json({ success: true });
}
