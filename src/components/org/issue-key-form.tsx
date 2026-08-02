"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/admin/copy-button";

const INPUT_CLS =
  "flex w-full border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring rounded-md";

export function IssueKeyForm() {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/org/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });

    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to issue key.");
      return;
    }

    setIssuedKey(body.key);
    setLabel("");
  };

  const handleDismiss = () => {
    setIssuedKey(null);
    router.refresh();
  };

  if (issuedKey) {
    return (
      <div className="space-y-4 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950 p-4 text-sm max-w-lg">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          Save this key — it cannot be shown again.
        </p>
        <div className="flex items-center gap-2 font-mono text-xs break-all">
          <span className="flex-1">{issuedKey}</span>
          <CopyButton text={issuedKey} label="Copy key" />
        </div>
        <Button variant="outline" size="sm" onClick={handleDismiss}>
          I have saved the key
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="key-label">Key label</Label>
        <input
          id="key-label"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. Production feed reader"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={INPUT_CLS}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Issuing…" : "Issue API key"}
      </Button>
    </form>
  );
}
