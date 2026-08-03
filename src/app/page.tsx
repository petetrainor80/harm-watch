import { SubmissionForm } from "@/components/submission-form";
import { createServiceClient } from "@/lib/supabase/service";

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
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("label");

  if (error || !data) return { categories: [], descriptors: [] };

  return {
    categories: data.filter((t) => t.kind === "category"),
    descriptors: data.filter((t) => t.kind === "descriptor"),
  };
}

export default async function Home() {
  const { categories, descriptors } = await getTags();
  return <SubmissionForm categories={categories} descriptors={descriptors} />;
}
