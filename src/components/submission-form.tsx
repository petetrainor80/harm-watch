"use client";

import { useState, useCallback } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BlockedCategoryInterstitial } from "@/components/blocked-category-interstitial";

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "msclkid", "ref", "mc_eid", "igshid",
]);

function previewNormalisedUrl(raw: string): string {
  const url = new URL(raw.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https URLs are accepted");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "::1" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    throw new Error("Private and local addresses are not accepted");
  }
  const port =
    (url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")
      ? "" : url.port;
  const host = port ? `${hostname}:${port}` : hostname;
  const params = new URLSearchParams(url.searchParams);
  for (const key of [...params.keys()]) {
    if (TRACKING_PARAMS.has(key) || key.startsWith("utm_")) params.delete(key);
  }
  params.sort();
  const path = url.pathname === "/" ? "" : url.pathname;
  const search = params.size > 0 ? `?${params.toString()}` : "";
  return `${url.protocol}//${host}${path}${search}`;
}

interface Tag {
  slug: string;
  label: string;
  kind: "category" | "descriptor";
  is_blocked: boolean;
  redirect_url: string | null;
  redirect_copy: string | null;
}

interface Props {
  categories: Tag[];
  descriptors: Tag[];
}

type State =
  | { phase: "form" }
  | { phase: "blocked"; redirect_url: string; redirect_copy: string }
  | { phase: "success" };

export function SubmissionForm({ categories, descriptors }: Props) {
  const [state, setState] = useState<State>({ phase: "form" });
  const [url, setUrl] = useState("");
  const [normalisedPreview, setNormalisedPreview] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedDescriptors, setSelectedDescriptors] = useState<Set<string>>(new Set());
  const [context, setContext] = useState("");
  const [suggestedTag, setSuggestedTag] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setUrlError(null);
    setNormalisedPreview(null);
  }, []);

  const handleUrlBlur = useCallback(() => {
    if (!url) return;
    try {
      setNormalisedPreview(previewNormalisedUrl(url));
      setUrlError(null);
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Invalid URL");
      setNormalisedPreview(null);
    }
  }, [url]);

  const handleCategoryChange = useCallback(
    (tag: Tag, checked: boolean) => {
      if (checked && tag.is_blocked) {
        setState({
          phase: "blocked",
          redirect_url: tag.redirect_url!,
          redirect_copy: tag.redirect_copy!,
        });
        return;
      }
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        if (checked) next.add(tag.slug); else next.delete(tag.slug);
        return next;
      });
    },
    []
  );

  const handleDescriptorChange = useCallback((slug: string, checked: boolean) => {
    setSelectedDescriptors((prev) => {
      const next = new Set(prev);
      if (checked) next.add(slug); else next.delete(slug);
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!turnstileToken) {
      setSubmitError("Please complete the security check.");
      return;
    }
    if (!consent) {
      setSubmitError("Please confirm you have read the terms.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          categories: [...selectedCategories],
          descriptors: [...selectedDescriptors],
          context: context || undefined,
          suggested_tag: suggestedTag || undefined,
          reporter_email: reporterEmail || undefined,
          turnstile_token: turnstileToken,
          company_url: "", // honeypot — always empty from legitimate form
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        if (body.error?.code === "blocked_category") {
          setState({
            phase: "blocked",
            redirect_url: body.error.redirect_url,
            redirect_copy: body.error.redirect_copy,
          });
          return;
        }
        setSubmitError(
          body.error?.message ?? "Something went wrong. Please try again."
        );
        return;
      }

      setState({ phase: "success" });
    } catch {
      setSubmitError("Could not send your report. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (state.phase === "blocked") {
    return (
      <BlockedCategoryInterstitial
        redirectUrl={state.redirect_url}
        redirectCopy={state.redirect_copy}
        onBack={() => setState({ phase: "form" })}
      />
    );
  }

  if (state.phase === "success") {
    return (
      <div className="space-y-5">
        <p className="text-base leading-7">
          Thank you. Your report has been received.
        </p>
        <p className="text-sm text-muted-foreground leading-6">
          If you need to report additional harm, you may also use:{" "}
          <strong>report.police.uk</strong> for a specific crime,{" "}
          <strong>actionfraud.police.uk</strong> for fraud,{" "}
          <strong>iwf.org.uk/report</strong> for child sexual abuse material, or{" "}
          <strong>gov.uk/report-terrorism</strong> for terrorism.
        </p>
        <button
          type="button"
          onClick={() => {
            setState({ phase: "form" });
            setUrl("");
            setNormalisedPreview(null);
            setSelectedCategories(new Set());
            setSelectedDescriptors(new Set());
            setContext("");
            setSuggestedTag("");
            setReporterEmail("");
            setConsent(false);
            setTurnstileToken(null);
          }}
          className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
        >
          Report another URL
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Honeypot — visually hidden, must stay empty */}
      <input
        type="text"
        name="company_url"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
        autoComplete="off"
      />

      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="url">Website URL <span aria-hidden>*</span></Label>
        <input
          id="url"
          type="url"
          required
          placeholder="https://example.com/page"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onBlur={handleUrlBlur}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-describedby={urlError ? "url-error" : normalisedPreview ? "url-preview" : undefined}
        />
        {urlError && (
          <p id="url-error" className="text-sm text-destructive" role="alert">
            {urlError}
          </p>
        )}
        {normalisedPreview && !urlError && (
          <p id="url-preview" className="text-sm text-muted-foreground">
            Will be recorded as: <span className="font-mono">{normalisedPreview}</span>
          </p>
        )}
      </div>

      {/* Categories */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Category <span aria-hidden>*</span>
          <span className="block text-muted-foreground font-normal mt-1">
            Select all that apply. If you are reporting a specific crime rather
            than a website, use{" "}
            <span className="font-medium">report.police.uk</span> or{" "}
            <span className="font-medium">actionfraud.police.uk</span> instead.
          </span>
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categories.map((tag) => (
            <label
              key={tag.slug}
              className="flex items-start gap-2 rounded-md border border-input p-3 text-sm cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0"
                checked={selectedCategories.has(tag.slug)}
                onChange={(e) => handleCategoryChange(tag, e.target.checked)}
              />
              <span className={tag.is_blocked ? "font-medium text-destructive" : ""}>
                {tag.label}
                {tag.is_blocked && (
                  <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                    You will be directed to the appropriate authority
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Descriptors */}
      {descriptors.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium leading-none">
            Descriptors{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {descriptors.map((tag) => (
              <label
                key={tag.slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1 text-sm cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedDescriptors.has(tag.slug)}
                  onChange={(e) =>
                    handleDescriptorChange(tag.slug, e.target.checked)
                  }
                />
                {tag.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Context */}
      <div className="space-y-2">
        <Label htmlFor="context">
          Describe the harm{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="context"
          placeholder="Briefly describe what you saw and why you consider it harmful. Do not include personal information about yourself or others."
          rows={4}
          maxLength={500}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          aria-describedby="context-count"
        />
        <p id="context-count" className="text-xs text-muted-foreground text-right">
          {context.length}/500
        </p>
      </div>

      {/* Suggested tag */}
      <div className="space-y-2">
        <Label htmlFor="suggested_tag">
          Suggest a category{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <input
          id="suggested_tag"
          type="text"
          maxLength={40}
          placeholder="e.g. online grooming"
          value={suggestedTag}
          onChange={(e) => setSuggestedTag(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-describedby="suggested-tag-hint"
        />
        <p id="suggested-tag-hint" className="text-xs text-muted-foreground">
          Suggestions are reviewed before being added to the taxonomy.
        </p>
      </div>

      {/* Reporter email */}
      <div className="space-y-2">
        <Label htmlFor="reporter_email">
          Your email address{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <input
          id="reporter_email"
          type="email"
          placeholder="you@example.com"
          value={reporterEmail}
          onChange={(e) => setReporterEmail(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-describedby="email-hint"
        />
        <p id="email-hint" className="text-xs text-muted-foreground">
          Only provide this if you are happy to be contacted about this report.
          It is never shared with organisations that receive the feed.
        </p>
      </div>

      {/* Turnstile */}
      <div>
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
        />
      </div>

      {/* Consent */}
      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          aria-describedby="consent-hint"
        />
        <span id="consent-hint">
          I am making this report in good faith and have read the{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-muted-foreground">
            terms of use
          </a>
          .
        </span>
      </label>

      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || selectedCategories.size === 0 || !url || !consent}
        className="w-full sm:w-auto"
      >
        {submitting ? "Sending…" : "Submit report"}
      </Button>
    </form>
  );
}
