// PRD-Q: Full org portal comes in M6. This is the landing page for approved
// org users after login. Replaced by the full portal in M6.
export default function OrgPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Organisation portal</h1>
        <p className="text-muted-foreground text-sm leading-7">
          You are signed in. The full reporting portal will be available in the
          next milestone. If you have questions, please contact the administrator.
        </p>
      </div>
    </main>
  );
}
