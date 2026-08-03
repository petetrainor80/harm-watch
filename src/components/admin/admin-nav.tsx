"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { TriangleAlert, Eye, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/api-keys", label: "API keys" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="border-b px-6 py-3 flex items-center gap-1 text-sm overflow-x-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 font-bold tracking-tight mr-4 shrink-0">
        <TriangleAlert className="size-4 shrink-0 text-[#1d70b8]" strokeWidth={2.5} />
        <span className="bg-gradient-to-r from-foreground to-[#1d70b8] bg-clip-text text-transparent">
          Harm Watch
        </span>
        <Eye className="size-4 shrink-0 text-[#1d70b8]" strokeWidth={2.5} />
      </Link>
      {NAV_ITEMS.map(({ href, label }) => {
        const active =
          href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              active
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {label}
          </Link>
        );
      })}
      <button
        onClick={handleSignOut}
        className="ml-auto shrink-0 px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
      >
        <LogOut className="size-3.5" />
        Sign out
      </button>
    </nav>
  );
}
