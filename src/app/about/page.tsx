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
          <h2 className="text-lg font-medium">Why this exists</h2>
          <p>
            If you find a website today that is scamming people, hosting intimate images shared without consent,
            pushing self harm content at teenagers, or serving pornography to anyone who clicks past a birthday
            box, there is no obvious place to say so.
          </p>
          <p>
            You can report it to the platform hosting it, if there is one and if you can find the form. You can
            report it to Ofcom, who regulate services rather than chase individual sites. You can report it to
            Action Fraud, or the police, or the hosting provider, or the registrar, and each of those routes
            asks for something slightly different and tells you nothing afterwards. Most people, quite reasonably,
            give up somewhere in the middle and close the tab.
          </p>
          <p>
            Meanwhile the organisations who could actually do something — the charities monitoring a particular
            harm, the regulators building a case, the internet service providers, the legal teams acting for
            people who have been hurt — are all working from their own partial view. Nobody is short of concern.
            Everybody is short of signal.
          </p>
          <p>
            The Harm Watch is an attempt to close that gap with something deliberately small. One page where
            anyone can report a website in under a minute, and a structured, private feed of those reports for
            the organisations equipped to act on them.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">What it does</h2>
          <p>
            Someone finds a harmful site. They paste the URL, pick a category or two that describes the harm,
            and submit. That takes about thirty seconds and requires no account, no email address and no
            explanation of who they are.
          </p>
          <p>
            Behind that, we normalise and deduplicate the URL, so the tenth person to report the same site
            strengthens an existing record rather than creating a new one. Reports are categorised against a
            taxonomy shaped around the harms the Online Safety Act 2023 is concerned with, and against the
            priorities Ofcom has set out for its own work, which currently centre on protecting children,
            countering terrorist and hateful content, and the safety of women and girls online.
          </p>
          <p>
            Approved organisations can then browse, filter and export that data, or pull it through an API if
            their work needs a live feed. Access is granted rather than open, and we vet who gets it.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">What it deliberately does not do</h2>
          <p>
            We are a signal, not a verdict. A submission is an allegation made by a member of the public. It is
            not a finding, not a legal determination and not evidence that a site has broken any law. Everything
            in the product, from the wording on the form to the field names in the database, is built to hold
            that line.
          </p>
          <p>
            We do not host, mirror, screenshot, cache or crawl the sites people report. We store the address and
            the classification, nothing else. Building a searchable archive of harmful material in order to fight
            harmful material would be an act of remarkable self defeat.
          </p>
          <p>
            We are not a takedown service. We have no power to remove anything, and we do not contact hosts or
            registrars on your behalf. What we can do is make sure the people who do have that power can see
            the pattern.
          </p>
          <p>
            We are not the police, not Ofcom, and not a replacement for either. If someone is in immediate
            danger, that is a 999 call, not a web form.
          </p>
          <p>
            And two categories never enter our system at all. Reports of child sexual abuse material go to the
            Internet Watch Foundation, and reports of terrorist content go to the government&apos;s dedicated
            reporting route. We route you there rather than accepting the report, and we do not record the URL.
            A queryable, exportable list of those addresses would be worse than useless — it would be dangerous.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Who it is for</h2>
          <p>
            The public side is for anyone. You do not need to know which law applies, or whether the site is
            technically in scope of anything. If it looks wrong, report it and let the classification happen
            behind the scenes.
          </p>
          <p>
            The access side is for organisations with a legitimate reason to see the data. In practice that
            means charities and civil society organisations working on a specific harm, public bodies and
            regulators, internet service providers and infrastructure companies, and legal practitioners acting
            for people who have been harmed online. The Online Safety Act&apos;s super complaints route gives
            eligible bodies a formal way to raise systemic problems with Ofcom, and evidence of pattern is
            exactly what that kind of complaint needs.
          </p>
          <p>
            Access is reviewed individually. We ask what you intend to do with the data, and we say no when
            the answer is unconvincing.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">How we handle the data</h2>
          <p>
            Reporters are anonymous by default. We do not ask who you are, and if you choose to leave an email
            address so we can follow up, that address is never shared with the organisations receiving the feed.
          </p>
          <p>
            The list is not public. That is a considered decision rather than a technical limitation. Publishing
            unverified public allegations against named websites invites brigading, defamation and the
            weaponisation of the form itself, and it is far easier to open something up later than to unpick the
            damage from having opened it too early.
          </p>
          <p>
            Records are never deleted. When a site comes down, it is marked as removed and stays in the list,
            because the history of what was up, for how long, and how often it was reported is often the most
            useful thing in the dataset.
          </p>
          <p>
            The full detail is in our{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Notice</Link>,
            and the rules of use are in our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms of Use</Link>.
          </p>
        </section>

        <section className="space-y-4 text-base leading-7">
          <h2 className="text-lg font-medium">Who is behind it</h2>
          <p>
            The Harm Watch is operated by [LEGAL ENTITY], based in the United Kingdom. It is independent, and
            it is not affiliated with Ofcom, the Internet Watch Foundation, any police force, or any of the
            organisations who hold access to the data.
          </p>
          <p>
            It exists because the reporting infrastructure for online harm was built platform by platform, harm
            by harm, over twenty odd years, and nobody ever stood back and asked what it looks like from the
            point of view of the person who just wants to tell someone. This is an attempt at that view.
          </p>
        </section>

        <section className="space-y-3 text-base leading-7">
          <h2 className="text-lg font-medium">Get in touch</h2>
          <ul className="space-y-1.5 text-sm">
            <li>General enquiries: <a href="mailto:hello@harm.watch" className="underline underline-offset-4 hover:text-foreground">hello@harm.watch</a></li>
            <li>Organisation access: <a href="mailto:access@harm.watch" className="underline underline-offset-4 hover:text-foreground">access@harm.watch</a></li>
            <li>Privacy and data protection: <a href="mailto:privacy@harm.watch" className="underline underline-offset-4 hover:text-foreground">privacy@harm.watch</a></li>
            <li>If your website appears in our data and you believe it should not: <a href="mailto:listings@harm.watch" className="underline underline-offset-4 hover:text-foreground">listings@harm.watch</a></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Other reporting routes</h2>
          <div className="border rounded-md overflow-hidden text-sm">
            {[
              ["Child sexual abuse imagery", "iwf.org.uk", "https://www.iwf.org.uk"],
              ["Concerns about a child's safety", "ceop.police.uk", "https://www.ceop.police.uk"],
              ["Terrorist content", "gov.uk/report-terrorism", "https://www.gov.uk/report-terrorism"],
              ["Fraud you have experienced", "actionfraud.police.uk", "https://www.actionfraud.police.uk"],
              ["A crime that is not an emergency", "report.police.uk", "https://www.report.police.uk"],
              ["A crime in progress or immediate danger", "Call 999", null],
            ].map(([situation, route, href]) => (
              <div key={situation} className="flex justify-between gap-4 px-4 py-3 border-b last:border-b-0">
                <span className="text-muted-foreground">{situation}</span>
                {href ? (
                  <span className="font-medium shrink-0">{route}</span>
                ) : (
                  <span className="font-medium shrink-0 text-destructive">{route}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            External links are listed as plain text — copy and paste into your browser rather than clicking.
          </p>
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
