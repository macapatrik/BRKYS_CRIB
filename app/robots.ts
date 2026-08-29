import type { MetadataRoute } from "next";

// Vyhledávače: pusť veřejné stránky, admin a API drž mimo index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: "https://brkyscrib.cz/sitemap.xml",
  };
}
