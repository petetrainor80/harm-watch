import Link from "next/link";

export const metadata = { title: "Privacy notice — The Harm Watch" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-4">Privacy notice</h1>
          <p className="text-sm text-muted-foreground">Last updated: August 2026</p>
        </header>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Who we are</h2>
          <p>
            The Harm Watch is the data controller for personal data collected through this service.
            {/* PRD-Q: Named data controller and ICO registration number to be added before public launch. */}
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">What we collect and why</h2>
          <p>When you submit a report we collect:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">The URL you report</strong> — to create and maintain the dataset.
              Lawful basis: legitimate interests in supporting the enforcement of the Online Safety Act 2023.
            </li>
            <li>
              <strong className="text-foreground">Your email address (optional)</strong> — only if you choose to provide it.
              We never use it for marketing. Lawful basis: your consent.
            </li>
            <li>
              <strong className="text-foreground">A hash of your IP address</strong> — to prevent automated abuse and rate-limit submissions.
              We hash the raw IP immediately and never store it in plain text.
              Lawful basis: legitimate interests in maintaining the integrity of the service.
            </li>
            <li>
              <strong className="text-foreground">Country code</strong> — derived from your network connection to understand where reports originate.
            </li>
            <li>
              <strong className="text-foreground">Any context you provide</strong> — optional free text describing the harm.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">What we share</h2>
          <p>
            Approved organisations receive a structured feed containing the URL, harm categories,
            report count, and dates. They <strong>never</strong> receive your email address,
            the text of your report, your IP hash, or any other information that could identify you.
          </p>
          <p>
            We do not sell personal data. We do not share it with advertisers.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">How long we keep your data</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Report metadata (IP hash, country code, email if provided) — 24 months from submission.</li>
            <li>The URL and harm categories themselves — retained indefinitely as part of the core dataset.</li>
          </ul>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Your rights</h2>
          <p>
            Under UK GDPR you have the right to access, correct, or erase personal data we hold about you.
            If you provided your email address with a report and would like it removed, contact us at the
            address below and we will action your request within 30 days.
          </p>
          <p>
            You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO)
            at <span className="font-medium">ico.org.uk</span>.
          </p>
          <p className="text-muted-foreground">
            {/* PRD-Q: Contact email address for data subject requests to be added before launch. */}
            Contact: [contact email to be confirmed before launch]
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Cookies and tracking</h2>
          <p>
            We do not use advertising cookies or third-party tracking. Cloudflare Turnstile is used
            for bot protection on the submission form. See{" "}
            <span className="font-medium">cloudflare.com/privacypolicy</span> for Cloudflare&apos;s privacy policy.
          </p>
        </section>

        <footer className="border-t pt-6 text-sm text-muted-foreground flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of use</Link>
          <Link href="/" className="hover:text-foreground">Report a website</Link>
        </footer>
      </div>
    </main>
  );
}
