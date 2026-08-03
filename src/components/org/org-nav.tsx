"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface OrgNavProps {
  isAdmin: boolean;
}

export function OrgNav({ isAdmin }: OrgNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/org", label: "Feed" },
    ...(isAdmin ? [{ href: "/org/api-keys", label: "API keys" }] : []),
    { href: "/org/docs", label: "Documentation" },
  ];

  return (
    <nav className="border-b px-6 py-3 flex items-center gap-1 text-sm overflow-x-auto">
      <span className="font-semibold mr-4 shrink-0">Portal</span>
      {navItems.map(({ href, label }) => {
        const active =
          href === "/org" ? pathname === "/org" : pathname.startsWith(href);
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
        className="ml-auto shrink-0 px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors whitespace-nowrap"
      >
        Sign out
      </button>
    </nav>
  );
}
