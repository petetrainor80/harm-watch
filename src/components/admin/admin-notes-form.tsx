"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  submissionId: string;
  currentNotes: string | null;
}

export function AdminNotesForm({ submissionId, currentNotes }: Props) {
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSaved(false);

    const res = await fetch(`/api/admin/submissions/${submissionId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: notes }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save notes.");
    } else {
      setSaved(true);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Label htmlFor="admin-notes">
        Admin notes{" "}
        <span className="text-muted-foreground font-normal">— internal only, never exposed</span>
      </Label>
      <textarea
        id="admin-notes"
        rows={4}
        maxLength={2000}
        placeholder="Internal notes about this submission…"
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600 dark:text-green-400">Notes saved.</p>}
      <Button type="submit" variant="outline" disabled={loading}>
        {loading ? "Saving…" : "Save notes"}
      </Button>
    </form>
  );
}
