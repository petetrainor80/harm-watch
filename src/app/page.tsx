import { SubmissionForm } from "@/components/submission-form";
import { createServiceClient } from "@/lib/supabase/service";

// Always server-render — taxonomy data must be fresh and the service role
// key is not available at build time in CI.
export const dynamic = "force-dynamic";

async function getTags() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { categories: [], descriptors: [] };
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tags")
    .select("slug, label, kind, is_blocked, redirect_url, redirect_copy")
    .eq("is_active", true)
    .order("label");

  if (error || !data) return { categories: [], descriptors: [] };

  return {
    categories: data.filter((t) => t.kind === "category"),
    descriptors: data.filter((t) => t.kind === "descriptor"),
  };
}

export default async function Home() {
  const { categories, descriptors } = await getTags();

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Report harmful content
          </h1>
          <p className="text-muted-foreground text-base leading-7">
            Use this form to report a website you believe breaches the Online
            Safety Act 2023. Reports are logged and made available to approved
            organisations. Do not use this form to report an emergency — call
            999.
          </p>
        </header>

        <SubmissionForm categories={categories} descriptors={descriptors} />
      </div>
    </main>
  );
}
