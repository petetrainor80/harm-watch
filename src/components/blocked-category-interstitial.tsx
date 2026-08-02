"use client";

interface Props {
  redirectUrl: string;
  redirectCopy: string;
  onBack: () => void;
}

// Replaces the form when a blocked category is selected (csam, terrorism).
// See PRD section 5 for the routing requirement.
export function BlockedCategoryInterstitial({ redirectUrl, redirectCopy, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-5 text-sm leading-7 text-foreground">
        {redirectCopy}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to reporting page
        </a>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Back
        </button>
      </div>
    </div>
  );
}
