import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles magic-link and invite-link callbacks from Supabase Auth.
// Supabase redirects here with a `code` param after the user clicks
// the link in their email.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth callback error", error.code);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Determine where to send them based on their role.
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
      return NextResponse.redirect(`${origin}/org`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
