import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IssueKeyForm } from "@/components/org/issue-key-form";
import { RevokeKeyButton } from "@/components/org/revoke-key-button";

export const dynamic = "force-dynamic";

export default async function OrgApiKeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "org_admin") redirect("/org");

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, label, key_prefix, last_used_at, revoked_at, created_at")
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  const activeKeys = (keys ?? []).filter((k) => !k.revoked_at);
  const revokedKeys = (keys ?? []).filter((k) => k.revoked_at);

  return (
    <div className="space-y-10 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">API keys</h1>
        <p className="text-sm text-muted-foreground">
          Keys authenticate requests to the read-only submissions API. The plaintext
          key is shown exactly once at issuance — save it immediately.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Active keys</h2>
        {activeKeys.length > 0 ? (
          <div className="divide-y border rounded-md overflow-hidden text-sm">
            {activeKeys.map((k) => (
              <div key={k.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-medium truncate">{k.label ?? "—"}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {k.key_prefix}…
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-xs text-muted-foreground text-right space-y-0.5">
                    {k.last_used_at ? (
                      <p>Last used {new Date(k.last_used_at).toLocaleDateString("en-GB")}</p>
                    ) : (
                      <p>Never used</p>
                    )}
                    <p>Created {new Date(k.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <RevokeKeyButton keyId={k.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
            No active keys. Issue one below.
          </p>
        )}
      </section>

      {revokedKeys.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-medium text-muted-foreground">Revoked keys</h2>
          <div className="divide-y border rounded-md overflow-hidden text-sm opacity-60">
            {revokedKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="font-medium line-through">{k.label ?? "—"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{k.key_prefix}…</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  Revoked {new Date(k.revoked_at!).toLocaleDateString("en-GB")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-base font-medium">Issue a new key</h2>
        <IssueKeyForm />
      </section>
    </div>
  );
}
