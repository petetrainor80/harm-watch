"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  redirectAfter?: boolean;
}

export function RemoveButton({ id, redirectAfter = false }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/submissions/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "removed", status_note: "Removed by admin" }),
    });
    setLoading(false);
    if (res.ok) {
      if (redirectAfter) {
        router.push("/admin/submissions");
      } else {
        router.refresh();
      }
    }
    setConfirming(false);
  };

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <button
          onClick={handleRemove}
          disabled={loading}
          className="px-2 py-1 rounded bg-destructive text-white text-xs hover:bg-destructive/80 disabled:opacity-50"
        >
          {loading ? "Removing…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 rounded border text-xs hover:bg-secondary"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); setConfirming(true); }}
      className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
    >
      Remove
    </button>
  );
}
