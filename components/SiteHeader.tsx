import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-wider text-fg">
            BRKYS
          </span>
          <span className="font-display text-2xl tracking-wider text-accent">
            CRIB
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/zrusit" className="transition-colors hover:text-fg">
            Zrušit rezervaci
          </Link>
          <Link
            href="/rezervace"
            className="rounded-full bg-accent px-4 py-2 font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            Rezervovat
          </Link>
        </nav>
      </div>
    </header>
  );
}
