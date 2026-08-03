import type { Metadata } from "next";
import { MfaSetupForm } from "@/components/mfa-setup-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Set Up Two-Factor Authentication",
  robots: { index: false, follow: false },
};

export default function MfaSetupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <header className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Set up two-factor authentication
            </h1>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication is required for administrator accounts.
              You only need to do this once.
            </p>
          </header>
          <MfaSetupForm />
        </div>
      </main>
    </div>
  );
}
