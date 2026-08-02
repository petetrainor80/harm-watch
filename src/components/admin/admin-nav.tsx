"use client";

import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/api-keys", label: "API keys" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b px-6 py-3 flex items-center gap-1 text-sm overflow-x-auto">
      <span className="font-semibold mr-4 shrink-0">Admin</span>
      {NAV_ITEMS.map(({ href, label }) => {
        const active =
          href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);
        return (
          <a
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              active
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
