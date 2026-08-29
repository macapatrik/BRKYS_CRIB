import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getServices } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await getServices();
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Ceník */}
        <section className="mx-auto max-w-3xl px-6 py-24">
          <div className="mb-10">
            <h2 className="font-display text-5xl tracking-[0.12em] sm:text-6xl">
              CENÍK
            </h2>
          </div>
          <ul className="space-y-3">
            {services.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/rezervace?service=${s.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-6 py-5 transition-all hover:border-accent hover:bg-elevated active:scale-[0.98]"
                >
                  <div>
                    <p className="text-lg font-medium text-fg">{s.label}</p>
                    <p className="mt-1 text-sm text-muted">
                      {s.description} · {s.duration} min
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-3xl tracking-wide text-accent transition-transform group-hover:scale-105">
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
              className="inline-flex items-center gap-2 rounded-full border border-accent px-9 py-4 text-sm uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent hover:text-accent-fg"
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
