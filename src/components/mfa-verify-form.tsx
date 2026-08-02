"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function MfaVerifyForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Get the enrolled TOTP factor.
    const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr || !factors.totp.length) {
      setError("No authenticator app found. Please contact support.");
      setLoading(false);
      return;
    }

    const factorId = factors.totp[0].id;

    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr || !challenge) {
      setError("Could not start the verification. Please try again.");
      setLoading(false);
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyErr) {
      setError("Incorrect code. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="code">Authentication code</Label>
        <input
          id="code"
          type="text"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono tracking-widest ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-describedby="code-hint"
        />
        <p id="code-hint" className="text-xs text-muted-foreground">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
        {loading ? "Verifying…" : "Verify"}
      </Button>
    </form>
  );
}
