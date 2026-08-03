import type { Metadata } from "next";
import { SubmissionForm } from "@/components/submission-form";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Report a Harmful Website",
  description:
    "Use Harm Watch to report a website, forum or service that breaches the Online Safety Act 2023. Free, anonymous, and takes under a minute.",
  openGraph: {
    title: "Report a Harmful Website | Harm Watch",
    description:
      "Use Harm Watch to report a website, forum or service that breaches the Online Safety Act 2023. Free, anonymous, and takes under a minute.",
    url: "https://www.harm.watch",
  },
};

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
