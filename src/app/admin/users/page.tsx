import { createClient } from "@/lib/supabase/server";

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select(
      `id, full_name, work_email, job_title, role, is_active, created_at,
       organisations(name)`
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Users</h1>
      </header>

      {users && users.length > 0 ? (
        <div className="divide-y border rounded-md overflow-hidden text-sm">
          {users.map((u) => {
            const org = u.organisations as unknown as { name: string } | null;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-medium truncate">{u.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.work_email}</p>
                  {org && (
                    <p className="text-xs text-muted-foreground">{org.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="bg-secondary px-2 py-0.5 rounded-full">
                    {u.role}
                  </span>
                  <span
                    className={
                      u.is_active
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-muted-foreground hidden sm:block">
                    {new Date(u.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
          No users yet.
        </p>
      )}
    </div>
  );
}
