import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const metadata = { title: "Terms of use — The Harm Watch" };

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-10">
          <header className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight mt-4">Terms of Use</h1>
            <p className="text-sm text-muted-foreground">Effective from 1 August 2026. Version 1.0.</p>
          </header>

          <p className="text-base leading-7">
            These terms govern your use of www.harm.watch and everything connected to it, including the public
            reporting form, the organisation portal and the API. By using the service you accept them. If you do
            not, please do not use it.
          </p>
          <p className="text-base leading-7">
            The service is operated by [LEGAL ENTITY], registered in England and Wales, company number [COMPANY
            NUMBER], registered office [REGISTERED ADDRESS]. In these terms, &ldquo;we&rdquo; and &ldquo;us&rdquo;
            mean that company, and &ldquo;you&rdquo; means whoever is using the service.
          </p>

          <Section num="1" title="What The Harm Watch is">
            <p>
              The Harm Watch collects reports from members of the public about websites that appear to be
              unlawful, harmful, or in breach of the Online Safety Act 2023, and makes those reports available
              in a structured form to organisations we have approved.
            </p>
            <p>
              We are an independent private organisation. We are not a regulator, not a public body, not a law
              enforcement agency, and not connected to Ofcom, the Internet Watch Foundation or any police force.
            </p>
          </Section>

          <Section num="2" title="What The Harm Watch is not">
            <p>Please read this section properly, because it is the part people most often assume the opposite of.</p>
            <ul className="list-disc list-inside space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">We do not verify reports.</strong> A record in our database
                means somebody told us about a website. It does not mean the website is unlawful, harmful, or in
                breach of anything. We do not investigate, we do not adjudicate, and we do not make findings.
              </li>
              <li>
                <strong className="text-foreground">We cannot remove anything.</strong> We have no technical or
                legal power to take down a website, block it, or compel anyone else to. We do not contact hosting
                providers or registrars on your behalf.
              </li>
              <li>
                <strong className="text-foreground">We do not act on your report ourselves.</strong> Submitting a
                report does not create any obligation on us to do anything with it, to review it within any
                timescale, or to tell you what happened next.
              </li>
              <li>
                <strong className="text-foreground">We are not an emergency service.</strong> If somebody is in
                immediate danger, call 999. If a crime has been committed, report it to the police. If you have
                lost money to fraud, report it to Action Fraud. Reporting to us is not reporting to the
                authorities, and it does not start any official process.
              </li>
              <li>
                <strong className="text-foreground">We do not host or store the reported content.</strong> We
                record web addresses and classifications only. We do not copy, mirror, cache or archive anything
                from the sites reported to us.
              </li>
            </ul>
          </Section>

          <Section num="3" title="Reporting a website">
            <p>You may use the reporting form if you are 13 or over.</p>
            <p>
              When you submit a report you confirm that you are acting in good faith and genuinely believe the
              site is harmful or unlawful, that the information you have given is accurate as far as you know,
              and that you are not submitting it to harass, damage or take revenge on anyone.
            </p>
            <p>
              You must not use the form to submit reports about sites you know to be lawful and harmless, to run
              automated or bulk submissions, to launch a coordinated campaign against a competitor, a former
              partner, or anyone you have a grievance with, or to include personal information about yourself or
              any other person in the free text field.
            </p>
            <p>
              Malicious reporting is a serious matter. It can expose the reporter to civil liability, and
              depending on the circumstances it can amount to a criminal offence. We log the technical origin of
              every report in hashed form, and we will cooperate with law enforcement where the form is being
              abused.
            </p>
            <p>
              <strong>Two categories we will not accept.</strong> Reports of child sexual abuse material must go
              to the Internet Watch Foundation, and reports of terrorist content must go to the government&apos;s
              terrorism reporting route. If you select either category we will stop your submission and send you
              to the right place. We do this because a stored, searchable, exportable list of those addresses
              would itself cause harm.
            </p>
          </Section>

          <Section num="4" title="Rights in what you submit">
            <p>
              You keep whatever rights you have in the text you write. By submitting a report you grant us a
              worldwide, royalty free, perpetual, irrevocable licence to store it, classify it, aggregate it
              with other reports, and share it with approved organisations in accordance with these terms and our
              Privacy Notice.
            </p>
            <p>
              The licence is perpetual because records are never deleted from our dataset. This is the point of
              the service, and it is set out plainly here so nobody is surprised by it later.
            </p>
          </Section>

          <Section num="5" title="Organisation access">
            <p>
              <strong>Applying.</strong> Any organisation may apply for access. We approve applications at our
              sole discretion, and we may decline without giving a reason.
            </p>
            <p>
              <strong>Accounts.</strong> Your organisation is responsible for everything done under its accounts.
              Keep credentials secure, use a unique password, enable two factor authentication, tell us
              immediately at{" "}
              <a href="mailto:access@harm.watch" className="underline underline-offset-4 hover:text-foreground">
                access@harm.watch
              </a>{" "}
              if you suspect a compromise, and tell us promptly when a colleague leaves so we can deactivate
              them. Accounts are for named individuals and must not be shared.
            </p>
            <p>
              <strong>Permitted use.</strong> You may use the data for research and analysis, for regulatory or
              enforcement work within your remit, for protecting your own users or networks, for supporting
              people who have been harmed online, and for evidencing systemic problems to a regulator, including
              through the Online Safety Act&apos;s super complaints route.
            </p>
            <p>
              <strong>Prohibited use.</strong> You must not republish the dataset or any substantial part of it
              publicly, sell, licence or otherwise commercialise it, pass it to a third party without our written
              agreement, use it as a blocklist that produces automatic consequences for a site without your own
              assessment, present any record as a finding that a site is unlawful, scrape the portal or attempt
              to circumvent rate limits, or use it to harass, threaten or defame any person or organisation.
            </p>
            <p>
              <strong>Accuracy.</strong> You accept that records are unverified public allegations and that you
              are responsible for your own verification before acting.
            </p>
            <p>
              <strong>Suspension.</strong> We may suspend or revoke access at any time, with or without notice,
              if these terms are breached, if the basis on which access was granted no longer holds, or if we
              consider it necessary to protect the service or the people it exists to help.
            </p>
          </Section>

          <Section num="6" title="API access">
            <p>
              API access is granted separately from portal access and only to organisations we have specifically
              enabled for it.
            </p>
            <p>
              API keys are confidential. Do not commit them to source control, embed them in client side code,
              or share them between organisations. You are responsible for all activity under your keys. Tell us
              straight away if one is exposed and we will revoke and reissue.
            </p>
            <p>
              The API is rate limited, and the current limits are published in the{" "}
              <Link href="/docs/api" className="underline underline-offset-4 hover:text-foreground">
                API documentation
              </Link>. Do not attempt to work around them by rotating keys or distributing requests.
            </p>
            <p>
              Data retrieved through the API is subject to exactly the same permitted and prohibited uses as data
              in the portal.
            </p>
          </Section>

          <Section num="7" title="If your website has been reported">
            <p>
              A record about your site does not mean we have found against you. It means someone reported it.
            </p>
            <p>
              If you believe a report is inaccurate, malicious or mistaken, write to{" "}
              <a href="mailto:listings@harm.watch" className="underline underline-offset-4 hover:text-foreground">
                listings@harm.watch
              </a>{" "}
              from an address connected to the domain, identifying the site and explaining the position. We will
              review it within a reasonable period and, where the report does not stand up, mark the record so
              it is excluded from everything we share.
            </p>
            <p>We do not delete records, and we do not disclose who reported you.</p>
          </Section>

          <Section num="8" title="Availability">
            <p>
              We provide the service as it is and as it is available. We do not promise it will be uninterrupted,
              error free, or complete. We may change, suspend or withdraw any part of it, and we may stop
              operating it entirely, without liability to you.
            </p>
          </Section>

          <Section num="9" title="Liability">
            <p>
              Nothing in these terms limits our liability for death or personal injury caused by our negligence,
              for fraud or fraudulent misrepresentation, or for anything else that cannot lawfully be limited.
            </p>
            <p>
              Subject to that, we are not liable for any loss arising from your use of or reliance on the service
              or its data, including loss of profit, business, goodwill or reputation, or any indirect or
              consequential loss. In particular we are not liable for anything that follows from a report being
              inaccurate, incomplete, out of date or maliciously made, from any action or inaction taken on the
              strength of our data, or from a harmful website not appearing in our data at all.
            </p>
            <p>
              Where liability cannot be excluded, our total liability to any organisation is capped at £100 or
              the amount that organisation has paid us in the preceding twelve months, whichever is higher.
            </p>
            <p>
              You agree to indemnify us against claims arising from your breach of these terms, from reports you
              submit in bad faith, or from your use of the data in a way these terms prohibit.
            </p>
          </Section>

          <Section num="10" title="Intellectual property">
            <p>
              The site, its design, its code, its harm taxonomy and the name The Harm Watch belong to us. Access
              to the service grants you no rights in any of it beyond the permitted uses set out above.
            </p>
          </Section>

          <Section num="11" title="Changes">
            <p>
              We may update these terms. The version number and effective date at the top will change, and
              material changes will be notified to organisation account holders by email. Continuing to use the
              service after a change means you accept the revised terms.
            </p>
          </Section>

          <Section num="12" title="General">
            <p>
              If any provision is found unenforceable, the rest continues to apply. A delay in enforcing a term
              is not a waiver of it. These terms are between you and us, and nobody else may enforce them under
              the Contracts (Rights of Third Parties) Act 1999.
            </p>
            <p>
              These terms and any dispute arising from them are governed by the law of England and Wales, and
              the courts of England and Wales have exclusive jurisdiction.
            </p>
          </Section>

          <Section num="13" title="Contact">
            <ul className="space-y-1.5 text-sm">
              <li><a href="mailto:hello@harm.watch" className="underline underline-offset-4 hover:text-foreground">hello@harm.watch</a> — general enquiries</li>
              <li><a href="mailto:access@harm.watch" className="underline underline-offset-4 hover:text-foreground">access@harm.watch</a> — organisation access</li>
              <li><a href="mailto:privacy@harm.watch" className="underline underline-offset-4 hover:text-foreground">privacy@harm.watch</a> — data protection</li>
              <li><a href="mailto:listings@harm.watch" className="underline underline-offset-4 hover:text-foreground">listings@harm.watch</a> — if your site appears in our data</li>
            </ul>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">{num}. {title}</h2>
      <div className="space-y-4 text-base leading-7">{children}</div>
    </section>
  );
}
