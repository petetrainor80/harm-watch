"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  suggestionId: string;
  rawText: string;
}

export function SuggestionActions({ suggestionId, rawText }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [slug, setSlug] = useState(rawText.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60));
  const [label, setLabel] = useState(rawText.slice(0, 100));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  const inputCls = "h-8 px-2 rounded border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const submit = async (action: "approve" | "reject") => {
    setLoading(true);
    const body =
      action === "approve"
        ? { action, new_tag_slug: slug, new_tag_label: label }
        : { action };

    await fetch(`/api/admin/tags/suggestions/${suggestionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setDone(action === "approve" ? "approved" : "rejected");
    setLoading(false);
    router.refresh();
  };

  if (done) {
    return (
      <span className="text-xs text-muted-foreground italic">
        {done === "approved" ? "Approved ✓" : "Rejected"}
      </span>
    );
  }

  if (mode === "approve") {
    return (
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex gap-2">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug"
            className={inputCls + " w-40"}
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className={inputCls + " flex-1"}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => submit("approve")}
            disabled={loading || !slug || !label}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground disabled:opacity-50"
          >
            {loading ? "…" : "Confirm approve"}
          </button>
          <button onClick={() => setMode("idle")} className="text-xs px-2 py-1 rounded border hover:bg-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setMode("approve")}
        className="text-xs px-2 py-1 rounded border hover:bg-secondary"
      >
        Approve
      </button>
      <button
        onClick={() => submit("reject")}
        disabled={loading}
        className="text-xs px-2 py-1 rounded border text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        {loading ? "…" : "Reject"}
      </button>
    </div>
  );
}
