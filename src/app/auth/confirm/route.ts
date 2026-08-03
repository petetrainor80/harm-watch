import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

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

  const cookieStore = await cookies();

  // Collect cookies that Supabase sets during verifyOtp so we can
  // attach them to the redirect response. Using cookies().set() alone
  // doesn't reliably propagate to NextResponse.redirect() responses.
  const pendingCookies: ResponseCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, ...options });
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server Component context — ignore
            }
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    console.error("auth/confirm verifyOtp error", error.code, error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dest = "/";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "super_admin") {
      dest = "/admin";
    } else if (profile?.role === "org_admin" || profile?.role === "org_member") {
      // First-time invite: send to password setup so they can log in directly next time.
      dest = type === "invite" ? "/org/setup" : "/org";
    }
  }

  const response = NextResponse.redirect(`${origin}${dest}`);

  // Write all session cookies onto the redirect response so the browser
  // receives them and the client-side Supabase client can read the session.
  pendingCookies.forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}
