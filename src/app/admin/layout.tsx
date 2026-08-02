import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// The proxy (proxy.ts) already guards /admin, but we double-check role here
// so server components are never accidentally rendered for non-admins.
export default async function AdminLayout({
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/");

  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-4 flex items-center gap-6 text-sm">
        <span className="font-semibold">Admin</span>
        <a href="/admin/organisations" className="text-muted-foreground hover:text-foreground">
          Organisations
        </a>
      </nav>
      <main className="px-6 py-10">{children}</main>
    </div>
  );
}
