import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Support",
  description:
    "The Online Safety Act has changed things, but no system catches everything. If you or someone you know needs support, these are the numbers that matter most.",
  openGraph: {
    title: "Support | Harm Watch",
    description:
      "If you or someone you know needs support, these are the numbers that matter most.",
    url: "https://www.harm.watch/support",
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Helpline({
  name,
  contact,
  note,
  href,
  url,
}: {
  name: string;
  contact?: string;
  note?: string;
  href: string;
  url: string;
}) {
  return (
    <p className="text-sm leading-6">
      <strong>{name}</strong>
      {contact && <> · {contact}</>}
      {note && <> · {note}</>}
      {" · "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-foreground text-muted-foreground"
      >
        {url}
      </a>
    </p>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-10">

          <header className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">No system catches everything</h1>
            <div className="space-y-4 text-base leading-7 text-muted-foreground">
              <p>
                The Online Safety Act has changed things. Tens of millions of age checks now happen that did
                not happen two years ago, and a lot of harmful material is harder to reach than it was.
              </p>
              <p>
                But a check is not a wall. Some of it can be got around, some sites sit outside the rules
                altogether, and the protections were built mainly with children in mind, which leaves
                vulnerable adults with very little.
              </p>
              <p>
                So some of this is still reachable, often by the people we would most want it kept from,
                and often by people who are looking rather than stumbling across it.
              </p>
              <p>
                The one protection that goes wherever a person goes, on any device, at any hour, is what
                they know and who they can turn to. If that is you, or someone you love, the numbers below
                matter more than anything else on this site.
              </p>
            </div>
          </header>

          <div className="border-t pt-8 space-y-1">
            <p className="text-sm font-bold">If someone is in immediate danger, call 999.</p>
          </div>

          <Section title="If you need to talk">
            <Helpline
              name="Samaritans"
              contact="116 123"
              note="free, any time, day or night"
              href="https://www.samaritans.org"
              url="samaritans.org"
            />
            <Helpline
              name="Shout"
              contact="text SHOUT to 85258"
              note="free, 24 hours, if you would rather not speak"
              href="https://giveusashout.org"
              url="giveusashout.org"
            />
            <Helpline
              name="CALM"
              contact="0800 58 58 58"
              note="5pm to midnight, every day"
              href="https://www.thecalmzone.net"
              url="thecalmzone.net"
            />
            <Helpline
              name="Papyrus HOPELINE247"
              contact="0800 068 4141 or text 88247"
              note="for anyone under 35, and for anyone worried about a young person"
              href="https://www.papyrus-uk.org"
              url="papyrus-uk.org"
            />
          </Section>

          <Section title="If you are under 19">
            <Helpline
              name="Childline"
              contact="0800 1111"
              note="free, and it will not show on the phone bill"
              href="https://www.childline.org.uk"
              url="childline.org.uk"
            />
            <Helpline
              name="YoungMinds"
              href="https://www.youngminds.org.uk"
              url="youngminds.org.uk"
            />
          </Section>

          <Section title="Eating disorders">
            <Helpline
              name="Beat"
              contact="0808 801 0677"
              href="https://www.beateatingdisorders.org.uk"
              url="beateatingdisorders.org.uk"
            />
          </Section>

          <Section title="Mental health, more generally">
            <Helpline
              name="Mind"
              href="https://www.mind.org.uk"
              url="mind.org.uk"
            />
          </Section>

          <Section title="If you are worried about a child">
            <Helpline
              name="NSPCC"
              contact="0808 800 5000"
              note="you do not need to be sure before you ring"
              href="https://www.nspcc.org.uk"
              url="nspcc.org.uk"
            />
            <Helpline
              name="Internet Matters"
              note="practical help with conversations, settings and controls"
              href="https://www.internetmatters.org"
              url="internetmatters.org"
            />
          </Section>

          <p className="text-xs text-muted-foreground border-t pt-6">
            Helpline hours and numbers change. If one does not connect, try another, or check the
            charity&rsquo;s own site.
          </p>

        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
