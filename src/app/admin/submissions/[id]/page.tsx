import { createClient } from "@/lib/supabase/server";
import { defangUrl } from "@/lib/url";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusForm } from "@/components/admin/status-form";
import { AdminNotesForm } from "@/components/admin/admin-notes-form";
import { CopyButton } from "@/components/admin/copy-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  pending_review: "Pending review",
  removed: "Removed",
  rejected: "Rejected",
  duplicate: "Duplicate",
};

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: submission, error } = await supabase
    .from("submissions")
    .select(
      `id, url_original, url_normalised, domain, status, report_count,
       first_reported_at, last_reported_at, status_changed_at, status_note,
       admin_notes,
       submission_tags(report_count, tags(slug, label, kind)),
       reports(id, context, country_code, reporter_email, ip_hash, created_at)`
    )
    .eq("id", id)
    .single();

  if (error || !submission) notFound();

  const tags = (submission.submission_tags as unknown as SubmissionTagRow[]) ?? [];
  const categories = tags.filter((t) => t.tags?.kind === "category");
  const descriptors = tags.filter((t) => t.tags?.kind === "descriptor");
  const reports = (submission.reports as unknown as ReportRow[]) ?? [];
  const defanged = defangUrl(submission.url_normalised);

  const { data: auditEntries } = await supabase
    .from("audit_log")
    .select("id, actor_id, action, before, after, created_at, profiles(full_name)")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-3xl space-y-10">
      <div className="space-y-1">
        <Link
          href="/admin/submissions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Submissions
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-2">Submission detail</h1>
      </div>

      <section className="space-y-4">
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-sm break-all text-muted-foreground">{defanged}</p>
            <CopyButton text={submission.url_normalised} />
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Domain</dt>
              <dd className="font-medium">{submission.domain}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="font-medium">{STATUS_LABELS[submission.status] ?? submission.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reports</dt>
              <dd className="font-medium tabular-nums">{submission.report_count}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last reported</dt>
              <dd className="font-medium">
                {new Date(submission.last_reported_at).toLocaleDateString("en-GB")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">First reported</dt>
              <dd>{new Date(submission.first_reported_at).toLocaleDateString("en-GB")}</dd>
            </div>
            {submission.status_changed_at && (
              <div>
                <dt className="text-xs text-muted-foreground">Status changed</dt>
                <dd>{new Date(submission.status_changed_at).toLocaleDateString("en-GB")}</dd>
              </div>
            )}
          </dl>

          {categories.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((t) => (
                  <span
                    key={t.tags!.slug}
                    className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                  >
                    {t.tags!.label}{" "}
                    <span className="text-muted-foreground">({t.report_count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {descriptors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Descriptors</p>
              <div className="flex flex-wrap gap-2">
                {descriptors.map((t) => (
                  <span
                    key={t.tags!.slug}
                    className="text-xs border px-2 py-0.5 rounded-full text-muted-foreground"
                  >
                    {t.tags!.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {submission.status_note && (
            <div className="text-sm border-t pt-3 space-y-0.5">
              <p className="text-xs text-muted-foreground">Status note</p>
              <p>{submission.status_note}</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Change status</h2>
        <StatusForm
          submissionId={id}
          currentStatus={submission.status}
          currentNote={submission.status_note}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Admin notes</h2>
        <AdminNotesForm submissionId={id} currentNotes={submission.admin_notes} />
      </section>

      {reports.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-medium">
            Reports{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({reports.length})
            </span>
          </h2>
          <div className="divide-y border rounded-md overflow-hidden text-sm">
            {reports.map((r) => (
              <div key={r.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(r.created_at).toLocaleString("en-GB")}</span>
                  {r.country_code && <span>{r.country_code}</span>}
                </div>
                {r.context && (
                  <p className="text-sm">{r.context}</p>
                )}
                <div className="flex gap-6 text-xs text-muted-foreground">
                  {r.reporter_email && (
                    <span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">[restricted]</span>{" "}
                      {r.reporter_email}
                    </span>
                  )}
                  {r.ip_hash && (
                    <span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">[restricted]</span>{" "}
                      ip: {r.ip_hash.slice(0, 12)}…
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {auditEntries && auditEntries.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-medium">Audit trail</h2>
          <div className="divide-y border rounded-md overflow-hidden text-sm">
            {auditEntries.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-mono text-xs">{entry.action}</p>
                  {entry.after && (
                    <p className="text-xs text-muted-foreground">
                      → {JSON.stringify(entry.after)}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground shrink-0 text-right space-y-0.5">
                  <p>{(entry.profiles as unknown as { full_name: string } | null)?.full_name ?? "—"}</p>
                  <p>{new Date(entry.created_at).toLocaleString("en-GB")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface SubmissionTagRow {
  report_count: number;
  tags: { slug: string; label: string; kind: string } | null;
}

interface ReportRow {
  id: string;
  context: string | null;
  country_code: string | null;
  reporter_email: string | null;
  ip_hash: string | null;
  created_at: string;
}

