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

    // PRD-Q: TOTP enforcement temporarily disabled for testing.
    // Re-enable before M7 hardening by restoring the AAL2 check below.
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
