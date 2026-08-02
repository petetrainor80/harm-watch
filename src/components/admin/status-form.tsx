"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const STATUSES = [
  { value: "live", label: "Live" },
  { value: "pending_review", label: "Pending review" },
  { value: "removed", label: "Removed" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicate", label: "Duplicate" },
] as const;

interface Props {
  submissionId: string;
  currentStatus: string;
  currentNote: string | null;
}

export function StatusForm({ submissionId, currentStatus, currentNote }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("A status note is required.");
      return;
    }
    setError(null);
    setLoading(true);
    setSaved(false);

    const res = await fetch(`/api/admin/submissions/${submissionId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, status_note: note }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to update status.");
    } else {
      setSaved(true);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1.5">
          <Label htmlFor="status-select">Status</Label>
          <select
            id="status-select"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status-note">
          Note <span className="text-muted-foreground font-normal">(required)</span>
        </Label>
        <textarea
          id="status-note"
          required
          maxLength={500}
          rows={3}
          placeholder="Reason for this status change…"
          value={note}
          onChange={(e) => { setNote(e.target.value); setSaved(false); }}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Status updated.</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Update status"}
      </Button>
    </form>
  );
}
