export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 pt-10 pb-6 text-sm text-muted sm:flex-row">
        <span className="font-display text-2xl tracking-[0.18em] text-fg">
          BRKYS&rsquo; CRIB
        </span>
        <span className="uppercase tracking-[0.16em]">
          © {new Date().getFullYear()} — Barber Shop
        </span>
      </div>
      <p className="px-6 pb-8 text-center text-xs text-muted/70">
        Vývoj systému — GROWE / Patrik Máca
      </p>
    </footer>
  );
}
