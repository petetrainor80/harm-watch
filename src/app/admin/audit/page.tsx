import { createClient } from "@/lib/supabase/server";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: entries, count } = await supabase
    .from("audit_log")
    .select(
      `id, actor_id, actor_role, action, entity_type, entity_id,
       before, after, created_at`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Audit log</h1>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString()} entries
          </span>
        )}
      </header>

      {entries && entries.length > 0 ? (
        <div className="divide-y border rounded-md overflow-hidden text-sm font-mono">
          {entries.map((e) => (
            <div key={e.id} className="px-4 py-3 space-y-0.5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs font-semibold">{e.action}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(e.created_at).toLocaleString("en-GB")}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{e.actor_role}</span>
                {e.entity_type && (
                  <span>
                    {e.entity_type}{e.entity_id ? ` ${e.entity_id.slice(0, 8)}…` : ""}
                  </span>
                )}
              </div>
              {e.after && (
                <p className="text-xs text-muted-foreground truncate">
                  {JSON.stringify(e.after)}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
          No audit entries yet.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <a
              href={`/admin/audit?page=${page - 1}`}
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
              href={`/admin/audit?page=${page + 1}`}
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
