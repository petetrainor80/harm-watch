"use client";

import { useState, useCallback, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BlockedCategoryInterstitial } from "@/components/blocked-category-interstitial";
import Link from "next/link";
import { TriangleAlert, Eye, ArrowRightToLine, CircleAlert, Info } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "msclkid", "ref", "mc_eid", "igshid",
]);

function previewNormalisedUrl(raw: string): string {
  const url = new URL(raw.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new Error("Only http and https URLs are accepted");
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "::1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  )
    throw new Error("Private and local addresses are not accepted");
  const canonHostname = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  const port = url.port === "80" || url.port === "443" ? "" : url.port;
  const host = port ? `${canonHostname}:${port}` : canonHostname;
  const params = new URLSearchParams(url.searchParams);
  for (const key of [...params.keys()]) {
    if (TRACKING_PARAMS.has(key) || key.startsWith("utm_")) params.delete(key);
  }
  params.sort();
  const path = url.pathname === "/" ? "" : url.pathname;
  const search = params.size > 0 ? `?${params.toString()}` : "";
  return `https://${host}${path}${search}`;
}

// Browser-safe defang — replaces scheme and dots in hostname so the URL
// is never rendered as a clickable link.
function defangUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.protocol.replace("http", "hxxp")}//${u.hostname.replace(/\./g, "[.]")}${u.port ? `:${u.port}` : ""}${u.pathname}${u.search}`;
  } catch {
    return raw.replace(/^https?:\/\//, (m) => m.replace("http", "hxxp"));
  }
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
  | { phase: "landing" }
  | { phase: "form" }
  | { phase: "blocked"; redirect_url: string; redirect_copy: string }
  | { phase: "success" };

const INPUT_CLS =
  "flex w-full border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring rounded-md";

export function SubmissionForm({ categories, descriptors }: Props) {
  const [state, setState] = useState<State>({ phase: "landing" });
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [normalisedPreview, setNormalisedPreview] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedDescriptors, setSelectedDescriptors] = useState<Set<string>>(new Set());
  const [context, setContext] = useState("");
  const [suggestedTag, setSuggestedTag] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<null | "checking" | { count: number }>(null);

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) { setCheckStatus(null); return; }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      try { new URL(withScheme); } catch { return; }

      if (!cancelled) setCheckStatus("checking");
      try {
        const res = await fetch(`/api/submissions/check?url=${encodeURIComponent(withScheme)}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setCheckStatus({ count: data.count });
        }
      } catch {
        if (!cancelled) setCheckStatus(null);
      }
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [url]);

  const handleUrlContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlError("Enter a web address");
      return;
    }
    // Be forgiving: add https:// if the user omitted the scheme
    const withScheme =
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const normalised = previewNormalisedUrl(withScheme);
      setUrl(withScheme);
      setNormalisedPreview(normalised);
      setUrlError(null);
      setState({ phase: "form" });
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Enter a valid web address");
    }
  };

  const handleCategoryChange = useCallback((tag: Tag, checked: boolean) => {
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
  }, []);

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
          company_url: "",
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
        setSubmitError(body.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setState({ phase: "success" });
    } catch {
      setSubmitError("Could not send your report. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setState({ phase: "landing" });
    setUrl("");
    setNormalisedPreview(null);
    setUrlError(null);
    setSelectedCategories(new Set());
    setSelectedDescriptors(new Set());
    setContext("");
    setSuggestedTag("");
    setReporterEmail("");
    setConsent(false);
    setTurnstileToken(null);
    setSubmitError(null);
  };

  // ── Blocked category interstitial ─────────────────────────────────────────
  if (state.phase === "blocked") {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full">
          <BlockedCategoryInterstitial
            redirectUrl={state.redirect_url}
            redirectCopy={state.redirect_copy}
            onBack={() => setState({ phase: "form" })}
          />
        </div>
        <SiteFooter />
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (state.phase === "success") {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight">Report received</h1>
          <p className="text-base leading-7">
            Thank you. Your report has been securely logged and will be made
            available to approved organisations.
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            If you need to report additional harm, you may also contact:{" "}
            <strong className="text-foreground">report.police.uk</strong> for a
            specific crime,{" "}
            <strong className="text-foreground">actionfraud.police.uk</strong>{" "}
            for fraud, <strong className="text-foreground">iwf.org.uk/report</strong>{" "}
            for child sexual abuse material, or{" "}
            <strong className="text-foreground">gov.uk/report-terrorism</strong>{" "}
            for terrorism.
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Report another website
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // ── Landing — Google-style URL entry ─────────────────────────────────────
  if (state.phase === "landing") {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl space-y-8">
            {/* Wordmark */}
            <div className="space-y-1 text-center">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight flex items-center justify-center gap-3">
                <TriangleAlert className="size-10 sm:size-12 shrink-0 text-[#1d70b8]" strokeWidth={2.5} />
                <span className="bg-gradient-to-r from-foreground to-[#1d70b8] bg-clip-text text-transparent">
                  Harm Watch
                </span>
                <Eye className="size-10 sm:size-12 shrink-0 text-[#1d70b8]" strokeWidth={2.5} />
              </h1>
              <p className="text-sm text-muted-foreground leading-6">
                Use Harm Watch to report a website, forum or service you believe
                breaches the{" "}
                <a
                  href="https://www.legislation.gov.uk/ukpga/2023/50"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Online Safety Act 2023
                </a>
                . Reports are securely logged
                and made available to approved organisations. Do not use this
                form to report an emergency — call 999.
              </p>
            </div>

            {/* URL entry */}
            <form onSubmit={handleUrlContinue} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="landing-url" className="sr-only">
                  Website address
                </Label>
                <input
                  id="landing-url"
                  type="url"
                  required
                  autoComplete="url"
                  spellCheck={false}
                  placeholder="example.com"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
                  className={`${INPUT_CLS} h-14 text-lg`}
                  aria-describedby={urlError ? "landing-url-error" : undefined}
                />
                {urlError && (
                  <p id="landing-url-error" className="flex items-center gap-1.5 text-sm font-bold text-destructive" role="alert">
                    <CircleAlert className="size-4 shrink-0" />
                    {urlError}
                  </p>
                )}
                {!urlError && checkStatus === "checking" && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
                    Checking...
                  </p>
                )}
                {!urlError && typeof checkStatus === "object" && checkStatus !== null && checkStatus.count > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-[#1d70b8]">
                    <Info className="size-3.5 shrink-0" />
                    {checkStatus.count === 1
                      ? "1 report already on record for this URL."
                      : `${checkStatus.count} reports already on record for this URL.`}
                  </p>
                )}
              </div>
              <Button type="submit" size="lg" className="w-full text-base h-12 gap-2">
                Continue
                <ArrowRightToLine className="size-5 shrink-0" />
              </Button>
            </form>

            <div className="space-y-1">
            <p className="text-xs text-center text-muted-foreground">
              Before you submit,{" "}
              <Link
                href="/harm-categories"
                className="underline underline-offset-2 hover:text-foreground"
              >
                find out more about the Online Safety Act categories
              </Link>
              .
            </p>
            <p className="text-xs text-center text-muted-foreground">
              If you are reporting a specific crime,{" "}
              <a
                href="https://www.police.uk/pu/contact-the-police/report-a-crime-incident/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                click here
              </a>
              . For fraud, use{" "}
              <a
                href="https://www.actionfraud.police.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                actionfraud.police.uk
              </a>
              .
            </p>
            <p className="text-xs text-center text-muted-foreground">
              The Online Safety Act will not stop all harmful content.{" "}
              <Link href="/support" className="underline underline-offset-2 hover:text-foreground">
                Click here to read more and find support.
              </Link>
            </p>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  // ── Form — categories and details ────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        {/* URL being reported */}
        <div className="mb-8 flex items-start gap-3 text-sm border-b pb-6">
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Reporting
            </p>
            <p className="font-mono text-xs break-all text-muted-foreground">
              {defangUrl(normalisedPreview ?? url)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setState({ phase: "landing" })}
            className="shrink-0 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Change
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10" noValidate>
          {/* Honeypot — visually hidden, must stay empty */}
          <input
            type="text"
            name="company_url"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
            autoComplete="off"
          />

          {/* Categories */}
          <fieldset className="space-y-4">
            <legend className="text-base font-semibold">
              What type of content is this?{" "}
              <span aria-hidden className="text-destructive">*</span>
              <span className="block text-sm font-semibold text-muted-foreground mt-1 leading-6">
                Please note submission does not mean removal, it is for reporting and investigation purposes.
              </span>
              <span className="block text-sm font-normal text-muted-foreground mt-1 leading-6">
                Before you submit,{" "}
                <Link
                  href="/harm-categories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  find out more about the Online Safety Act categories
                </Link>
                .
              </span>
              <span className="block text-sm font-normal text-muted-foreground mt-1 leading-6">
                Select all that apply. For a specific crime,{" "}
                <a
                  href="https://www.police.uk/pu/contact-the-police/report-a-crime-incident/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  click here
                </a>
                . For fraud, use{" "}
                <a
                  href="https://www.actionfraud.police.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  actionfraud.police.uk
                </a>
                .
              </span>
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {categories.map((tag) => (
                <label
                  key={tag.slug}
                  className="flex items-start gap-3 border border-input p-3 text-sm cursor-pointer hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5 rounded-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
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
              <legend className="text-base font-semibold">
                Additional descriptors{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  (optional)
                </span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {descriptors.map((tag) => (
                  <label
                    key={tag.slug}
                    className="inline-flex items-center gap-1.5 border border-input px-3 py-1.5 text-sm cursor-pointer hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary rounded-sm transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedDescriptors.has(tag.slug)}
                      onChange={(e) => handleDescriptorChange(tag.slug, e.target.checked)}
                    />
                    {tag.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="context" className="text-base font-semibold">
              Describe the harm{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <p className="text-sm text-muted-foreground -mt-1">
              Briefly describe what you saw. Do not include personal information
              about yourself or others.
            </p>
            <Textarea
              id="context"
              rows={4}
              maxLength={500}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              aria-describedby="context-count"
              className="rounded-sm"
            />
            <p id="context-count" className="text-xs text-muted-foreground text-right">
              {context.length}/500
            </p>
          </div>

          {/* Suggested tag */}
          <div className="space-y-2">
            <Label htmlFor="suggested_tag" className="text-base font-semibold">
              Suggest a category{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <input
              id="suggested_tag"
              type="text"
              maxLength={40}
              placeholder="e.g. online grooming"
              value={suggestedTag}
              onChange={(e) => setSuggestedTag(e.target.value)}
              className={`${INPUT_CLS} h-10`}
              aria-describedby="suggested-tag-hint"
            />
            <p id="suggested-tag-hint" className="text-sm text-muted-foreground">
              Reviewed before being added to the taxonomy.
            </p>
          </div>

          {/* Reporter email */}
          <div className="space-y-2">
            <Label htmlFor="reporter_email" className="text-base font-semibold">
              Your email address{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <input
              id="reporter_email"
              type="email"
              placeholder="you@example.com"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              className={`${INPUT_CLS} h-10`}
              aria-describedby="email-hint"
            />
            <p id="email-hint" className="text-sm text-muted-foreground">
              Only provide this if you are happy to be contacted about this
              report. It is never shared with approved organisations.
            </p>
          </div>

          {/* Turnstile */}
          <div className="space-y-2">
            <p className="text-base font-semibold">Security check</p>
            <p className="text-sm text-muted-foreground">
              Tick the box below to confirm you are not a bot.
            </p>
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
            />
            {submitError === "Please complete the security check." && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              aria-describedby="consent-hint"
            />
            <span id="consent-hint" className="leading-6">
              I am making this report in good faith and have read the{" "}
              <a
                href="/terms"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
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
            disabled={submitting || selectedCategories.size === 0 || !consent}
            size="lg"
            className="h-12 px-8 text-base"
          >
            {submitting ? "Sending…" : "Submit report"}
          </Button>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}

