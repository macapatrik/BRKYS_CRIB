export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-10 text-sm text-muted sm:flex-row">
        <span className="font-display text-2xl tracking-wide text-fg">
          BRKYS <span className="text-accent">CRIB</span>
        </span>
        <span className="uppercase tracking-wide">
          © {new Date().getFullYear()} — Barber Shop
        </span>
      </div>
    </footer>
  );
}
