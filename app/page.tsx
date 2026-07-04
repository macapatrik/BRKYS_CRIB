import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SERVICES } from "@/lib/services";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
          <div className="mx-auto max-w-5xl px-6 py-28 text-center sm:py-36">
            <p className="text-sm uppercase tracking-[0.3em] text-accent">
              Barber Shop
            </p>
            <h1 className="mt-6 font-display text-6xl leading-none tracking-wide sm:text-8xl">
              BRKYS CRIB
            </h1>
            <p className="mx-auto mt-6 max-w-md text-lg text-muted">
              Precizní střih, čistý fade a poctivá péče o vousy. Rezervuj si
              svůj termín online — rychle a bez volání.
            </p>
            <Link
              href="/rezervace"
              className="mt-10 inline-block rounded-full bg-accent px-8 py-4 font-medium text-accent-fg transition-opacity hover:opacity-90"
            >
              Rezervovat termín
            </Link>
          </div>
        </section>

        {/* Ceník */}
        <section className="mx-auto max-w-3xl px-6 pb-28">
          <h2 className="mb-8 text-center text-sm uppercase tracking-[0.3em] text-muted">
            Ceník
          </h2>
          <ul className="divide-y divide-border/60">
            {SERVICES.map((s) => (
              <li
                key={s.id}
                className="flex items-baseline justify-between gap-4 py-4"
              >
                <span className="text-lg text-fg">{s.label}</span>
                <span className="flex-1 border-b border-dashed border-border/60" />
                <span className="font-display text-2xl tracking-wide text-accent">
                  {s.price} Kč
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
