import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const TYPE_LABELS: Record<string, string> = {
  charity: "Charity",
  government: "Government",
  isp: "ISP",
  legal: "Legal",
  other: "Other",
};

export default async function OrganisationsPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("organisations")
    .select("id, name, website, contact_name, contact_email, contact_job_title, type, justification, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: others } = await supabase
    .from("organisations")
    .select("id, name, website, contact_name, contact_email, type, status, approved_at, rejection_reason, created_at")
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl space-y-12">
      <section className="space-y-6">
        <h1 className="text-xl font-semibold">
          Pending applications
          {pending?.length ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({pending.length})
            </span>
          ) : null}
        </h1>

        {!pending?.length && (
          <p className="text-sm text-muted-foreground">No pending applications.</p>
        )}

        <div className="space-y-6">
          {pending?.map((org) => (
            <div key={org.id} className="rounded-lg border p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{org.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {org.contact_name} &middot; {org.contact_email}
                    {org.contact_job_title && ` &middot; ${org.contact_job_title}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {org.website}
                    {org.type && ` &middot; ${TYPE_LABELS[org.type] ?? org.type}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(org.created_at).toLocaleDateString("en-GB")}
                </span>
              </div>

              <p className="text-sm leading-6 whitespace-pre-wrap">{org.justification}</p>

              <ApproveRejectButtons orgId={org.id} orgType={org.type} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Recent decisions</h2>
        {!others?.length && (
          <p className="text-sm text-muted-foreground">No decisions yet.</p>
        )}
        <div className="divide-y rounded-lg border overflow-hidden">
          {others?.map((org) => (
            <div key={org.id} className="px-4 py-3 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium">{org.name}</span>
              <span className="text-muted-foreground">
                {org.contact_email}
              </span>
              <span className={
                org.status === "approved"
                  ? "text-green-700"
                  : org.status === "rejected"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }>
                {STATUS_LABELS[org.status] ?? org.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Client component for the approve/reject form buttons
import { ApproveRejectButtons } from "@/components/approve-reject-buttons";
