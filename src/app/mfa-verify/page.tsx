import { MfaVerifyForm } from "@/components/mfa-verify-form";

export default function MfaVerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Two-factor authentication
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the code from your authenticator app to continue.
          </p>
        </header>
        <MfaVerifyForm />
      </div>
    </main>
  );
}
