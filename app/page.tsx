import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SERVICES } from "@/lib/services";

const MARQUEE = [
  "FRESH FADE",
  "SKIN FADE",
  "BEARD TRIM",
  "LINE UP",
  "BRKYS CRIB",
  "WALK-IN? RADŠI REZERVUJ",
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* neonová záře */}
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]" />
          {/* rastr v pozadí */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(circle at 50% 30%, black, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 text-center sm:pt-32">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent glow-box" />
              Barber Shop
            </p>
            <h1 className="mt-8 font-display text-7xl leading-[0.85] tracking-wide sm:text-[10rem]">
              <span className="block">BRKYS</span>
              <span className="block text-accent glow">CRIB</span>
            </h1>
            <p className="mx-auto mt-8 max-w-md text-lg text-muted">
              Ostrý střih, čistý fade a poctivá péče o vousy. Vyber si termín
              online — <span className="text-fg">rychle a bez volání.</span>
            </p>
            <Link
              href="/rezervace"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-9 py-4 text-base font-extrabold uppercase tracking-wide text-accent-fg transition-transform hover:scale-105 glow-box"
            >
              Rezervovat termín →
            </Link>
          </div>
        </section>

        {/* Běžící pásek */}
        <section className="border-y border-border bg-accent py-3 overflow-hidden">
          <div className="marquee-track flex w-max whitespace-nowrap">
            {[0, 1].map((rep) => (
              <div key={rep} className="flex items-center" aria-hidden={rep === 1}>
                {MARQUEE.map((word) => (
                  <span
                    key={word}
                    className="mx-6 font-display text-xl tracking-wide text-accent-fg"
                  >
                    {word}
                    <span className="ml-6 text-accent-fg/40">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Ceník */}
        <section className="mx-auto max-w-3xl px-6 py-24">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-display text-5xl tracking-wide sm:text-6xl">
              CENÍK
            </h2>
            <span className="pb-1 text-xs font-bold uppercase tracking-[0.25em] text-accent">
              Co to dá
            </span>
          </div>
          <ul className="space-y-3">
            {SERVICES.map((s) => (
              <li
                key={s.id}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-6 py-5 transition-colors hover:border-accent"
              >
                <div>
                  <p className="text-lg font-semibold text-fg">{s.label}</p>
                  <p className="mt-1 text-sm text-muted">
                    {s.description} · {s.duration} min
                  </p>
                </div>
                <span className="shrink-0 font-display text-3xl tracking-wide text-accent transition-transform group-hover:scale-110">
                  {s.price}
                  <span className="ml-1 text-base text-muted">Kč</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-12 text-center">
            <Link
              href="/rezervace"
              className="inline-flex items-center gap-2 rounded-full border-2 border-accent px-8 py-4 text-base font-extrabold uppercase tracking-wide text-accent transition-colors hover:bg-accent hover:text-accent-fg"
            >
              Zabookuj se →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
