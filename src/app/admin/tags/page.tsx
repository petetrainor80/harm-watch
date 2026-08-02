import { createClient } from "@/lib/supabase/server";

export default async function TagsPage() {
  const supabase = await createClient();

  const [{ data: tags }, { data: suggestions }] = await Promise.all([
    supabase
      .from("tags")
      .select("id, slug, label, kind, is_blocked, is_active, sort_order")
      .order("kind")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("label"),
    supabase
      .from("tag_suggestions")
      .select(
        `id, raw_text, status, created_at,
         reports(submission_id)`
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const categories = (tags ?? []).filter((t) => t.kind === "category");
  const descriptors = (tags ?? []).filter((t) => t.kind === "descriptor");

  return (
    <div className="space-y-10 max-w-3xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Tags</h1>
      </header>

      {suggestions && suggestions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-medium">
            Pending suggestions{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({suggestions.length})
            </span>
          </h2>
          <div className="divide-y border rounded-md overflow-hidden text-sm">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <p className="font-medium">{s.raw_text}</p>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(s.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Tag suggestion approval (promote to taxonomy) is coming in a later release.
          </p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-base font-medium">Categories</h2>
        <TaxonomyTable tags={categories} />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Descriptors</h2>
        <TaxonomyTable tags={descriptors} />
      </section>
    </div>
  );
}

function TaxonomyTable({
  tags,
}: {
  tags: {
    id: string;
    slug: string;
    label: string;
    is_blocked: boolean;
    is_active: boolean;
  }[];
}) {
  if (!tags.length)
    return <p className="text-sm text-muted-foreground">None.</p>;

  return (
    <div className="divide-y border rounded-md overflow-hidden text-sm">
      {tags.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between px-4 py-2.5 gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-medium">{t.label}</span>
            <span className="text-xs text-muted-foreground font-mono">{t.slug}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs">
            {t.is_blocked && (
              <span className="text-destructive font-medium">blocked</span>
            )}
            <span
              className={
                t.is_active ? "text-muted-foreground" : "text-muted-foreground opacity-50"
              }
            >
              {t.is_active ? "active" : "inactive"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
