"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Tag {
  slug: string;
  label: string;
}

interface CurrentCategory {
  slug: string;
  label: string;
  report_count: number;
}

interface Props {
  submissionId: string;
  currentCategories: CurrentCategory[];
  availableCategories: Tag[];
}

export function ManageTagsForm({ submissionId, currentCategories, availableCategories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentSlugs = new Set(currentCategories.map(c => c.slug));
  const addable = availableCategories.filter(t => !currentSlugs.has(t.slug));

  const mutate = async (method: "POST" | "DELETE", slug: string) => {
    setError(null);
    const res = await fetch(`/api/admin/submissions/${submissionId}/tags`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) {
      const json = await res.json() as { error?: string };
      setError(json.error ?? "Something went wrong");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">Categories</h2>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 min-h-7">
          {currentCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories assigned.</p>
          )}
          {currentCategories.map(tag => (
            <span
              key={tag.slug}
              className="inline-flex items-center gap-1.5 text-xs bg-secondary px-2.5 py-1 rounded-full"
            >
              {tag.label}
              <span className="text-muted-foreground tabular-nums">({tag.report_count})</span>
              <button
                onClick={() => mutate("DELETE", tag.slug)}
                disabled={isPending}
                aria-label={`Remove ${tag.label}`}
                className="text-muted-foreground hover:text-foreground disabled:opacity-40 -mr-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>

        {addable.length > 0 && (
          <select
            defaultValue=""
            disabled={isPending}
            onChange={e => {
              if (e.target.value) {
                mutate("POST", e.target.value);
                e.target.value = "";
              }
            }}
            className="text-sm border rounded-md px-2.5 py-1.5 bg-background text-foreground disabled:opacity-50 cursor-pointer"
          >
            <option value="" disabled>+ Add category…</option>
            {addable.map(t => (
              <option key={t.slug} value={t.slug}>{t.label}</option>
            ))}
          </select>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </section>
  );
}
