import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";
import AdminLogin from "@/components/AdminLogin";
import { isAdmin } from "@/lib/auth";

// Admin má vlastní manifest (start_url: /admin) → po „Přidat na plochu"
// naskočí rovnou správa jako samostatná appka, ne homepage.
export const metadata: Metadata = {
  title: "Správa — BRKYS CRIB",
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BRKYS Admin",
    statusBarStyle: "default",
  },
};

export default async function AdminPage() {
  const authed = await isAdmin();

  if (!process.env.ADMIN_PASSWORD) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-24">
        <h1 className="font-display text-5xl tracking-wide">Správa</h1>
        <p className="mt-4 text-muted">
          Admin není nastaven. Přidej <code>ADMIN_PASSWORD</code> do{" "}
          <code>.env.local</code> a restartuj server.
        </p>
      </main>
    );
  }

  return authed ? <AdminDashboard /> : <AdminLogin />;
}
