"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  isActive: boolean;
  role: string;
}

export function UserActions({ userId, isActive, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invited, setInvited] = useState(false);
  const [confirmingPromotion, setConfirmingPromotion] = useState(false);

  const call = async (body: Record<string, unknown>, label: string) => {
    setLoading(label);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
    } else {
      if (label === "invite") setInvited(true);
      router.refresh();
    }
    setLoading(null);
  };

  const btnCls = "text-xs px-2 py-1 rounded border hover:bg-secondary transition-colors disabled:opacity-50";

  if (role === "super_admin") {
    return <span className="text-xs text-muted-foreground italic">Super admin</span>;
  }

  if (confirmingPromotion) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          Grant full super admin access?
        </span>
        <button
          onClick={() => {
            setConfirmingPromotion(false);
            call({ action: "set_role", role: "super_admin" }, "role");
          }}
          disabled={!!loading}
          className="text-xs px-2 py-1 rounded border border-amber-500 bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading === "role" ? "…" : "Yes, promote"}
        </button>
        <button
          onClick={() => setConfirmingPromotion(false)}
          disabled={!!loading}
          className={btnCls}
        >
          Cancel
        </button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => call({ action: "set_active", is_active: !isActive }, "active")}
        disabled={!!loading}
        className={btnCls}
      >
        {loading === "active" ? "…" : isActive ? "Deactivate" : "Reactivate"}
      </button>

      {role === "org_member" && (
        <button
          onClick={() => call({ action: "set_role", role: "org_admin" }, "role")}
          disabled={!!loading}
          className={btnCls}
        >
          {loading === "role" ? "…" : "Make org admin"}
        </button>
      )}
      {role === "org_admin" && (
        <button
          onClick={() => call({ action: "set_role", role: "org_member" }, "role")}
          disabled={!!loading}
          className={btnCls}
        >
          {loading === "role" ? "…" : "Make member"}
        </button>
      )}

      <button
        onClick={() => call({ action: "resend_invite" }, "invite")}
        disabled={!!loading || invited}
        className={btnCls}
      >
        {loading === "invite" ? "…" : invited ? "Sent ✓" : "Resend invite"}
      </button>

      <button
        onClick={() => setConfirmingPromotion(true)}
        disabled={!!loading}
        className={`${btnCls} text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950`}
      >
        Make super admin
      </button>

      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
