"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  keyId: string;
  endpoint?: string;
}

export function RevokeKeyButton({ keyId, endpoint = "/api/org/api-keys" }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRevoke = async () => {
    setLoading(true);
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId }),
    });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
    setConfirming(false);
  };

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <button
          onClick={handleRevoke}
          disabled={loading}
          className="px-2 py-1 rounded bg-destructive text-white text-xs hover:bg-destructive/80 disabled:opacity-50"
        >
          {loading ? "Revoking…" : "Confirm"}
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
      onClick={(e) => {
        e.preventDefault();
        setConfirming(true);
      }}
      className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
    >
      Revoke
    </button>
  );
}
