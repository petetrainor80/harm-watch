import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "The sign-in link was invalid or has expired. Please request a new one.",
  missing_code: "The sign-in link was incomplete. Please request a new one.",
  inactive: "Your account is inactive. Please contact the administrator.",
  no_access: "You do not have access to this area.",
};

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <header className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address and password.
            </p>
          </header>

          {error && ERROR_MESSAGES[error] && (
            <p className="text-sm text-destructive" role="alert">
              {ERROR_MESSAGES[error]}
            </p>
          )}

          <LoginForm next={next} />

          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/request-access" className="underline underline-offset-4 hover:text-foreground">
              Request access for your organisation
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
