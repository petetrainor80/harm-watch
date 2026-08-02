import { createClient } from "@/lib/supabase/server";
import { defangUrl } from "@/lib/url";
import Link from "next/link";

const PAGE_SIZE = 50;

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  pending_review: "Pending review",
  removed: "Removed",
  rejected: "Rejected",
  duplicate: "Duplicate",
};

const STATUS_STYLES: Record<string, string> = {
  live: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  pending_review: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  removed: "bg-secondary text-muted-foreground",
  rejected: "bg-secondary text-muted-foreground",
  duplicate: "bg-secondary text-muted-foreground",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

async function getSubmissions(
  status: string | undefined,
  search: string | undefined,
  page: number
) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("submissions")
    .select(
      `id, url_normalised, domain, status, report_count,
       first_reported_at, last_reported_at,
       submission_tags(report_count, tags(slug, label, kind))`,
      { count: "exact" }
    )
    .order("last_reported_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.ilike("url_normalised", `%${search}%`);
  }

  return query;
}

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const { status, search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const { data: submissions, count, error } = await getSubmissions(status, search, page);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Submissions</h1>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString()} {total === 1 ? "record" : "records"}
          </span>
        )}
      </header>

      <form method="get" className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status ?? "all"}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="search"
          name="search"
          placeholder="Search URL or domain…"
          defaultValue={search ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />

        <button
          type="submit"
          className="h-9 px-4 rounded-md border bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          Filter
        </button>

        {(status || search) && (
          <Link
            href="/admin/submissions"
            className="h-9 px-4 flex items-center rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {error ? (
        <p className="text-sm text-destructive">Failed to load submissions.</p>
      ) : submissions && submissions.length > 0 ? (
        <div className="divide-y border rounded-md overflow-hidden text-sm">
          {submissions.map((s) => {
            const categories = (s.submission_tags as unknown as SubmissionTagRow[])
              .filter((st) => st.tags?.kind === "category")
              .map((st) => st.tags!.label);

            return (
              <Link
                key={s.id}
                href={`/admin/submissions/${s.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-mono text-xs text-muted-foreground truncate">
                    {defangUrl(s.url_normalised)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium">{s.domain}</span>
                    {categories.map((c) => (
                      <span
                        key={c}
                        className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[s.status] ?? ""}`}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {s.report_count} {s.report_count === 1 ? "report" : "reports"}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(s.last_reported_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
          {status || search ? "No submissions match these filters." : "No submissions yet."}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <a
              href={buildPageUrl(status, search, page - 1)}
              className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
            >
              Previous
            </a>
          )}
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={buildPageUrl(status, search, page + 1)}
              className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface SubmissionTagRow {
  report_count: number;
  tags: { slug: string; label: string; kind: string } | null;
}

function buildPageUrl(
  status: string | undefined,
  search: string | undefined,
  page: number
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  params.set("page", String(page));
  return `/admin/submissions?${params.toString()}`;
}
