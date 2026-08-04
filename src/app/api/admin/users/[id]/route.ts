import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_active"), is_active: z.boolean() }),
  z.object({ action: z.literal("set_role"), role: z.enum(["org_admin", "org_member", "super_admin"]) }),
  z.object({ action: z.literal("resend_invite") }),
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (actorProfile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const service = createServiceClient();

  const { data: target } = await service
    .from("profiles")
    .select("id, role, work_email, full_name, organisation_id, is_active")
    .eq("id", targetId)
    .single();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Super admins cannot be deactivated or have their role changed here.
  if (target.role === "super_admin") {
    return NextResponse.json({ error: "Cannot modify a super_admin via this endpoint." }, { status: 403 });
  }

  const { action } = parse.data;

  if (action === "set_active") {
    const { is_active } = parse.data;
    await service.from("profiles").update({ is_active }).eq("id", targetId);
    await service.from("audit_log").insert({
      actor_id: user.id,
      actor_role: "super_admin",
      action: `user.${is_active ? "activated" : "deactivated"}`,
      entity_type: "profiles",
      entity_id: targetId,
      before: { is_active: target.is_active },
      after: { is_active },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "set_role") {
    const { role } = parse.data;
    await service.from("profiles").update({ role }).eq("id", targetId);
    await service.from("audit_log").insert({
      actor_id: user.id,
      actor_role: "super_admin",
      action: "user.role_changed",
      entity_type: "profiles",
      entity_id: targetId,
      before: { role: target.role },
      after: { role },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "resend_invite") {
    if (!target.work_email) {
      return NextResponse.json({ error: "No email address on record." }, { status: 422 });
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.harm.watch";
    const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
      type: "invite",
      email: target.work_email,
      options: { redirectTo: `${appUrl}/auth/callback` },
    });
    if (linkErr || !linkData) {
      return NextResponse.json({ error: "Could not generate invite link." }, { status: 500 });
    }
    const inviteLink = `${appUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=invite`;

    const { sendApprovalInvite } = await import("@/lib/email");
    const { data: org } = await service
      .from("organisations")
      .select("name")
      .eq("id", target.organisation_id)
      .single();

    await sendApprovalInvite(
      target.work_email,
      target.full_name ?? "there",
      org?.name ?? "your organisation",
      inviteLink
    ).catch((err) => console.error("resend invite email failed", err));

    await service.from("audit_log").insert({
      actor_id: user.id,
      actor_role: "super_admin",
      action: "user.invite_resent",
      entity_type: "profiles",
      entity_id: targetId,
      after: { email: target.work_email },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
