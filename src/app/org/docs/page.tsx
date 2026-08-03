export default function OrgDocsPage() {
  const base = "https://www.harm.watch/api/v1";

  return (
    <div className="max-w-3xl space-y-12">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">API documentation</h1>
        <p className="text-sm text-muted-foreground leading-6">
          The Harm Watch API gives your organisation programmatic access to the live
          submissions feed. It is read-only, JSON over HTTPS, and authenticated with
          a bearer token tied to your organisation.
        </p>
      </header>

      {/* ── Authentication ─────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Authentication</h2>
        <p className="text-sm text-muted-foreground leading-6">
          All requests must include your API key as a bearer token in the{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            Authorization
          </code>{" "}
          header. Keys are issued and managed on the{" "}
          <a href="/org/api-keys" className="underline underline-offset-4 hover:text-foreground">
            API keys
          </a>{" "}
          page. The plaintext key is shown exactly once at issuance — if you lose it,
          revoke it and issue a new one.
        </p>
        <CodeBlock>{`Authorization: Bearer hw_live_YOUR_KEY_HERE`}</CodeBlock>
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Want to try it before you build?
          </p>
          <a
            href="/api-demo.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#1d70b8] underline underline-offset-4 hover:text-foreground whitespace-nowrap"
          >
            Open interactive demo →
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Requests without a valid key return{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">401 Unauthorized</code>.
          Keys belonging to a suspended organisation return{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">403 Forbidden</code>.
        </p>
      </section>

      {/* ── Base URL ───────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Base URL</h2>
        <CodeBlock>{base}</CodeBlock>
        <p className="text-sm text-muted-foreground">
          All endpoints below are relative to this base. HTTPS only.
        </p>
      </section>

      {/* ── Endpoints ──────────────────────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-base font-semibold border-b pb-2">Endpoints</h2>

        {/* GET /submissions */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-[#1d70b8] text-white px-2 py-0.5 rounded">
              GET
            </span>
            <code className="font-mono text-sm">/submissions</code>
          </div>
          <p className="text-sm text-muted-foreground leading-6">
            Returns a paginated list of live submissions. Each record represents a
            unique normalised URL that has been reported at least once and is currently
            visible in the feed. Reporter identities are never included.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-medium">Query parameters</p>
            <div className="border rounded-md overflow-hidden text-sm">
              <ParamRow name="cursor" type="string" optional>
                Opaque pagination cursor from the previous response. Omit for the
                first page.
              </ParamRow>
              <ParamRow name="limit" type="integer" optional>
                Records per page. Default{" "}
                <code className="font-mono text-xs bg-muted px-1 rounded">50</code>,
                max{" "}
                <code className="font-mono text-xs bg-muted px-1 rounded">200</code>.
              </ParamRow>
              <ParamRow name="since" type="ISO 8601 date" optional>
                Return only submissions last reported on or after this date.
                Example:{" "}
                <code className="font-mono text-xs bg-muted px-1 rounded">
                  2026-01-01
                </code>
              </ParamRow>
              <ParamRow name="category" type="string" optional>
                Filter by category slug. Repeatable for multiple categories.
                See <a href="#categories" className="underline underline-offset-4 hover:text-foreground">category reference</a> below.
              </ParamRow>
              <ParamRow name="domain" type="string" optional>
                Partial domain match. Example:{" "}
                <code className="font-mono text-xs bg-muted px-1 rounded">
                  example.co.uk
                </code>
              </ParamRow>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Example request</p>
            <CodeBlock>{`curl https://www.harm.watch/api/v1/submissions \\
  -H "Authorization: Bearer hw_live_YOUR_KEY_HERE"`}</CodeBlock>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Example response</p>
            <CodeBlock>{`{
  "data": [
    {
      "id": "019526a1-…",
      "url": "hxxps://example[.]com/page",
      "domain": "example.com",
      "status": "live",
      "report_count": 3,
      "categories": ["online-safety-harmful-content", "pornography"],
      "first_reported_at": "2026-07-14T09:00:00Z",
      "last_reported_at": "2026-08-01T14:23:11Z"
    }
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6IjAxOTUyNmExIn0",
    "has_more": true,
    "total": 412
  }
}`}</CodeBlock>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Filtered example — category + since</p>
            <CodeBlock>{`curl "https://www.harm.watch/api/v1/submissions?category=pornography&since=2026-01-01" \\
  -H "Authorization: Bearer hw_live_YOUR_KEY_HERE"`}</CodeBlock>
          </div>
        </div>

        {/* GET /submissions/:id */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-[#1d70b8] text-white px-2 py-0.5 rounded">
              GET
            </span>
            <code className="font-mono text-sm">/submissions/:id</code>
          </div>
          <p className="text-sm text-muted-foreground leading-6">
            Returns a single submission by its UUID. Returns{" "}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">404</code>{" "}
            if the submission does not exist or is not live.
          </p>
          <CodeBlock>{`curl https://www.harm.watch/api/v1/submissions/019526a1-… \\
  -H "Authorization: Bearer hw_live_YOUR_KEY_HERE"`}</CodeBlock>
        </div>
      </section>

      {/* ── Pagination ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Pagination</h2>
        <p className="text-sm text-muted-foreground leading-6">
          The API uses <strong>keyset (cursor-based) pagination</strong>. This is more
          efficient than page-number pagination on large datasets and avoids missing or
          duplicating records when new submissions arrive between requests.
        </p>
        <p className="text-sm text-muted-foreground leading-6">
          Each response includes a{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            pagination.next_cursor
          </code>{" "}
          value. Pass it as the{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">cursor</code>{" "}
          parameter on your next request to fetch the following page. When{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            pagination.has_more
          </code>{" "}
          is{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">false</code>,
          you have reached the end of the feed.
        </p>
        <CodeBlock>{`# Page 1
curl "https://www.harm.watch/api/v1/submissions?limit=100" \\
  -H "Authorization: Bearer hw_live_YOUR_KEY_HERE"

# Page 2 — use cursor from previous response
curl "https://www.harm.watch/api/v1/submissions?limit=100&cursor=eyJpZCI6Ii4uLiJ9" \\
  -H "Authorization: Bearer hw_live_YOUR_KEY_HERE"`}</CodeBlock>
      </section>

      {/* ── Rate limiting ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Rate limiting</h2>
        <p className="text-sm text-muted-foreground leading-6">
          Each API key is limited to <strong>1,000 requests per hour</strong>. The
          current limit and remaining count are returned in every response header:
        </p>
        <CodeBlock>{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1754132400`}</CodeBlock>
        <p className="text-sm text-muted-foreground leading-6">
          When the limit is exceeded the API returns{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            429 Too Many Requests
          </code>{" "}
          with a{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            Retry-After
          </code>{" "}
          header. A nightly batch job pulling the full feed in pages of 200 uses
          roughly 5–10 requests and is well within this limit.
        </p>
      </section>

      {/* ── Code examples ──────────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="text-base font-semibold border-b pb-2">Code examples</h2>

        <div className="space-y-2">
          <p className="text-sm font-medium">Python — nightly batch sync</p>
          <CodeBlock>{`import requests

API_KEY = "hw_live_YOUR_KEY_HERE"
BASE    = "https://www.harm.watch/api/v1"

def fetch_all_submissions(since=None):
    params = {"limit": 200}
    if since:
        params["since"] = since

    results = []
    while True:
        r = requests.get(
            f"{BASE}/submissions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            params=params,
        )
        r.raise_for_status()
        body = r.json()
        results.extend(body["data"])

        if not body["pagination"]["has_more"]:
            break
        params["cursor"] = body["pagination"]["next_cursor"]

    return results

submissions = fetch_all_submissions(since="2026-01-01")
print(f"Fetched {len(submissions)} submissions")`}</CodeBlock>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">JavaScript / Node</p>
          <CodeBlock>{`const API_KEY = "hw_live_YOUR_KEY_HERE";
const BASE    = "https://www.harm.watch/api/v1";

async function fetchAllSubmissions({ since } = {}) {
  const results = [];
  let cursor;

  do {
    const url = new URL(\`\${BASE}/submissions\`);
    url.searchParams.set("limit", "200");
    if (since)  url.searchParams.set("since", since);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res  = await fetch(url, {
      headers: { Authorization: \`Bearer \${API_KEY}\` },
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

    const body = await res.json();
    results.push(...body.data);
    cursor = body.pagination.has_more ? body.pagination.next_cursor : null;
  } while (cursor);

  return results;
}

const submissions = await fetchAllSubmissions({ since: "2026-01-01" });
console.log(\`Fetched \${submissions.length} submissions\`);`}</CodeBlock>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────── */}
      <section className="space-y-4" id="categories">
        <h2 className="text-base font-semibold border-b pb-2">Category slugs</h2>
        <p className="text-sm text-muted-foreground leading-6">
          Use these slug values with the{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            ?category=
          </code>{" "}
          filter parameter. A submission may carry more than one category.
        </p>
        <div className="border rounded-md overflow-hidden text-sm">
          {[
            ["pornography", "Pornography"],
            ["age-restricted-content", "Age-restricted content"],
            ["online-safety-harmful-content", "Online safety — harmful content"],
            ["hate-speech", "Hate speech"],
            ["suicide-self-harm", "Suicide / self-harm"],
            ["eating-disorder", "Eating disorder promotion"],
            ["fraud-financial-scam", "Fraud / financial scam"],
            ["harassment-cyberbullying", "Harassment / cyberbullying"],
            ["misinformation", "Misinformation"],
            ["drugs", "Illegal drugs"],
            ["weapons", "Weapons"],
            ["counterfeit-goods", "Counterfeit goods"],
            ["animal-cruelty", "Animal cruelty"],
            ["foreign-interference", "Foreign interference"],
          ].map(([slug, label], i) => (
            <div
              key={slug}
              className={`flex items-center gap-4 px-4 py-2.5 ${
                i % 2 === 0 ? "bg-muted/30" : ""
              }`}
            >
              <code className="font-mono text-xs w-56 shrink-0 text-muted-foreground">
                {slug}
              </code>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Data notes ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Data notes</h2>
        <ul className="text-sm text-muted-foreground leading-7 list-disc list-inside space-y-1">
          <li>
            All submissions are <strong>allegations only</strong> — never confirmed
            or proven violations of the Online Safety Act 2023.
          </li>
          <li>
            URLs are returned <strong>defanged</strong> (e.g.{" "}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              hxxps://example[.]com
            </code>
            ) to prevent accidental navigation.
          </li>
          <li>
            No reporter data (name, email, IP address) is ever included in API
            responses.
          </li>
          <li>
            The feed reflects the <strong>live</strong> status only. Submissions
            marked removed, rejected, or duplicate are excluded.
          </li>
        </ul>
      </section>

      {/* ── Support ────────────────────────────────────────── */}
      <section className="space-y-2 pb-4">
        <h2 className="text-base font-semibold border-b pb-2">Support</h2>
        <p className="text-sm text-muted-foreground leading-6">
          If you have questions about the API, hit an error you cannot resolve, or need
          your rate limit adjusted, contact us at{" "}
          <a
            href="mailto:api@harm.watch"
            className="underline underline-offset-4 hover:text-foreground"
          >
            api@harm.watch
          </a>
          .
        </p>
      </section>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-muted rounded-md px-4 py-3 text-xs font-mono leading-6 overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function ParamRow({
  name,
  type,
  optional,
  children,
}: {
  name: string;
  type: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 px-4 py-3 border-b last:border-0">
      <div className="w-40 shrink-0 space-y-0.5">
        <code className="font-mono text-xs font-medium">{name}</code>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{type}</span>
          {optional && (
            <span className="text-xs text-muted-foreground/60">optional</span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-6">{children}</p>
    </div>
  );
}
