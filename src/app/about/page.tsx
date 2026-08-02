import Link from "next/link";

export const metadata = { title: "About — The Harm Watch" };

export default function AboutPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-4">About The Harm Watch</h1>
        </header>

        <section className="space-y-4 text-base leading-7">
          <p>
            The Harm Watch is a public reporting service for websites that may breach the Online Safety Act 2023
            or that are otherwise unlawful or clearly inappropriate.
          </p>
          <p>
            Anyone can submit a URL in under thirty seconds. You do not need an account. Your report is passed,
            alongside others, to approved organisations — charities, regulators, internet service providers and
            legal teams — who can take action.
          </p>
          <p>
            We are a signal, not a verdict. A submission is an allegation by a member of the public,
            nothing more. We never describe a site as confirmed harmful, proven illegal, or anything beyond
            reported.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">What we do not do</h2>
          <ul className="list-disc list-inside space-y-2 text-base leading-7 text-muted-foreground">
            <li>We do not host, mirror, screenshot, or visit the sites you report.</li>
            <li>We do not publish the list publicly. Access is granted to approved organisations only.</li>
            <li>We do not pass your identity to anyone. Reporter information is never shared with approved organisations.</li>
            <li>We do not act as a replacement for the police, the IWF, or Ofcom. We complement those channels.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Who receives the data</h2>
          <p className="text-base leading-7">
            Approved organisations — charities, government bodies, regulators, ISPs and legal teams — receive
            a structured feed of reported URLs, the categories of harm alleged, and a report count. They never
            receive the text of individual reports, email addresses, or any other reporter information.
          </p>
          <p className="text-base leading-7">
            Organisations must apply for access and are reviewed before approval. Access can be revoked at any time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Other reporting routes</h2>
          <p className="text-base leading-7 text-muted-foreground">
            The Harm Watch covers website-level reporting only. For other situations:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Child sexual abuse material — <span className="font-medium text-foreground">iwf.org.uk/report</span></li>
            <li>Terrorist content — <span className="font-medium text-foreground">gov.uk/report-terrorism</span></li>
            <li>A specific criminal offence — <span className="font-medium text-foreground">report.police.uk</span></li>
            <li>Fraud or scams — <span className="font-medium text-foreground">actionfraud.police.uk</span></li>
            <li>Immediate risk to life — <span className="font-medium text-foreground">call 999</span></li>
          </ul>
        </section>

        <footer className="border-t pt-6 text-sm text-muted-foreground flex flex-wrap gap-4">
          <Link href="/terms" className="hover:text-foreground">Terms of use</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy notice</Link>
          <Link href="/request-access" className="hover:text-foreground">Request access</Link>
        </footer>
      </div>
    </main>
  );
}
