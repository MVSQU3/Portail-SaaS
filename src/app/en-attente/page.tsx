import { redirect } from "next/navigation";
import { signOutAction } from "@/actions/auth";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPrisma } from "@/lib/prisma";
import { canEnterGestionnaireShell } from "@/lib/tenant";

export const metadata = { title: "Validation" };

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role === "ADMIN_PLATEFORME") redirect("/admin/entreprises");
  if (!session.user.companyId) redirect("/connexion");

  const company = await getPrisma().company.findUnique({
    where: { id: session.user.companyId },
  });
  if (!company) redirect("/connexion");
  if (canEnterGestionnaireShell(company.status)) redirect("/tableau-de-bord");

  const suspended = company.status === "SUSPENDUE";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="card w-full max-w-lg p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">FleetCare</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {suspended ? "Accès suspendu" : "Validation en cours"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {suspended
            ? `${company.name} est suspendue. Le parc, les relevés et les alertes sont bloqués jusqu’à une nouvelle validation par la plateforme.`
            : `${company.name} est en attente de validation. Un administrateur plateforme doit accepter l’entreprise avant l’ouverture de l’espace gestionnaire.`}
        </p>
        <form action={signOutAction} className="mt-6">
          <button type="submit" className="btn-secondary">
            Déconnexion
          </button>
        </form>
        <div className="mt-6">
          <ThemeToggle />
        </div>
      </section>
    </main>
  );
}
