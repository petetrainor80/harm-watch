"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  orgId: string;
  currentStatus: string;
}

export function SuspendReinstateButton({ orgId, currentStatus }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuspended = currentStatus === "suspended";
  const action = isSuspended ? "reinstate" : "suspend";

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/organisations/${orgId}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error?.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    router.refresh();
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-destructive">{error}</span>}
        <span className="text-xs text-muted-foreground">
          {isSuspended ? "Reinstate this organisation?" : "Suspend this organisation?"}
        </span>
        <Button
          size="sm"
          variant={isSuspended ? "default" : "destructive"}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "…" : isSuspended ? "Reinstate" : "Suspend"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
        Reinstate
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={() => setConfirming(true)}
      className="text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800">
      Suspend
    </Button>
  );
}
