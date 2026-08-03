import { SiteHeader, SiteFooter } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Harm Categories & Ofcom Taxonomy",
  description:
    "The twelve public reporting categories used by Harm Watch, mapped to Ofcom's seventeen kinds of priority illegal harm under the Online Safety Act 2023, plus content harmful to children.",
  keywords: [
    "Ofcom harm taxonomy",
    "Online Safety Act categories",
    "priority illegal harm",
    "online harm categories UK",
    "CSEA reporting",
    "online safety categories",
  ],
  openGraph: {
    title: "Harm Categories & Ofcom Taxonomy | Harm Watch",
    description:
      "The twelve public reporting categories used by Harm Watch, mapped to Ofcom's seventeen kinds of priority illegal harm under the Online Safety Act 2023.",
    url: "https://www.harm.watch/harm-categories",
  },
};

// ── Data ─────────────────────────────────────────────────────────────────────

const publicCategories = [
  {
    slug: "scam",
    label: "A scam, fake shop or fraud",
    helper: "Fake retailers, investment or crypto scams, phishing, anything designed to take money dishonestly.",
    maps: ["fraud", "proceeds-of-crime"],
    blocked: false,
  },
  {
    slug: "intimate-images",
    label: "Intimate images shared without consent",
    helper: "Including nudify tools, sexual deepfakes and threats to share images.",
    maps: ["intimate-image-abuse"],
    blocked: false,
  },
  {
    slug: "abuse-harassment",
    label: "Abuse, harassment or threats",
    helper: "Content targeting a person with threats, stalking, pile-ons or exposure of their private details.",
    maps: ["harassment", "coercive-control"],
    blocked: false,
  },
  {
    slug: "hate",
    label: "Hate towards a group of people",
    helper: "Attacks on people because of race, religion, disability, sexuality or gender identity.",
    maps: ["hate"],
    blocked: false,
  },
  {
    slug: "suicide-self-harm",
    label: "Suicide or self-harm content",
    helper: "Content encouraging or instructing people to harm themselves.",
    maps: ["suicide-self-harm"],
    blocked: false,
  },
  {
    slug: "eating-disorder",
    label: "Eating disorder content",
    helper: "Content promoting starvation, purging or disordered eating.",
    maps: [],
    childHarm: ["ppc-eating-disorder"],
    blocked: false,
  },
  {
    slug: "porn-no-age-check",
    label: "Pornography with no age check",
    helper: "Adult content anyone can reach without proving their age.",
    maps: ["extreme-pornography"],
    childHarm: ["ppc-pornography"],
    blocked: false,
  },
  {
    slug: "child-harm",
    label: "Harmful to children in another way",
    helper: "Bullying, violent content, dangerous challenges, anything aimed at children that should not be.",
    maps: [],
    childHarm: ["pc-bullying", "pc-violence", "pc-dangerous-stunts", "pc-harmful-substances", "pc-abuse-hate"],
    blocked: false,
  },
  {
    slug: "illegal-goods",
    label: "Drugs, weapons or stolen goods",
    helper: "Sites selling controlled drugs, weapons, stolen items or laundering money.",
    maps: ["drugs", "weapons", "proceeds-of-crime"],
    blocked: false,
  },
  {
    slug: "exploitation",
    label: "Exploitation or trafficking",
    helper: "Content advertising or arranging the exploitation of people.",
    maps: ["trafficking", "adult-sexual-exploitation", "unlawful-immigration"],
    blocked: false,
  },
  {
    slug: "impersonation",
    label: "Impersonation or fake identity",
    helper: "Sites pretending to be a person, a company or a public body.",
    maps: ["fraud", "foreign-interference"],
    blocked: false,
  },
  {
    slug: "other",
    label: "Something else harmful",
    helper: "Tell us what is wrong with it in the description box. This option requires a description.",
    maps: [],
    blocked: false,
  },
];

