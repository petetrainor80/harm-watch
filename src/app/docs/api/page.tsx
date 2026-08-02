import Link from "next/link";

export const metadata = { title: "API documentation — The Harm Watch" };

const BASE = "https://www.harm.watch/api/v1";

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-4">API documentation</h1>
          <p className="text-base text-muted-foreground leading-7">
            The Harm Watch provides a read-only JSON API for approved organisations. Access is
            granted per organisation — <Link href="/request-access" className="underline underline-offset-4 hover:text-foreground">apply here</Link>.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Authentication</h2>
          <p className="text-sm leading-7">
            Include your API key as a Bearer token in every request:
          </p>
          <pre className="bg-secondary rounded-md p-4 text-xs font-mono overflow-x-auto">
            Authorization: Bearer hw_live_your_key_here
          </pre>
          <p className="text-sm text-muted-foreground">
            Keys are issued by your organisation admin from the{" "}
            <Link href="/org/api-keys" className="underline underline-offset-4 hover:text-foreground">API keys page</Link>.
            A revoked or expired key returns <code className="text-xs font-mono">401</code>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Rate limits</h2>
          <p className="text-sm leading-7">
            Default: 1,000 requests per hour per key. Every response includes:
          </p>
          <pre className="bg-secondary rounded-md p-4 text-xs font-mono overflow-x-auto">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1722614400   # Unix timestamp`}
          </pre>
          <p className="text-sm text-muted-foreground">
            Exceeding the limit returns <code className="text-xs font-mono">429 Too Many Requests</code> with a{" "}
            <code className="text-xs font-mono">Retry-After</code> header.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Endpoints</h2>

          <div className="space-y-3 border rounded-md p-5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">GET</span>
              <code className="text-sm font-mono">{BASE}/submissions</code>
            </div>
            <p className="text-sm leading-7">
              Paginated list of submissions. Defaults to <code className="text-xs font-mono">status=live</code>.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Query parameters</p>
              <div className="text-sm space-y-1.5">
                {[
                  ["status", "live (default). Comma-separated for multiple: live,pending_review"],
                  ["category", "Filter by category slug, e.g. fraud"],
                  ["descriptor", "Filter by descriptor slug"],
                  ["domain", "Exact domain match, e.g. example.com"],
                  ["since", "ISO 8601 date — only records with last_reported_at after this"],
                  ["cursor", "Opaque pagination cursor from next_cursor in prior response"],
                  ["limit", "Records per page, default 100, max 500"],
                ].map(([param, desc]) => (
                  <div key={param} className="flex gap-3">
                    <code className="text-xs font-mono text-muted-foreground w-24 shrink-0">{param}</code>
                    <span className="text-muted-foreground text-xs leading-5">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Response</p>
              <pre className="bg-secondary rounded p-3 text-xs font-mono overflow-x-auto">{`{
  "data": [
    {
      "id": "uuid",
      "url": "https://example.com/path",
      "domain": "example.com",
      "status": "live",
      "categories": ["fraud", "impersonation"],
      "descriptors": ["targets-children"],
      "report_count": 7,
      "first_reported_at": "2026-01-04T09:12:00Z",
      "last_reported_at": "2026-02-11T18:40:00Z",
      "status_changed_at": null
    }
  ],
  "next_cursor": "eyJ0cyI6...",
  "has_more": true
}`}</pre>
            </div>
          </div>

          <div className="space-y-3 border rounded-md p-5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">GET</span>
              <code className="text-sm font-mono">{BASE}/submissions/:id</code>
            </div>
            <p className="text-sm leading-7">Single submission by UUID. Same shape as a list item.</p>
            <p className="text-sm text-muted-foreground">Returns <code className="text-xs font-mono">404</code> if not found.</p>
          </div>

          <div className="space-y-3 border rounded-md p-5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">GET</span>
              <code className="text-sm font-mono">{BASE}/tags</code>
            </div>
            <p className="text-sm leading-7">
              Active harm taxonomy — categories and descriptors. Use this to map slugs to human-readable labels.
            </p>
            <pre className="bg-secondary rounded p-3 text-xs font-mono overflow-x-auto">{`{
  "data": [
    {
      "id": "uuid",
      "slug": "fraud",
      "label": "Fraud, scams, and financial crime",
      "kind": "category",
      "description": null,
      "parent_id": null,
      "sort_order": 1
    }
  ]
}`}</pre>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Errors</h2>
          <p className="text-sm leading-7">All errors use a consistent envelope:</p>
          <pre className="bg-secondary rounded-md p-4 text-xs font-mono overflow-x-auto">{`{
  "error": {
    "code": "rate_limited",
    "message": "You have exceeded your rate limit. Try again after the Retry-After period."
  }
}`}</pre>
          <div className="text-sm space-y-1.5">
            {[
              ["401", "unauthorized", "Missing, invalid, or revoked API key"],
              ["403", "forbidden", "API access not enabled for this organisation"],
              ["404", "not_found", "Resource not found"],
              ["429", "rate_limited", "Rate limit exceeded"],
              ["500", "server_error", "Internal error — please try again"],
            ].map(([status, code, desc]) => (
              <div key={code} className="flex gap-3">
                <code className="text-xs font-mono text-muted-foreground w-10 shrink-0">{status}</code>
                <code className="text-xs font-mono w-24 shrink-0">{code}</code>
                <span className="text-muted-foreground text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Data notice</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            All records are allegations by members of the public, not confirmed findings. Never characterise
            a submission as proven, confirmed, or illegal. Reporter data (email addresses, report text,
            IP information) is never returned by the API.
          </p>
        </section>

        <footer className="border-t pt-6 text-sm text-muted-foreground flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy notice</Link>
          <Link href="/request-access" className="hover:text-foreground">Request access</Link>
        </footer>
      </div>
    </main>
  );
}
