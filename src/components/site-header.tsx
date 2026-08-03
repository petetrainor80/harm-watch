import Link from "next/link";
import { TriangleAlert, Eye } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b px-6 py-4 shrink-0">
      <Link
        href="/"
        className="font-bold text-lg tracking-tight hover:text-primary transition-colors inline-flex items-center gap-1.5"
      >
        <TriangleAlert className="size-5 shrink-0" strokeWidth={2.5} />
        Harm Watch
        <Eye className="size-5 shrink-0" strokeWidth={2.5} />
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-6 mt-auto shrink-0">
      <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground text-center">
        <span>© Harm Watch</span>
        <Link href="/privacy" className="hover:text-foreground underline underline-offset-4">
          Privacy notice
        </Link>
        <Link href="/terms" className="hover:text-foreground underline underline-offset-4">
          Terms of use
        </Link>
        <Link href="/about" className="hover:text-foreground underline underline-offset-4">
          About
        </Link>
        <Link href="/request-access" className="hover:text-foreground underline underline-offset-4">
          Organisation access
        </Link>
      </div>
    </footer>
  );
}
