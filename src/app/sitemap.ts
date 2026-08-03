import type { MetadataRoute } from "next";

const BASE = "https://www.harm.watch";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/harm-categories`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/request-access`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/docs/api`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
