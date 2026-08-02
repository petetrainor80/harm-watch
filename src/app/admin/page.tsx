import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface SubmissionTagRow {
  tags: { slug: string; label: string; kind: string } | null;
}

interface SubmissionRow {
  id: string;
  submission_tags: SubmissionTagRow[];
}

async function getDashboardData() {
  const supabase = await createClient();
  const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [
    liveRes,
    pendingRes,
    removedRes,
    rejectedRes,
    duplicateRes,
    last24hRes,
    last7dRes,
    pendingOrgsRes,
    pendingSuggestionsRes,
    recentRes,
    categoriesRes,
  ] = await Promise.all([
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "live"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "removed"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "duplicate"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).gte("first_reported_at", oneDayAgo),
    supabase.from("submissions").select("*", { count: "exact", head: true }).gte("first_reported_at", sevenDaysAgo),
    supabase.from("organisations").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("tag_suggestions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("submissions")
      .select("id, domain, url_normalised, report_count, status, last_reported_at")
      .order("report_count", { ascending: false })
      .limit(5),
    supabase
      .from("submissions")
      .select("id, submission_tags(tags(slug, label, kind))")
      .limit(600),
  ]);

  // Group live submissions by category for the chart.
  const categoryMap = new Map<string, { label: string; count: number }>();
  for (const s of (categoriesRes.data ?? []) as unknown as SubmissionRow[]) {
    for (const st of s.submission_tags) {
      if (st.tags?.kind !== "category") continue;
      const slug = st.tags.slug;
      if (!categoryMap.has(slug)) categoryMap.set(slug, { label: st.tags.label, count: 0 });
      categoryMap.get(slug)!.count++;
    }
  }
  const categoryChart = [...categoryMap.entries()]
    .map(([slug, { label, count }]) => ({ slug, label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 14);

  return {
    statusCounts: {
      live: liveRes.count ?? 0,
      pending_review: pendingRes.count ?? 0,
      removed: removedRes.count ?? 0,
      rejected: rejectedRes.count ?? 0,
      duplicate: duplicateRes.count ?? 0,
    },
    last24h: last24hRes.count ?? 0,
    last7d: last7dRes.count ?? 0,
    pendingOrgs: pendingOrgsRes.count ?? 0,
    pendingSuggestions: pendingSuggestionsRes.count ?? 0,
    topReported: recentRes.data ?? [],
    categoryChart,
  };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const total = Object.values(data.statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-10 max-w-4xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Submissions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={total} href="/admin/submissions" />
          <StatCard label="Live" value={data.statusCounts.live} href="/admin/submissions?status=live" />
          <StatCard label="Pending review" value={data.statusCounts.pending_review} href="/admin/submissions?status=pending_review" />
          <StatCard label="Removed" value={data.statusCounts.removed} href="/admin/submissions?status=removed" />
          <StatCard label="Rejected" value={data.statusCounts.rejected} href="/admin/submissions?status=rejected" />
          <StatCard label="Duplicate" value={data.statusCounts.duplicate} href="/admin/submissions?status=duplicate" />
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground pt-1">
          <span>Last 24 h: <strong className="text-foreground">{data.last24h}</strong></span>
          <span>Last 7 days: <strong className="text-foreground">{data.last7d}</strong></span>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Pending actions
        </h2>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <StatCard label="Org approvals" value={data.pendingOrgs} href="/admin/organisations" />
          <StatCard label="Tag suggestions" value={data.pendingSuggestions} href="/admin/tags" />
        </div>
      </section>

      {data.topReported.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Most reported
          </h2>
          <div className="divide-y border rounded-md overflow-hidden text-sm">
            {data.topReported.map((s) => (
              <Link
                key={s.id}
                href={`/admin/submissions/${s.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
              >
                <span className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                  {s.domain}
                </span>
                <span className="shrink-0 ml-4 text-xs tabular-nums">
                  {s.report_count} {s.report_count === 1 ? "report" : "reports"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.categoryChart.length > 0 && (
        <section className="space-y-4 border rounded-md p-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Submissions by category
          </h2>
          <CategoryBarChart data={data.categoryChart} />
        </section>
      )}
    </div>
  );
}

function CategoryBarChart({ data }: { data: { slug: string; label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.map(({ slug, label, count }) => (
        <Link
          key={slug}
          href={`/admin/submissions?view=grouped`}
          className="flex items-center gap-3 text-sm group"
        >
          <span
            className="w-44 shrink-0 text-xs text-right text-muted-foreground truncate group-hover:text-foreground transition-colors"
            title={label}
          >
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
        </Link>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border rounded-md px-4 py-3 hover:bg-secondary/50 transition-colors space-y-1"
    >
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Link>
  );
}
