import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BookingForm from "@/components/BookingForm";

export const metadata = { title: "Rezervace — BRKYS CRIB" };

export default function RezervacePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="font-display text-5xl tracking-wide">Rezervace</h1>
        <p className="mt-3 mb-12 text-muted">
          Vyber službu, volný termín a nech nám na sebe kontakt.
        </p>
        <BookingForm />
      </main>
      <SiteFooter />
    </>
  );
}
