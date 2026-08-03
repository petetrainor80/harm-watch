"use client";

import { useState } from "react";
import { Globe, RefreshCw } from "lucide-react";

interface LookupData {
  domain: string;
  rdap: {
    registrar: string | null;
    nameservers: string[];
    registered: string | null;
    expires: string | null;
    lastChanged: string | null;
    status: string[];
  } | null;
  dns: { ips: string[] };
  hosting: {
    ip: string;
    isp: string;
    org: string;
    asn: string;
    country: string;
    countryCode: string;
  } | null;
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value}</dd>
    </div>
  );
}

export function DomainLookupPanel({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LookupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/lookup`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lookup failed");
      setData(json as LookupData);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Domain intelligence</h2>
        {!fetched ? (
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm text-[#1d70b8] underline underline-offset-4 hover:text-foreground disabled:opacity-50"
          >
            <Globe className="size-3.5" />
            {loading ? "Looking up…" : "Run lookup"}
          </button>
        ) : (
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && !data && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Querying RDAP, DNS, and hosting data…
        </p>
      )}

      {data && (
        <div className="border rounded-md divide-y text-sm">
          {/* Registration */}
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Registration (RDAP)
            </p>
            {data.rdap ? (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
                {data.rdap.registrar && (
                  <Row label="Registrar" value={data.rdap.registrar} />
                )}
                <Row label="Registered" value={fmtDate(data.rdap.registered)} />
                <Row label="Expires" value={fmtDate(data.rdap.expires)} />
                {data.rdap.nameservers.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Nameservers</dt>
                    <dd className="font-mono text-xs mt-0.5 text-muted-foreground">
                      {data.rdap.nameservers.join("  ·  ")}
                    </dd>
                  </div>
                )}
                {data.rdap.status.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Domain status</dt>
                    <dd className="font-mono text-xs mt-0.5 text-muted-foreground">
                      {data.rdap.status.join("  ·  ")}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">
                No RDAP data available for this domain.
              </p>
            )}
          </div>

          {/* Hosting */}
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Hosting
            </p>
            {data.dns.ips.length > 0 ? (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
                <Row
                  label={`IP address${data.dns.ips.length > 1 ? "es" : ""}`}
                  value={<span className="font-mono text-xs">{data.dns.ips.join(", ")}</span>}
                />
                {data.hosting ? (
                  <>
                    <Row label="ISP / Host" value={data.hosting.isp || data.hosting.org || "—"} />
                    {data.hosting.org && data.hosting.org !== data.hosting.isp && (
                      <Row label="Organisation" value={data.hosting.org} />
                    )}
                    <Row
                      label="ASN"
                      value={<span className="font-mono text-xs">{data.hosting.asn}</span>}
                    />
                    <Row
                      label="Country"
                      value={`${data.hosting.country} (${data.hosting.countryCode})`}
                    />
                  </>
                ) : (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">IP hosting data unavailable.</p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground">
                Domain did not resolve — may be offline or non-existent.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
