"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ORG_TYPES = ["charity", "government", "isp", "legal", "other"] as const;
const TYPE_LABELS: Record<string, string> = {
  charity: "Charity",
  government: "Government",
  isp: "ISP",
  legal: "Legal",
  other: "Other",
};

interface Props {
  orgId: string;
  orgType: string | null;
}

export function ApproveRejectButtons({ orgId, orgType }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "approving" | "rejecting">("idle");
  const [selectedType, setSelectedType] = useState(orgType ?? "");
  const [apiEnabled, setApiEnabled] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/organisations/${orgId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_type: selectedType, api_enabled: apiEnabled }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error?.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    router.refresh();
  };

  const handleReject = async () => {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/organisations/${orgId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectionReason }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error?.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    router.refresh();
  };

  if (mode === "approving") {
    return (
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`type-${orgId}`}>Organisation type</Label>
            <select
              id={`type-${orgId}`}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>Select…</option>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={apiEnabled}
                onChange={(e) => setApiEnabled(e.target.checked)}
              />
              Enable API access
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={loading || !selectedType}
          >
            {loading ? "Approving…" : "Confirm approval"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode("idle")} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "rejecting") {
    return (
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label htmlFor={`reason-${orgId}`}>Rejection reason</Label>
          <Textarea
            id={`reason-${orgId}`}
            rows={3}
            maxLength={500}
            placeholder="Briefly explain why the application was declined. This will be included in the notification email."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
          >
            {loading ? "Rejecting…" : "Confirm rejection"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode("idle")} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => setMode("approving")}>Approve</Button>
      <Button size="sm" variant="outline" onClick={() => setMode("rejecting")}>
        Reject
      </Button>
    </div>
  );
}
