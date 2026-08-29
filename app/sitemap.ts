import type { MetadataRoute } from "next";

// Mapa veřejných stránek pro Google (admin sem záměrně nepatří).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://brkyscrib.cz";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/rezervace`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/zrusit`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
