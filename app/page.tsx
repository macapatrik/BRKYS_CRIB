import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SERVICES } from "@/lib/services";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
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
