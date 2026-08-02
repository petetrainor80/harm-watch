import { createClient } from "@/lib/supabase/server";
import { defangUrl } from "@/lib/url";
import { CopyButton } from "@/components/admin/copy-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

interface SubmissionTagRow {
  tags: { slug: string; label: string; kind: string } | null;
}

function buildPageUrl(search: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  return `/org?${params.toString()}`;
}

export default async function OrgFeedPage({ searchParams }: PageProps) {
  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("submissions")
    .select(
      `id, url_normalised, domain, status, report_count,
       first_reported_at, last_reported_at,
       submission_tags(tags(slug, label, kind))`,
      { count: "exact" }
    )
    .eq("status", "live")
    .order("last_reported_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("domain", `%${search}%`);
  }

  const { data: submissions, count, error } = await query;

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Live submissions feed</h1>
          <p className="text-sm text-muted-foreground">
            All submissions are allegations only — not confirmed or proven. URLs are displayed defanged.
          </p>
        </div>
        {total > 0 && (
          <span className="text-sm text-muted-foreground shrink-0">
            {total.toLocaleString()} {total === 1 ? "record" : "records"}
          </span>
        )}
      </header>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="search"
          name="search"
          placeholder="Search by domain…"
          defaultValue={search ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-md border bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          Search
        </button>
        {search && (
          <Link
            href="/org"
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

            const defanged = defangUrl(s.url_normalised);

            return (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {defanged}
                    </p>
                    <CopyButton text={defanged} label="Copy" />
                  </div>
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
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {s.report_count} {s.report_count === 1 ? "report" : "reports"}
                  </span>
                  <span className="hidden sm:block">
                    {new Date(s.last_reported_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
          {search ? "No submissions match this search." : "No live submissions yet."}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={buildPageUrl(search, page - 1)}
              className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildPageUrl(search, page + 1)}
              className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
