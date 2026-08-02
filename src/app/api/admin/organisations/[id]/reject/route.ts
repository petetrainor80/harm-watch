import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendRejectionNotice } from "@/lib/email";

const bodySchema = z.object({
  reason: z.string().max(500).default(""),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Invalid request" } },
      { status: 422 }
    );
  }

  const service = createServiceClient();

  const { data: org, error: orgErr } = await service
    .from("organisations")
    .select("id, name, contact_name, contact_email, status")
    .eq("id", orgId)
    .single();

  if (orgErr || !org) {
    return NextResponse.json({ error: { message: "Organisation not found" } }, { status: 404 });
  }
  if (org.status !== "pending") {
    return NextResponse.json(
      { error: { message: "Only pending organisations can be rejected" } },
      { status: 409 }
    );
  }

  await service.from("organisations").update({
    status: "rejected",
    rejection_reason: parsed.data.reason || null,
  }).eq("id", orgId);

  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "organisation.reject",
    entity_type: "organisations",
    entity_id: orgId,
    after: { status: "rejected", reason: parsed.data.reason },
  });

  try {
    await sendRejectionNotice(
      org.contact_email,
      org.contact_name,
      org.name,
      parsed.data.reason
    );
  } catch (err) {
    console.error("rejection email failed", err);
  }

  return NextResponse.json({ success: true });
}
