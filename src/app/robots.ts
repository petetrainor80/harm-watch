import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/org/", "/auth/", "/api/", "/login", "/mfa-setup", "/mfa-verify"],
      },
    ],
    sitemap: "https://www.harm.watch/sitemap.xml",
  };
}
