import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const metadata = { title: "Privacy notice — The Harm Watch" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-10">
          <header className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">Privacy Notice</h1>
            <p className="text-sm text-muted-foreground">Effective from 1 August 2026. Version 1.0.</p>
          </header>

          <p className="text-base leading-7">
            This notice explains what personal data The Harm Watch collects, why we collect it, how long we keep
            it and what rights you have. We have tried to write it in plain English rather than legal boilerplate,
            because a privacy notice nobody reads protects nobody.
          </p>

          <Section title="Who we are">
            <p>
              The Harm Watch is operated by [LEGAL ENTITY], registered in England and Wales, company number
              [COMPANY NUMBER], registered office [REGISTERED ADDRESS]. We are the data controller for the
              personal data described here, and we are registered with the Information Commissioner&apos;s Office
              under registration number [ICO NUMBER].
            </p>
            <p>
              Data protection enquiries:{" "}
              <a href="mailto:privacy@harm.watch" className="underline underline-offset-4 hover:text-foreground">
                privacy@harm.watch
              </a>
            </p>
          </Section>

          <Section title="The short version">
            <p>
              If you report a website, you can do so anonymously. We do not ask for your name, and we do not need
              it. The only personal data we collect from an anonymous report is an irreversibly hashed version of
              your IP address, used to stop the form being flooded by bots, and a two letter country code.
            </p>
            <p>
              If you choose to give us an email address so we can follow up, we use it for that and nothing else.
              It is never passed to the organisations who receive our data.
            </p>
            <p>
              If you register an organisation for access, we collect ordinary business contact details in order
              to run the account.
            </p>
            <p>We never publish reports, and we never sell data to anyone.</p>
          </Section>

          <Section title="What we collect when you report a website">
            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">The report itself.</strong> The web address you submit, the
                harm categories and descriptors you select, any tag you suggest, and any free text you add in the
                context field. This is the core of what we do and it is shared with approved organisations, so
                please do not put personal information about yourself or anyone else into the free text field.
                There is a warning on the form to that effect. If you do include personal details, we may remove
                them.
              </li>
              <li>
                <strong className="text-foreground">Your email address, only if you provide it.</strong> This
                field is optional and clearly labelled. We use it solely to contact you about your report. It is
                never shared with the organisations who access our data, never used for marketing, and never
                appears in any export or API response.
              </li>
              <li>
                <strong className="text-foreground">A hashed IP address.</strong> We take the IP address your
                report arrives from and run it through a one way keyed hash before storing it. We do not store
                the address itself and we cannot recover it from the hash. This is used only to enforce rate
                limits and detect abuse of the form.
              </li>
              <li>
                <strong className="text-foreground">A two letter country code and a hashed browser signature.</strong>{" "}
                Used to spot coordinated abuse and to understand roughly where reports come from. Neither
                identifies you.
              </li>
              <li>
                <strong className="text-foreground">Bot protection data.</strong> We use Cloudflare Turnstile to
                distinguish people from automated scripts. Cloudflare processes technical signals from your
                browser as part of that check. See the Cloudflare privacy policy for detail on their processing.
              </li>
            </ul>
          </Section>

          <Section title="What we do not collect when you report">
            <p>
              We do not use analytics or advertising cookies, we do not fingerprint your device beyond the bot
              check described above, we do not track you across other websites, and we do not require or offer
              an account for reporting.
            </p>
            <p>
              Crucially, we do not visit, fetch, crawl, screenshot or archive the website you report. Your report
              tells us an address, and we store the address. Nothing goes out from us to the site in question.
            </p>
          </Section>

          <Section title="Reports we deliberately refuse">
            <p>
              If you select child sexual abuse material or terrorist content as a category, we stop the submission
              and direct you to the Internet Watch Foundation or the government&apos;s terrorism reporting route
              instead. In that situation we store nothing at all. No address, no hashed IP, no context, no record
              that you were the one who tried. We increment an anonymous counter recording that a routing event
              happened in that category, and that is the entirety of it.
            </p>
          </Section>

          <Section title="What we collect when your organisation registers for access">
            <p>
              Organisation name, website, charity or company registration number, the contact&apos;s full name,
              work email address and job title, and the written justification for access. Once approved we also
              hold account authentication data managed by our authentication provider, login timestamps, and a
              record of actions taken in the admin or organisation portal.
            </p>
            <p>
              This is ordinary business contact data, processed to operate a service your organisation has asked
              to use.
            </p>
          </Section>

          <Section title="Why we are allowed to process this, in legal terms">
            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">Legitimate interests</strong>, for operating the reporting
                service, deduplicating and classifying reports, protecting the service from abuse, and sharing
                submission records with approved organisations. We have completed a Legitimate Interests Assessment
                and it is available on request.
              </li>
              <li>
                <strong className="text-foreground">Consent</strong>, for the optional reporter email address.
                You give it freely, you do not have to, and you can withdraw it at any time.
              </li>
              <li>
                <strong className="text-foreground">Contract</strong>, for administering organisation accounts
                and access.
              </li>
              <li>
                <strong className="text-foreground">Legal obligation</strong>, where we are required to retain
                or disclose information by law.
              </li>
            </ul>
          </Section>

          <Section title="Who we share it with">
            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">Approved organisations.</strong> They receive the submission
                record: the web address, its domain, its status, its categories and descriptors, the number of
                times it has been reported, and the relevant dates. They do not receive reporter email addresses,
                hashed IP addresses, country codes, the free text context field, or our internal notes.
              </li>
              <li>
                <strong className="text-foreground">Our service providers</strong>, who process data on our
                behalf under contract. These currently are Supabase (database and authentication, hosted in
                [REGION]), Vercel (application hosting), Cloudflare (bot protection), Resend (transactional
                email), and Sentry (error monitoring). Each is bound to process data only on our instructions.
              </li>
              <li>
                <strong className="text-foreground">Law enforcement and regulators</strong>, where we are legally
                required to disclose, or where disclosure is necessary to prevent serious harm.
              </li>
            </ul>
            <p>We do not sell data, we do not share it for advertising, and we do not pass it to anyone else.</p>
          </Section>

          <Section title="International transfers">
            <p>
              Some of our providers process data outside the UK. Where that happens we rely on UK adequacy
              regulations or the International Data Transfer Addendum to the European Commission&apos;s standard
              contractual clauses. Details available on request.
            </p>
          </Section>

          <Section title="How long we keep things">
            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">Submission records</strong> are kept indefinitely. The
                historical record of what was reported, when, and how often is the substance of the service.
              </li>
              <li>
                <strong className="text-foreground">Report level metadata</strong> — hashed IP addresses, country
                codes, hashed browser signatures and the free text context field — is deleted 24 months after the
                report is made.
              </li>
              <li>
                <strong className="text-foreground">Reporter email addresses</strong> are deleted 24 months after
                the report, or immediately on request.
              </li>
              <li>
                <strong className="text-foreground">Organisation account data</strong> is kept for the life of the
                account and for 24 months after it closes.
              </li>
              <li>
                <strong className="text-foreground">Audit logs</strong> of privileged actions are kept for six
                years.
              </li>
            </ul>
          </Section>

          <Section title="Your rights">
            <p>
              Under UK data protection law you have the right to ask for a copy of the personal data we hold about
              you, to have inaccurate data corrected, to have data erased in certain circumstances, to restrict or
              object to our processing, to receive your data in a portable format, and to withdraw consent where
              consent is the basis we rely on.
            </p>
            <p>
              There is a practical limit worth being honest about. If you reported anonymously, we hold nothing
              that identifies you, and we cannot connect you to a report in order to action a request. The hashed
              IP is one way by design and we cannot reverse it. That is a deliberate privacy protection rather
              than an evasion, but it does mean anonymity and subject access pull in opposite directions.
            </p>
            <p>
              If you gave us an email address, we can find your reports from that address and act on any of the
              rights above.
            </p>
            <p>
              To exercise any right, write to{" "}
              <a href="mailto:privacy@harm.watch" className="underline underline-offset-4 hover:text-foreground">
                privacy@harm.watch
              </a>. We respond within one month.
            </p>
            <p>
              If you are unhappy with how we have handled your data you can complain to the Information
              Commissioner&apos;s Office at{" "}
              <span className="font-medium">ico.org.uk</span>, by phone on 0303 123 1113, or in writing at
              Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF.
            </p>
          </Section>

          <Section title="If your website appears in our data">
            <p>
              The Harm Watch holds reports about websites. Where a website is operated by an individual rather
              than a company, information about that site may constitute personal data relating to that individual.
            </p>
            <p>
              If you believe your site has been reported wrongly, write to{" "}
              <a href="mailto:listings@harm.watch" className="underline underline-offset-4 hover:text-foreground">
                listings@harm.watch
              </a>{" "}
              with the address and your explanation. We will review it, and where a report is inaccurate,
              malicious or mistaken we will mark the record accordingly. We do not delete records outright, but
              a record marked as rejected is excluded from everything we share.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              We use a single essential cookie to maintain your session if you log in, and Cloudflare Turnstile
              may set a short lived cookie as part of the bot check. We use no analytics, advertising or tracking
              cookies, which is why you are not being asked to dismiss a banner.
            </p>
          </Section>

          <Section title="Automated decision making">
            <p>
              We do not make automated decisions with legal or similarly significant effects. Reports are
              classified by the person making them and reviewed by a human.
            </p>
          </Section>

          <Section title="Changes to this notice">
            <p>
              We will update this notice as the service develops. Material changes will be flagged on the site
              with the version number and effective date above.
            </p>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="space-y-4 text-base leading-7">{children}</div>
    </section>
  );
}
