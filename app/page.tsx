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
          <div className="mb-10">
            <h2 className="font-display text-5xl tracking-wide sm:text-6xl">
              CENÍK
            </h2>
          </div>
          <ul className="space-y-3">
            {SERVICES.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/rezervace?service=${s.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-6 py-5 transition-all hover:border-accent hover:bg-accent/[0.06] active:scale-[0.98]"
                >
                  <div>
                    <p className="text-lg font-semibold text-fg transition-colors group-hover:text-accent">
                      {s.label}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {s.description} · {s.duration} min
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-3xl tracking-wide text-accent transition-transform group-hover:scale-110">
                    {s.price}
                    <span className="ml-1 text-base text-muted">Kč</span>
                  </span>
                </Link>
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
