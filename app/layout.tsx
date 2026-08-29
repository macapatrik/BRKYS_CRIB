import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});

const description =
  "Objednej se online do barber shopu BRKYS CRIB. Střihy, úprava vousů a holení — rychlá rezervace termínu.";

export const metadata: Metadata = {
  metadataBase: new URL("https://brkyscrib.cz"),
  title: "BRKYS CRIB — Barber Shop",
  description,
  openGraph: {
    title: "BRKYS CRIB — Barber Shop",
    description,
    url: "https://brkyscrib.cz",
    siteName: "BRKYS CRIB",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BRKYS CRIB — Barber Shop",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f3eee5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="cs"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-fg">
        <div className="bg-photo" aria-hidden />
        {children}
      </body>
    </html>
  );
}
