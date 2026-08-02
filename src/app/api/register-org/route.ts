import { NextResponse } from "next/server";
import { registerOrgSchema } from "@/lib/schemas/register-org";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createServiceClient } from "@/lib/supabase/service";
import { sendRegistrationAck } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_payload", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const parsed = registerOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Invalid request",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const { data } = parsed;

  // Bot protection
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;
  const turnstileValid = await verifyTurnstileToken(data.turnstile_token, ip);
  if (!turnstileValid) {
    return NextResponse.json(
      { error: { code: "bot_protection_failed", message: "Security check failed. Please try again." } },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();

  // Create the pending organisation record.
  const { error: insertError } = await supabase.from("organisations").insert({
    name: data.org_name,
    website: data.website,
    contact_name: data.contact_name,
    contact_email: data.work_email,
    contact_job_title: data.job_title,
    type: data.org_type === "other" ? null : data.org_type,
    registration_number: data.registration_number ?? null,
    justification: data.justification,
    status: "pending",
  });

  if (insertError) {
    console.error("register-org insert error", { code: insertError.code });
    return NextResponse.json(
      { error: { code: "server_error", message: "Something went wrong. Please try again." } },
      { status: 500 }
    );
  }

  // Acknowledgement email — best effort, don't fail the request if it errors.
  try {
    await sendRegistrationAck(data.work_email, data.org_name);
  } catch (err) {
    console.error("registration ack email failed", err);
  }

  return NextResponse.json({ success: true }, { status: 202 });
}
