"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Step = "qr" | "verify" | "done";

export function MfaSetupForm() {
  const [step, setStep] = useState<Step>("qr");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const enroll = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator",
      });
      if (error || !data) {
        setError("Could not start MFA setup. Please try signing out and back in.");
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    };
    enroll();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeErr || !challenge) {
      setError("Could not create a verification challenge. Please try again.");
      setLoading(false);
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyErr) {
      setError("Incorrect code. Check your authenticator app and try again.");
      setLoading(false);
      return;
    }

    setStep("done");
    setLoading(false);
  };

  if (step === "done") {
    return (
      <div className="space-y-4">
        <p className="text-base leading-7">
          Two-factor authentication is now enabled on your account.
        </p>
        <Button onClick={() => { router.push("/admin"); router.refresh(); }}>
          Continue to admin
        </Button>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground leading-6">
          Scan the QR code with an authenticator app such as Google Authenticator,
          Authy, or 1Password.
        </p>

        {qrCode ? (
          <div className="flex flex-col items-start gap-4">
            <Image
              src={qrCode}
              alt="TOTP QR code — scan with your authenticator app"
              width={180}
              height={180}
              unoptimized
            />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Can&apos;t scan the code?
              </summary>
              <p className="mt-2 font-mono break-all">{secret}</p>
            </details>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground animate-pulse">
            Generating QR code…
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          onClick={() => setStep("verify")}
          disabled={!qrCode}
        >
          I&apos;ve scanned the code
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app to confirm the setup.
      </p>

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
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => { setCode(""); setError(null); setStep("qr"); }}
        >
          Back
        </Button>
        <Button type="submit" disabled={loading || code.length !== 6}>
          {loading ? "Verifying…" : "Enable two-factor authentication"}
        </Button>
      </div>
    </form>
  );
}
