import { createClient } from "@/lib/supabase/server";

export default async function ApiKeysPage() {
  const supabase = await createClient();

  const { data: keys } = await supabase
    .from("api_keys")
    .select(
      `id, label, key_prefix, scopes, rate_limit_per_hour,
       last_used_at, revoked_at, created_at,
       organisations(id, name, api_enabled)`
    )
    .order("created_at", { ascending: false });

  const activeKeys = (keys ?? []).filter((k) => !k.revoked_at);
  const revokedKeys = (keys ?? []).filter((k) => k.revoked_at);

  return (
    <div className="space-y-10 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">API keys</h1>
        <p className="text-sm text-muted-foreground">
          Keys are issued to organisations with API access enabled. The plaintext key
          is shown exactly once at issuance.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Active keys</h2>
        {activeKeys.length > 0 ? (
          <div className="divide-y border rounded-md overflow-hidden text-sm">
            {activeKeys.map((k) => {
              const org = k.organisations as unknown as { id: string; name: string; api_enabled: boolean } | null;
              return (
                <div key={k.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-medium">{k.label ?? org?.name ?? "—"}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {k.key_prefix}…
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right space-y-0.5 shrink-0">
                      {k.last_used_at ? (
                        <p>Last used {new Date(k.last_used_at).toLocaleDateString("en-GB")}</p>
                      ) : (
                        <p>Never used</p>
                      )}
                      <p>{k.rate_limit_per_hour} req/hr</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
            No active keys. Keys can be issued once organisations are approved and
            API access is enabled.
          </p>
        )}
      </section>

      {revokedKeys.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-medium text-muted-foreground">Revoked keys</h2>
          <div className="divide-y border rounded-md overflow-hidden text-sm opacity-60">
            {revokedKeys.map((k) => {
              const org = k.organisations as unknown as { name: string } | null;
              return (
                <div key={k.id} className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <p className="font-medium line-through">{k.label ?? org?.name ?? "—"}</p>
                    <p className="font-mono text-xs text-muted-foreground">{k.key_prefix}…</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    Revoked {new Date(k.revoked_at!).toLocaleDateString("en-GB")}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Key issuance UI coming in M6 (Organisation portal and API milestone).
      </p>
    </div>
  );
}
