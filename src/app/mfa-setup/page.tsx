import { MfaSetupForm } from "@/components/mfa-setup-form";

export default function MfaSetupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
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
  );
}
