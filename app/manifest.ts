import type { MetadataRoute } from "next";

// Web app manifest — název a barvy při „Přidat na plochu".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BRKYS CRIB — Barber Shop",
    short_name: "BRKYS CRIB",
    description:
      "Objednej se online do barber shopu BRKYS CRIB. Střihy, úprava vousů a holení.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3eee5",
    theme_color: "#f3eee5",
    lang: "cs",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
