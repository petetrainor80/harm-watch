"use client";

import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ORG_TYPE_LABELS: Record<string, string> = {
  charity: "Charity",
  government: "Government body or regulator",
  isp: "Internet service provider",
  legal: "Legal organisation",
  other: "Other",
};

export function OrgRegistrationForm() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fields, setFields] = useState({
    org_name: "",
    website: "",
    contact_name: "",
    work_email: "",
    job_title: "",
    org_type: "",
    registration_number: "",
    justification: "",
  });

  const set = (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!turnstileToken) {
      setSubmitError("Please complete the security check.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, turnstile_token: turnstileToken }),
      });
      const body = await res.json();
      if (!res.ok) {
        // Surface first field-level Zod error if available, otherwise use top-level message
        const fieldErrors: Record<string, string[]> | undefined =
          body.error?.details?.fieldErrors;
        const firstFieldError = fieldErrors
          ? Object.entries(fieldErrors)
              .filter(([, errs]) => errs?.length)
              .map(([field, errs]) => `${field}: ${errs![0]}`)
              [0]
          : undefined;
        setSubmitError(
          firstFieldError ?? body.error?.message ?? "Something went wrong. Please try again."
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Could not send your request. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <p className="text-base font-semibold text-green-600 dark:text-green-400">
          Thank you. We have received your request and will review it within a few
          working days.
        </p>
        <p className="text-sm text-muted-foreground">
          You will receive an email at <strong>{fields.work_email}</strong> once
          a decision has been made.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <fieldset className="space-y-6">
        <legend className="sr-only">Organisation details</legend>

        <div className="space-y-2">
          <Label htmlFor="org_name">Organisation name <span aria-hidden>*</span></Label>
          <input
            id="org_name" type="text" required maxLength={200}
            value={fields.org_name} onChange={set("org_name")}
            placeholder="Acme Charity"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Organisation website <span aria-hidden>*</span></Label>
          <input
            id="website" type="url" required maxLength={200}
            value={fields.website} onChange={set("website")}
            placeholder="https://www.example.org"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org_type">Organisation type <span aria-hidden>*</span></Label>
          <select
            id="org_type" required
            value={fields.org_type} onChange={set("org_type")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="" disabled>Select…</option>
            {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registration_number">
            Charity or company number{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <input
            id="registration_number" type="text" maxLength={50}
            value={fields.registration_number} onChange={set("registration_number")}
            placeholder="1234567"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="text-sm font-medium">Contact person</legend>

        <div className="space-y-2">
          <Label htmlFor="contact_name">Full name <span aria-hidden>*</span></Label>
          <input
            id="contact_name" type="text" required maxLength={200}
            value={fields.contact_name} onChange={set("contact_name")}
            placeholder="Jane Smith"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="work_email">Work email address <span aria-hidden>*</span></Label>
          <input
            id="work_email" type="email" required maxLength={200}
            value={fields.work_email} onChange={set("work_email")}
            placeholder="jane@example.org"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_title">Job title <span aria-hidden>*</span></Label>
          <input
            id="job_title" type="text" required maxLength={200}
            value={fields.job_title} onChange={set("job_title")}
            placeholder="Head of Policy"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="justification">
          Why does your organisation need access? <span aria-hidden>*</span>
        </Label>
        <Textarea
          id="justification"
          required
          rows={6}
          maxLength={2000}
          placeholder="Please explain your organisation's interest in the harm reporting data, how you intend to use it, and any relevant context about your work."
          value={fields.justification}
          onChange={set("justification")}
          aria-describedby="justification-hint"
        />
        <p id="justification-hint" className="text-xs text-muted-foreground">
          Minimum 20 characters. {fields.justification.length}/2000.
        </p>
      </div>

      <div>
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
        />
      </div>

      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || !turnstileToken || !fields.org_name || !fields.work_email || !fields.justification || !fields.org_type}
        className="w-full sm:w-auto"
      >
        {submitting ? "Sending…" : "Submit request"}
      </Button>
    </form>
  );
}