const blockedCategories = [
  {
    slug: "csea",
    label: "Child sexual abuse or exploitation",
    helper: "Routed to the Internet Watch Foundation, who can act on it anonymously.",
    destination: "report.iwf.org.uk",
  },
  {
    slug: "terrorism",
    label: "Terrorist or extremist material",
    helper: "Routed directly to the government reporting service.",
    destination: "gov.uk/report-terrorism",
  },
];

const ofcomHarms = [
  { ref: "1", slug: "terrorism", label: "Terrorism", blocked: true },
  { ref: "2a", slug: "csea-grooming", label: "CSEA: grooming", blocked: true },
  { ref: "2b", slug: "csea-imagery", label: "CSEA: image-based CSAM", blocked: true },
  { ref: "2c", slug: "csea-urls", label: "CSEA: CSAM URLs", blocked: true },
  { ref: "3", slug: "hate", label: "Hate" },
  { ref: "4", slug: "harassment", label: "Harassment, stalking, threats and abuse" },
  { ref: "5", slug: "coercive-control", label: "Controlling or coercive behaviour" },
  { ref: "6", slug: "intimate-image-abuse", label: "Intimate image abuse" },
  { ref: "7", slug: "extreme-pornography", label: "Extreme pornography" },
  { ref: "8", slug: "adult-sexual-exploitation", label: "Sexual exploitation of adults" },
  { ref: "9", slug: "trafficking", label: "Human trafficking" },
  { ref: "10", slug: "unlawful-immigration", label: "Unlawful immigration" },
  { ref: "11", slug: "fraud", label: "Fraud and financial offences" },
  { ref: "12", slug: "proceeds-of-crime", label: "Proceeds of crime" },
  { ref: "13", slug: "drugs", label: "Drugs and psychoactive substances" },
  { ref: "14", slug: "weapons", label: "Firearms, knives and other weapons" },
  { ref: "15", slug: "suicide-self-harm", label: "Encouraging or assisting suicide" },
  { ref: "16", slug: "foreign-interference", label: "Foreign interference" },
  { ref: "17", slug: "animal-cruelty", label: "Animal cruelty" },
];

const primaryPriorityContent = [
  { slug: "ppc-pornography", label: "Pornographic content" },
  { slug: "ppc-suicide", label: "Suicide content" },
  { slug: "ppc-self-harm", label: "Self-harm content" },
  { slug: "ppc-eating-disorder", label: "Eating disorder content" },
];

const priorityContent = [
  { slug: "pc-abuse-hate", label: "Abusive or hateful content" },
  { slug: "pc-bullying", label: "Bullying content" },
  { slug: "pc-violence", label: "Violent content" },
  { slug: "pc-harmful-substances", label: "Harmful substances" },
  { slug: "pc-dangerous-stunts", label: "Dangerous stunts and challenges" },
];

