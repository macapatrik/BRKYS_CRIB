export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted sm:flex-row">
        <span className="font-display text-lg tracking-wider text-fg">
          BRKYS CRIB
        </span>
        <span>© {new Date().getFullYear()} — Barber Shop</span>
      </div>
    </footer>
  );
}
