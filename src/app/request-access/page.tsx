import { OrgRegistrationForm } from "@/components/org-registration-form";

export default function RequestAccessPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Request access
          </h1>
          <p className="text-muted-foreground text-base leading-7">
            Access to the reporting feed is available to approved organisations
            including charities, regulators, ISPs, and legal teams. Complete the
            form below and we will review your request within a few working days.
          </p>
        </header>

        <OrgRegistrationForm />

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="underline underline-offset-4 hover:text-foreground">
            Sign in
          </a>
          .
        </p>
      </div>
    </main>
  );
}
