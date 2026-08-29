import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <Link href="/" className="group">
          <span className="font-display whitespace-nowrap text-base tracking-[0.12em] text-fg sm:text-2xl sm:tracking-[0.18em]">
            BRKYS&rsquo; CRIB
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          <Link
            href="/zrusit"
            className="text-muted transition-colors hover:text-fg"
          >
            Zrušit
          </Link>
          <Link
            href="/rezervace"
            className="whitespace-nowrap rounded-full bg-accent px-4 py-2 text-xs uppercase tracking-[0.16em] text-accent-fg transition-opacity hover:opacity-80 sm:px-5"
          >
            Rezervovat
          </Link>
        </nav>
      </div>
    </header>
  );
}
