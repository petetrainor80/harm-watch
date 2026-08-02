import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";

const issueSchema = z.object({
  org_id: z.string().uuid(),
  label: z.string().min(1).max(100),
});

const revokeSchema = z.object({
  keyId: z.string().uuid(),
});

async function getSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") return null;

  return user;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await getSuperAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parse = issueSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: parse.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 }
    );
  }

  const { org_id, label } = parse.data;

  // Generate key: hw_live_ + 64 hex chars (32 bytes)
  const rawKey = `hw_live_${randomBytes(32).toString("hex")}`;
  const keyPrefix = rawKey.slice(0, 15);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const service = createServiceClient();

  const { data: newKey, error: insertError } = await service
    .from("api_keys")
    .insert({
      organisation_id: org_id,
      label,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: ["read"],
      rate_limit_per_hour: 1000,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !newKey) {
    console.error("admin api_key insert error", insertError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "api_key.issued",
    entity_type: "api_keys",
    entity_id: newKey.id,
    before: null,
    after: { label, organisation_id: org_id },
  });

  return NextResponse.json({ key: rawKey, prefix: keyPrefix, id: newKey.id });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const user = await getSuperAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parse = revokeSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: parse.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 }
    );
  }

  const { keyId } = parse.data;
  const service = createServiceClient();

  const { data: existingKey } = await service
    .from("api_keys")
    .select("id, revoked_at")
    .eq("id", keyId)
    .single();

  if (!existingKey) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  if (existingKey.revoked_at) {
    return NextResponse.json({ error: "Key already revoked" }, { status: 409 });
  }

  const { error: updateError } = await service
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId);

  if (updateError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  await service.from("audit_log").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    action: "api_key.revoked",
    entity_type: "api_keys",
    entity_id: keyId,
    before: { revoked_at: null },
    after: { revoked_at: new Date().toISOString() },
  });

  return NextResponse.json({ success: true });
}
