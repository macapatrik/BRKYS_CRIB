import AdminDashboard from "@/components/AdminDashboard";
import AdminLogin from "@/components/AdminLogin";
import { isAdmin } from "@/lib/auth";

export const metadata = { title: "Správa — BRKYS CRIB" };

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
