"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/admin/copy-button";

interface Org {
  id: string;
  name: string;
}

interface Props {
  orgs: Org[];
}

const INPUT_CLS =
  "flex w-full border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring rounded-md";

export function IssueKeyForm({ orgs }: Props) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, label }),
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
        <Label htmlFor="issue-org">Organisation</Label>
        {orgs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No approved organisations available.
          </p>
        ) : (
          <select
            id="issue-org"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="issue-label">Key label</Label>
        <input
          id="issue-label"
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
      <Button type="submit" disabled={loading || orgs.length === 0}>
        {loading ? "Issuing…" : "Issue API key"}
      </Button>
    </form>
  );
}
