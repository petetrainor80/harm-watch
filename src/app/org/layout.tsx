import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrgNav } from "@/components/org/org-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id, is_active")
    .eq("id", user.id)
    .single();

  if (
    profile?.role !== "org_admin" &&
    profile?.role !== "org_member"
  ) {
    redirect("/");
  }

  const isAdmin = profile?.role === "org_admin";

  return (
    <div className="min-h-screen">
      <OrgNav isAdmin={isAdmin} />
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
