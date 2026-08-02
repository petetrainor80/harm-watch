import Link from "next/link";

export const metadata = { title: "Terms of use — The Harm Watch" };

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-10">
        <header className="space-y-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-4">Terms of use</h1>
          <p className="text-sm text-muted-foreground">Last updated: August 2026</p>
        </header>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">What this service is</h2>
          <p>
            The Harm Watch is a public reporting tool that allows members of the public to submit URLs
            of websites they believe may breach the Online Safety Act 2023 or otherwise be unlawful
            or inappropriate. It is operated by The Harm Watch.
          </p>
          <p>
            Use of this service is free and does not require you to create an account.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Acceptable use</h2>
          <p>You agree that when using this service you will:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Submit reports in good faith and to the best of your knowledge.</li>
            <li>Not submit reports for the purpose of harassing, targeting, or defaming a person or organisation.</li>
            <li>Not attempt to overload, disrupt, or probe the service.</li>
            <li>Not submit reports containing personal data about individuals other than what is strictly relevant to the harm being reported.</li>
          </ul>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">What we do with reports</h2>
          <p>
            Reports are reviewed and, where appropriate, passed to approved organisations in a structured
            format. A report constitutes an allegation, not a finding. We do not confirm, adjudicate,
            or characterise any report as proven.
          </p>
          <p>
            We reserve the right to reject, remove, or suppress any report that in our reasonable opinion
            was submitted in bad faith, is clearly erroneous, or relates to a site not within scope.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Limitation of liability</h2>
          <p>
            The Harm Watch is provided as-is. We do not guarantee the accuracy, completeness, or timeliness
            of the reports we receive. We accept no liability for any action taken or not taken by any
            person or organisation in reliance on information obtained through this service.
          </p>
          <p>
            We are not a law enforcement body and have no power to compel any action by any party.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Changes to these terms</h2>
          <p>
            We may update these terms at any time. Continued use of the service after a change constitutes
            acceptance of the new terms.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales.
          </p>
        </section>

        <footer className="border-t pt-6 text-sm text-muted-foreground flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy notice</Link>
          <Link href="/" className="hover:text-foreground">Report a website</Link>
        </footer>
      </div>
    </main>
  );
}
