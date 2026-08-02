import { createClient } from "@/lib/supabase/server";
import { defangUrl } from "@/lib/url";
import Link from "next/link";
import { RemoveButton } from "@/components/admin/remove-button";

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
    view?: string;
  }>;
}

interface SubmissionTagRow {
  report_count: number;
  tags: { slug: string; label: string; kind: string } | null;
}

interface SubmissionRow {
  id: string;
  url_normalised: string;
  domain: string;
  status: string;
  report_count: number;
  last_reported_at: string;
  submission_tags: SubmissionTagRow[];
}

// ── Grouped view data ─────────────────────────────────────────────────────────

async function getGroupedData(status: string | undefined, search: string | undefined) {
  const supabase = await createClient();

  let query = supabase
    .from("submissions")
    .select(
      `id, url_normalised, domain, status, report_count, last_reported_at,
       submission_tags(report_count, tags(slug, label, kind))`
    )
    .order("last_reported_at", { ascending: false })
    .limit(600); // Reasonable ceiling for grouped view

  if (status && status !== "all") query = query.eq("status", status);
  if (search) query = query.ilike("url_normalised", `%${search}%`);

  const { data, error } = await query;
  if (error || !data) return { groups: [], uncategorised: [], total: 0 };

  const rows = data as unknown as SubmissionRow[];

  // Group by category slug.
  const groupMap = new Map<string, { label: string; submissions: SubmissionRow[] }>();

  for (const s of rows) {
    const categories = s.submission_tags.filter((st) => st.tags?.kind === "category");
    if (categories.length === 0) continue;
    for (const cat of categories) {
      const slug = cat.tags!.slug;
      if (!groupMap.has(slug)) groupMap.set(slug, { label: cat.tags!.label, submissions: [] });
      groupMap.get(slug)!.submissions.push(s);
    }
  }

  const uncategorised = rows.filter(
    (s) => !s.submission_tags.some((st) => st.tags?.kind === "category")
  );

  // Sort groups by total report count descending.
  const groups = [...groupMap.entries()]
    .map(([slug, { label, submissions }]) => ({
      slug,
      label,
      submissions: submissions.sort((a, b) => b.report_count - a.report_count),
      totalReports: submissions.reduce((n, s) => n + s.report_count, 0),
    }))
    .sort((a, b) => b.totalReports - a.totalReports);

  return { groups, uncategorised, total: rows.length };
}

// ── Flat view data ────────────────────────────────────────────────────────────

async function getFlatData(
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
      `id, url_normalised, domain, status, report_count, last_reported_at,
       submission_tags(report_count, tags(slug, label, kind))`,
      { count: "exact" }
    )
    .order("last_reported_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);
  if (search) query = query.ilike("url_normalised", `%${search}%`);

  return query;
}

// ── Category bar chart (pure SVG, no external deps) ──────────────────────────

