import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles invite links and magic links generated via supabase.auth.admin.generateLink().
// Those links carry a token_hash + type in the query string, not a PKCE code,
// so the standard /auth/callback cannot process them.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "invite"
    | "magiclink"
    | "recovery"
    | "signup"
    | null;

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error("auth/confirm verifyOtp error", error.code);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Route to the right area based on role.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "super_admin") {
      return NextResponse.redirect(`${origin}/admin`);
    }
    if (profile?.role === "org_admin" || profile?.role === "org_member") {
      // First-time invite: send to password setup so they can log in without a magic link next time.
      const dest = type === "invite" ? "/org/setup" : "/org";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
