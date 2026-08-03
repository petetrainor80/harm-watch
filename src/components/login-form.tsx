"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  next?: string;
}

export function LoginForm({ next }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicSent, setMagicSent] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    // Redirect based on role so org users don't get bounced from /admin.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "org_admin" || profile?.role === "org_member") {
        window.location.href = "/org";
        return;
      }
    }

    window.location.href = next ?? "/admin";
  };

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setError("Could not send the link. Please check the email address and try again.");
    } else {
      setMagicSent(true);
    }
    setLoading(false);
  };

  if (magicSent) {
    return (
      <div className="space-y-4">
        <p className="text-base leading-7">
          Check your email. We&apos;ve sent a sign-in link to{" "}
          <span className="font-medium">{email}</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          The link expires after one hour. If it does not arrive, check your spam folder.
        </p>
        <button
          type="button"
          onClick={() => { setMagicSent(false); setEmail(""); }}
          className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </button>
      </div>
    );
  }

  if (mode === "magic") {
    return (
      <form onSubmit={handleMagicSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email-magic">Email address</Label>
          <input
            id="email-magic"
            type="email"
            required
            autoComplete="email"
            placeholder="you@organisation.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLS}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send sign-in link"}
        </Button>

        <button
          type="button"
          onClick={() => { setMode("password"); setError(null); }}
          className="w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Sign in with password instead
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@organisation.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <button
        type="button"
        onClick={() => { setMode("magic"); setError(null); }}
        className="w-full text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Send me a sign-in link instead
      </button>
    </form>
  );
}