function CategoryBarChart({
  groups,
}: {
  groups: { slug: string; label: string; submissions: SubmissionRow[] }[];
}) {
  if (groups.length === 0) return null;

  const data = groups
    .map((g) => ({ label: g.label, count: g.submissions.length }))
    .slice(0, 14); // Cap at 14 bars for readability

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <section className="space-y-4 border rounded-md p-5">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Submissions by category
      </h2>
      <div className="space-y-2.5">
        {data.map(({ label, count }) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <span className="w-44 shrink-0 text-xs text-right text-muted-foreground truncate" title={label}>
              {label}
            </span>
            <div className="flex-1 bg-secondary rounded h-5 overflow-hidden">
              <div
                className="h-full bg-primary rounded transition-all duration-300"
                style={{ width: `${Math.max(2, (count / max) * 100)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const { status, search, page: pageParam, view: viewParam } = await searchParams;
  const view = viewParam === "flat" ? "flat" : "grouped";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Build a URLSearchParams for cross-link use.
  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { status, search, view, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all" && !(k === "view" && v === "grouped")) p.set(k, v);
    }
    return `/admin/submissions${p.size ? `?${p.toString()}` : ""}`;
  }

  const exportParams = new URLSearchParams();
  if (status && status !== "all") exportParams.set("status", status);
  if (search) exportParams.set("search", search);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ── */}
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Submissions</h1>
        <a
          href={`/api/admin/submissions/export${exportParams.size ? `?${exportParams.toString()}` : ""}`}
          className="text-xs px-3 py-1.5 rounded-md border hover:bg-secondary transition-colors shrink-0"
        >
          Export CSV
        </a>
      </header>

      {/* ── Filters + view toggle ── */}
      <div className="flex flex-wrap items-center gap-3">
        <form method="get" className="flex flex-wrap gap-3 flex-1">
          {view === "flat" && <input type="hidden" name="view" value="flat" />}

          <select
            name="status"
            defaultValue={status ?? "all"}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input
            type="search"
            name="search"
            placeholder="Search URL or domain…"
            defaultValue={search ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
          />

          <button
            type="submit"
            className="h-9 px-4 rounded-md border bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Filter
          </button>

          {(status || search) && (
            <Link
              href={buildUrl({ status: undefined, search: undefined, page: undefined })}
              className="h-9 px-4 flex items-center rounded-md text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </Link>
          )}
        </form>

        {/* View toggle */}
        <div className="flex rounded-md border overflow-hidden text-xs shrink-0">
          <Link
            href={buildUrl({ view: "grouped", page: undefined })}
            className={`px-3 py-2 transition-colors ${
              view === "grouped" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            }`}
          >
            By category
          </Link>
          <Link
            href={buildUrl({ view: "flat", page: undefined })}
            className={`px-3 py-2 border-l transition-colors ${
              view === "flat" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            }`}
          >
            All submissions
          </Link>
        </div>
      </div>

      {/* ── Grouped view ── */}
      {view === "grouped" && <GroupedView status={status} search={search} />}

      {/* ── Flat view ── */}
      {view === "flat" && <FlatView status={status} search={search} page={page} buildUrl={buildUrl} />}
    </div>
  );
}

// ── Grouped view component ────────────────────────────────────────────────────

async function GroupedView({
  status,
  search,
}: {
  status: string | undefined;
  search: string | undefined;
}) {
  const { groups, uncategorised, total } = await getGroupedData(status, search);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
        {status || search ? "No submissions match these filters." : "No submissions yet."}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground -mt-2">
        {total.toLocaleString()} {total === 1 ? "submission" : "submissions"}
        {total >= 600 ? " (showing first 600)" : ""}
      </p>

      {groups.map((group) => (
        <section key={group.slug} className="space-y-2">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold">{group.label}</h2>
            <span className="text-sm text-muted-foreground">
              {group.submissions.length} {group.submissions.length === 1 ? "submission" : "submissions"}
              {" · "}
              {group.totalReports.toLocaleString()} {group.totalReports === 1 ? "report" : "reports"}
            </span>
          </div>

          <div className="divide-y border rounded-md overflow-hidden text-sm">
            {group.submissions.map((s) => (
              <SubmissionRow key={`${group.slug}-${s.id}`} s={s} />
            ))}
          </div>
        </section>
      ))}

      {uncategorised.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold text-muted-foreground">Uncategorised</h2>
            <span className="text-sm text-muted-foreground">{uncategorised.length}</span>
          </div>
          <div className="divide-y border rounded-md overflow-hidden text-sm">
            {uncategorised.map((s) => (
              <SubmissionRow key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}

      {/* Bar chart at the bottom */}
      <CategoryBarChart groups={groups} />
    </div>
  );
}

// ── Flat view component ───────────────────────────────────────────────────────

async function FlatView({
  status,
  search,
  page,
  buildUrl,
}: {
  status: string | undefined;
  search: string | undefined;
  page: number;
  buildUrl: (o: Record<string, string | undefined>) => string;
}) {
  const { data: submissions, count, error } = await getFlatData(status, search, page);
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (error) {
    return <p className="text-sm text-destructive">Failed to load submissions.</p>;
  }

  return (
    <div className="space-y-4">
      {total > 0 && (
        <p className="text-sm text-muted-foreground -mt-2">
          {total.toLocaleString()} {total === 1 ? "record" : "records"}
        </p>
      )}

      {submissions && submissions.length > 0 ? (
        <div className="divide-y border rounded-md overflow-hidden text-sm">
          {(submissions as unknown as SubmissionRow[]).map((s) => (
            <SubmissionRow key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
          {status || search ? "No submissions match these filters." : "No submissions yet."}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={buildUrl({ page: String(page - 1) })}
              className="px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link
              href={buildUrl({ page: String(page + 1) })}
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

// ── Shared submission row ─────────────────────────────────────────────────────

function SubmissionRow({ s }: { s: SubmissionRow }) {
  const categories = s.submission_tags
    .filter((st) => st.tags?.kind === "category")
    .map((st) => st.tags!.label);

  const descriptors = s.submission_tags
    .filter((st) => st.tags?.kind === "descriptor")
    .map((st) => st.tags!.label);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 hover:bg-secondary/50 transition-colors">
      <Link href={`/admin/submissions/${s.id}`} className="flex-1 min-w-0 space-y-1">
        <p className="font-mono text-xs text-muted-foreground truncate">
          {defangUrl(s.url_normalised)}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium">{s.domain}</span>
          {categories.map((c) => (
            <span key={c} className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
              {c}
            </span>
          ))}
          {descriptors.map((d) => (
            <span key={d} className="text-xs border px-1.5 py-0.5 rounded text-muted-foreground">
              {d}
            </span>
          ))}
        </div>
      </Link>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[s.status] ?? ""}`}>
          {STATUS_LABELS[s.status] ?? s.status}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {s.report_count} {s.report_count === 1 ? "report" : "reports"}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:block">
          {new Date(s.last_reported_at).toLocaleDateString("en-GB")}
        </span>
        {s.status !== "removed" && <RemoveButton id={s.id} />}
      </div>
    </div>
  );
}
