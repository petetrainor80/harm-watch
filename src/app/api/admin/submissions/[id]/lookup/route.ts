import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, [string, Record<string, unknown>, string, string][]];
}

interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

interface RdapResponse {
  status?: string[];
  events?: RdapEvent[];
  entities?: RdapEntity[];
  nameservers?: { ldhName: string }[];
}

interface DnsAnswer {
  type: number;
  data: string;
}

interface DnsResponse {
  Answer?: DnsAnswer[];
}

interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  isp: string;
  org: string;
  as: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: submission } = await service
    .from("submissions").select("domain").eq("id", id).single();
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { domain } = submission;

  const [rdapResult, dnsResult] = await Promise.allSettled([
    fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(6000),
    }).then(r => (r.ok ? r.json() as Promise<RdapResponse> : null)),

    fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(6000),
    }).then(r => (r.ok ? r.json() as Promise<DnsResponse> : null)),
  ]);

  const rdap = rdapResult.status === "fulfilled" ? rdapResult.value : null;
  const dns  = dnsResult.status  === "fulfilled" ? dnsResult.value  : null;

  const ips = (dns?.Answer ?? [])
    .filter(a => a.type === 1)
    .map(a => a.data);

  let hosting: IpApiResponse | null = null;
  if (ips[0]) {
    const ipResult = await Promise.race<IpApiResponse | null>([
      fetch(
        `http://ip-api.com/json/${ips[0]}?fields=status,country,countryCode,isp,org,as`,
        { signal: AbortSignal.timeout(5000) }
      ).then(r => (r.ok ? r.json() as Promise<IpApiResponse> : null)),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 5500)),
    ]);
    hosting = ipResult?.status === "success" ? ipResult : null;
  }

  const registrar = rdap?.entities
    ?.find(e => e.roles?.includes("registrar"))
    ?.vcardArray?.[1]
    ?.find(v => v[0] === "fn")?.[3] ?? null;

  const events = Object.fromEntries(
    (rdap?.events ?? []).map(e => [e.eventAction, e.eventDate])
  );

  const nameservers = (rdap?.nameservers ?? []).map(ns => ns.ldhName);

  return NextResponse.json({
    domain,
    rdap: rdap
      ? {
          registrar,
          nameservers,
          registered:  events["registration"]  ?? null,
          expires:     events["expiration"]     ?? null,
          lastChanged: events["last changed"]   ?? null,
          status:      rdap.status              ?? [],
        }
      : null,
    dns: { ips },
    hosting: hosting
      ? {
          ip:          ips[0],
          isp:         hosting.isp,
          org:         hosting.org,
          asn:         hosting.as,
          country:     hosting.country,
          countryCode: hosting.countryCode,
        }
      : null,
  });
}
