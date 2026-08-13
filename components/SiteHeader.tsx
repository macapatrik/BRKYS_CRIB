import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-display text-2xl tracking-wide text-fg">
            BRKYS
          </span>
          <span className="font-display text-2xl tracking-wide text-accent transition-transform group-hover:-rotate-3">
            CRIB
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/zrusit"
            className="text-muted transition-colors hover:text-fg"
          >
            Zrušit
          </Link>
          <Link
            href="/rezervace"
            className="rounded-full bg-accent px-5 py-2 font-bold uppercase tracking-wide text-accent-fg transition-transform hover:scale-105"
          >
            Rezervovat
          </Link>
        </nav>
      </div>
    </header>
  );
}
