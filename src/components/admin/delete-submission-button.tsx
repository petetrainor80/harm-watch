"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteSubmissionButton({
  submissionId,
  defangedUrl,
}: {
  submissionId: string;
  defangedUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/submissions/${submissionId}/delete`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    router.push("/admin/submissions");
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2 className="size-4" />
        Delete submission
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Delete submission?</h2>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the submission and all associated
                reports, tags, and data. This cannot be undone.
              </p>
            </div>

            <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-all">
              {defangedUrl}
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                {loading ? "Deleting…" : "Yes, delete permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