export default function HarmCategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full space-y-16">

        {/* Intro */}
        <header className="space-y-4 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">Harm categories</h1>
          <p className="text-base leading-7 text-muted-foreground">
            Harm Watch uses two layers of classification. The public form uses plain-English categories
            anyone can navigate quickly. Behind the scenes, each category maps to one or more of
            Ofcom&rsquo;s seventeen kinds of priority illegal harm under the{" "}
            <a
              href="https://www.legislation.gov.uk/ukpga/2023/50"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Online Safety Act 2023
            </a>
            . The Ofcom layer never appears on the public form but is what approved organisations
            receive in the feed and API.
          </p>
          <p className="text-sm text-muted-foreground leading-6">
            A submission is an allegation only — not a confirmed breach or a legal verdict.
          </p>
        </header>

        {/* ── Section 1: Public categories ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Public reporting categories</h2>
            <p className="text-sm text-muted-foreground">
              What appears on the form. Twelve accepted categories, plus two that route away to specialist authorities.
            </p>
          </div>

          {/* Routed-away categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Routed to specialist authorities
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {blockedCategories.map((c) => (
                <div
                  key={c.slug}
                  className="border border-destructive/30 rounded-lg p-4 space-y-1.5 bg-destructive/5"
                >
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground leading-5">{c.helper}</p>
                  <p className="text-xs font-mono text-destructive/70">{c.destination}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Accepted categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Accepted for logging
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {publicCategories.map((c) => (
                <div key={c.slug} className="border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground leading-5">{c.helper}</p>
                  {(c.maps && c.maps.length > 0) && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.maps.map((m) => (
                        <span
                          key={m}
                          className="text-xs font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.maps && c.maps.length === 0 && c.slug !== "other" && (
                    <p className="text-xs text-muted-foreground italic">Children&rsquo;s harm tier — no direct illegal-harm equivalent.</p>
                  )}
                  {c.slug === "other" && (
                    <p className="text-xs text-muted-foreground italic">Resolved at triage. Requires a description.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 2: Ofcom taxonomy ─────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Ofcom&rsquo;s seventeen kinds of priority illegal harm
            </h2>
            <p className="text-sm text-muted-foreground leading-6">
              The internal taxonomy defined in Schedules 5, 6 and 7 of the Online Safety Act and in
              Ofcom&rsquo;s Register of Risks. This is what the API returns and what organisations
              export. It does not appear on the public form.
            </p>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground w-12">#</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground hidden sm:table-cell">API slug</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ofcomHarms.map((h) => (
                  <tr key={h.slug} className={h.blocked ? "bg-destructive/5" : ""}>
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums font-mono">{h.ref}</td>
                    <td className="px-4 py-3 font-medium">{h.label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">{h.slug}</td>
                    <td className="px-4 py-3">
                      {h.blocked ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                          Blocked — routed away
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Accepted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground leading-5">
            Two categories — <span className="font-mono">animal-cruelty</span> and{" "}
            <span className="font-mono">foreign-interference</span> — have no corresponding public form option.
            Both are available to admins at triage and can be added to the form later if demand warrants it.
          </p>
        </section>

        {/* ── Section 3: Children's harm ────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Content harmful to children</h2>
            <p className="text-sm text-muted-foreground leading-6">
              A parallel structure in the Act, separate from the illegal content tiers. Stored as descriptors
              in the Harm Watch schema rather than as primary categories.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Primary priority content
              </h3>
              <p className="text-xs text-muted-foreground">
                Services must prevent children encountering this tier. Triggers highly effective age assurance requirements.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {primaryPriorityContent.map((c) => (
                  <div key={c.slug} className="border rounded-md px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{c.slug}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Priority content
              </h3>
              <p className="text-xs text-muted-foreground">
                Services must protect children in age groups at risk from encountering this tier.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {priorityContent.map((c) => (
                  <div key={c.slug} className="border rounded-md px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{c.slug}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-md px-4 py-3 bg-secondary/30">
              <p className="text-sm font-medium">Non-designated content</p>
              <p className="text-xs text-muted-foreground mt-1 leading-5">
                Anything else presenting a material risk of significant harm to an appreciable number of children.
                Deliberately open — this is why the &ldquo;suggest a category&rdquo; field on the form exists.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: A note on scope ────────────────────────────────────── */}
        <section className="border-t pt-10 space-y-3 max-w-2xl">
          <h2 className="text-base font-semibold">A note on regulatory scope</h2>
          <p className="text-sm text-muted-foreground leading-6">
            The Online Safety Act regulates user-to-user services, search services, and Part 5 publishers
            of pornography. A standalone scam site with no user-generated content and no search function
            is not a regulated service, so a good deal of what the public reports will sit outside the Act
            entirely — even when it is plainly harmful.
          </p>
          <p className="text-sm text-muted-foreground leading-6">
            The Ofcom mapping is there to make the data legible to people who work in that framework, not
            to imply every record falls inside it. The <span className="font-mono text-xs">osa_regulated</span>{" "}
            flag in the API carries that distinction.
          </p>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
