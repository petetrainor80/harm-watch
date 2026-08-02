import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendApprovalInvite } from "@/lib/email";

const bodySchema = z.object({
  org_type: z.enum(["charity", "government", "isp", "legal", "other"]),
  api_enabled: z.boolean().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;

  // Authenticate and authorise — super_admin only.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { message: "Unauthorised" } }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
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
      { error: { message: "Invalid request", details: parsed.error.flatten() } },
      { status: 422 }
    );
  }

  const { org_type, api_enabled } = parsed.data;
  const service = createServiceClient();

  // Load the pending org.
  const { data: org, error: orgErr } = await service
    .from("organisations")
    .select("id, name, contact_name, contact_email, contact_job_title, status")
    .eq("id", orgId)
    .single();

  if (orgErr || !org) {
    return NextResponse.json({ error: { message: "Organisation not found" } }, { status: 404 });
  }
  if (org.status !== "pending") {
    return NextResponse.json(
      { error: { message: "Only pending organisations can be approved" } },
      { status: 409 }
    );
  }

  // Generate an invite link (also creates the auth user).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.harm.watch";
  const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: "invite",
    email: org.contact_email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  if (linkErr || !linkData) {
    console.error("generateLink error", linkErr?.code);
    return NextResponse.json(
      { error: { message: "Could not create user account. Please try again." } },
      { status: 500 }
    );
  }

  const newUserId = linkData.user.id;
  const inviteLink = linkData.properties.action_link;

  // Create the profile row.
  const { error: profileErr } = await service.from("profiles").insert({
    id: newUserId,
    organisation_id: orgId,
    role: "org_admin",
    full_name: org.contact_name,
    work_email: org.contact_email,
    job_title: org.contact_job_title ?? null,
    is_active: true,
  });

  if (profileErr) {
    console.error("profile insert error", profileErr.code);
    return NextResponse.json(
      { error: { message: "Could not create user profile. Please try again." } },
      { status: 500 }
    );
  }

  // Update the org record.
  await service.from("organisations").update({
    status: "approved",
    type: org_type,
    api_enabled,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  }).eq("id", orgId);

  // Audit log.
  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "organisation.approve",
    entity_type: "organisations",
    entity_id: orgId,
    after: { status: "approved", type: org_type, api_enabled },
  });

  // Send invite email — best effort.
  try {
    await sendApprovalInvite(
      org.contact_email,
      org.contact_name,
      org.name,
      inviteLink
    );
  } catch (err) {
    console.error("invite email failed", err);
  }

  return NextResponse.json({ success: true });
}
