import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In Next.js 16, middleware is renamed to "proxy" — file is proxy.ts,
// the exported function must be named `proxy`.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validate the session on every request (refreshes token if needed).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isOrgRoute = pathname.startsWith("/org");

  if (!isAdminRoute && !isOrgRoute) return response;

  // All protected routes require authentication.
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Load the caller's profile for role checks.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    return NextResponse.redirect(new URL("/login?error=inactive", request.url));
  }

  // /admin/* — super_admin only
  if (isAdminRoute) {
    if (profile.role !== "super_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // TOTP (AAL2) is mandatory for super_admin on every admin request.
    const { data: mfa } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (mfa) {
      if (mfa.nextLevel === "aal2" && mfa.currentLevel !== "aal2") {
        // Enrolled but not yet verified this session.
        const mfaVerifyUrl = request.nextUrl.clone();
        mfaVerifyUrl.pathname = "/mfa-verify";
        return NextResponse.redirect(mfaVerifyUrl);
      }
      if (mfa.nextLevel !== "aal2") {
        // Not yet enrolled — must enrol before accessing admin.
        const mfaSetupUrl = request.nextUrl.clone();
        mfaSetupUrl.pathname = "/mfa-setup";
        return NextResponse.redirect(mfaSetupUrl);
      }
    }
  }

  // /org/* — org_admin or org_member only
  if (isOrgRoute) {
    if (profile.role === "super_admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (!["org_admin", "org_member"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/login?error=no_access", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/org/:path*"],
};
