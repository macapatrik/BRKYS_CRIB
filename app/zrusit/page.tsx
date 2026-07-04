import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CancelForm from "@/components/CancelForm";

export const metadata = { title: "Zrušení rezervace — BRKYS CRIB" };

export default function ZrusitPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <h1 className="font-display text-5xl tracking-wide">Zrušit rezervaci</h1>
        <p className="mt-3 mb-12 text-muted">
          Zadej kód, který jsi dostal při rezervaci, a důvod zrušení.
        </p>
        <CancelForm />
      </main>
      <SiteFooter />
    </>
  );
}
