import { createClient } from "@/lib/supabase/server";
import { defangUrl } from "@/lib/url";
import { CopyButton } from "@/components/admin/copy-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

interface SubmissionTagRow {
  tags: { slug: string; label: string; kind: string } | null;
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    category?: string;
  }>;
}

function buildUrl(params: { search?: string; page?: number; category?: string }) {
  const p = new URLSearchParams();
  if (params.search) p.set("search", params.search);
  if (params.category) p.set("category", params.category);
  if (params.page && params.page > 1) p.set("page", String(params.page));
  const q = p.toString();
  return `/org${q ? `?${q}` : ""}`;
}

export default async function OrgFeedPage({ searchParams }: PageProps) {
  const { search, page: pageParam, category } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // ── Chart data & category tag lookup ───────────────────────────────
  const [chartRes, tagRes] = await Promise.all([
    supabase
      .from("submissions")
      .select("id, submission_tags(tags(slug, label, kind))")
      .eq("status", "live")
      .limit(600),
    category
      ? supabase
          .from("tags")
          .select("id")
          .eq("slug", category)
          .eq("kind", "category")
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const categoryMap = new Map<string, { label: string; count: number }>();
  for (const s of (chartRes.data ?? []) as unknown as { id: string; submission_tags: SubmissionTagRow[] }[]) {
    for (const st of s.submission_tags) {
      if (st.tags?.kind !== "category") continue;
      const slug = st.tags.slug;
      if (!categoryMap.has(slug)) categoryMap.set(slug, { label: st.tags.label, count: 0 });
      categoryMap.get(slug)!.count++;
    }
  }
  const categoryChart = [...categoryMap.entries()]
    .map(([slug, { label, count }]) => ({ slug, label, count }))
    .sort((a, b) => b.count - a.count);
  const chartMax = Math.max(...categoryChart.map((d) => d.count), 1);

  const activeCategory = category
    ? categoryChart.find((c) => c.slug === category) ?? null
    : null;

  // ── Category filter: get submission IDs for this category ──────────
  let categoryIds: string[] | null = null;
  if (category && tagRes.data) {
    const { data: stRows } = await supabase
      .from("submission_tags")
      .select("submission_id")
      .eq("tag_id", tagRes.data.id);
    categoryIds = stRows?.map((r) => r.submission_id) ?? [];
  } else if (category && !tagRes.data) {
    // Unknown category slug — force empty results
    categoryIds = [];
  }

  // ── Paginated submissions ──────────────────────────────────────────
  let query = supabase
    .from("submissions")
    .select(
      `id, url_normalised, domain, report_count,
       first_reported_at, last_reported_at,
       submission_tags(tags(slug, label, kind))`,
      { count: "exact" }
    )
    .eq("status", "live")
    .order("last_reported_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("domain", `%${search}%`);
  if (categoryIds !== null) {
    if (categoryIds.length === 0) {
      query = query.in("id", ["00000000-0000-0000-0000-000000000000"]); // force empty
    } else {
      query = query.in("id", categoryIds);
    }
  }

  const { data: submissions, count, error } = await query;
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Live submissions feed</h1>
          <p className="text-sm text-muted-foreground">
            All submissions are allegations only — not confirmed or proven. URLs are displayed defanged.
          </p>
        </div>
        <a
          href={`/api/org/submissions/export${search ? `?search=${encodeURIComponent(search)}` : ""}`}
          className="text-xs px-3 py-1.5 rounded-md border hover:bg-secondary transition-colors shrink-0"
        >
          Export CSV
        </a>
      </header>

      {/* ── Category chart ─────────────────────────────────────────── */}
      {categoryChart.length > 0 && (
        <section className="border rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Submissions by category — click to filter
            </h2>
            {activeCategory && (
              <Link
                href={buildUrl({ search })}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 shrink-0"
              >
                Clear filter
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {categoryChart.map(({ slug, label, count }) => {
              const isActive = category === slug;
              return (
                <Link
                  key={slug}
                  href={buildUrl({ search, category: isActive ? undefined : slug })}
                  className="flex items-center gap-3 group"
                >
                  <span
                    className={`w-44 shrink-0 text-xs text-right truncate transition-colors ${
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    title={label}
                  >
                    {label}
                  </span>
                  <div className="flex-1 bg-secondary rounded h-4 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-300 ${
                        isActive ? "bg-[#1d70b8]" : "bg-primary/60 group-hover:bg-primary"
                      }`}
                      style={{ width: `${Math.max(2, (count / chartMax) * 100)}%` }}
                    />
                  </div>
                  <span
                    className={`w-8 shrink-0 text-right text-xs tabular-nums ${
                      isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Search + filter controls ────────────────────────────────── */}
      <div className="space-y-3">
        <form method="get" className="flex flex-wrap gap-3">
          {category && <input type="hidden" name="category" value={category} />}
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
          {(search || category) && (
            <Link
              href="/org"
              className="h-9 px-4 flex items-center rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </Link>
          )}
        </form>

        {(search || activeCategory) && (
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{total.toLocaleString()}</strong>{" "}
            {total === 1 ? "result" : "results"}
            {activeCategory && (
              <> in <span className="font-medium text-foreground">{activeCategory.label}</span></>
            )}
            {search && (
              <> matching <span className="font-medium text-foreground">&ldquo;{search}&rdquo;</span></>
            )}
          </p>
        )}
      </div>

      {/* ── Submissions list ────────────────────────────────────────── */}
      {error ? (
        <p className="text-sm text-destructive">Failed to load submissions.</p>
      ) : submissions && submissions.length > 0 ? (
        <div className="divide-y border rounded-md overflow-hidden text-sm">
          {submissions.map((s) => {
            const tags = (s.submission_tags as unknown as SubmissionTagRow[]);
            const categories = tags.filter((st) => st.tags?.kind === "category").map((st) => st.tags!);
            const defanged = defangUrl(s.url_normalised);

            return (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-mono text-xs text-muted-foreground truncate">{defanged}</p>
                    <CopyButton text={defanged} label="Copy" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium">{s.domain}</span>
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={buildUrl({ search, category: c.slug })}
                        className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                          category === c.slug
                            ? "bg-[#1d70b8]/10 text-[#1d70b8] font-medium"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                        }`}
                      >
                        {c.label}
                      </Link>
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
          {search || category
            ? "No submissions match these filters."
            : "No live submissions yet."}
        </p>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={buildUrl({ search, category, page: page - 1 })}
              className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-muted-foreground tabular-nums">
            Page {page} of {totalPages} · {total.toLocaleString()} total
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl({ search, category, page: page + 1 })}
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
