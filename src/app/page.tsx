import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { canEnterGestionnaireShell } from "@/lib/tenant";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    if (session.user.role === "ADMIN_PLATEFORME") {
      redirect("/admin/entreprises");
    }
    if (!session.user.companyId) {
      redirect("/connexion");
    }
    const company = await getPrisma().company.findUnique({
      where: { id: session.user.companyId },
    });
    if (!company || !canEnterGestionnaireShell(company.status)) {
      redirect("/en-attente");
    }
    redirect("/tableau-de-bord");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="grid w-full max-w-xl gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">FleetCare</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            La flotte, les compteurs et les alertes au même endroit.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Portail pour les gestionnaires de parc. Saisie manuelle des kilomètres et des heures,
            seuils d’alerte, validation des entreprises par la plateforme.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/connexion" className="btn">
            Connexion
          </Link>
          <Link href="/inscription" className="btn-secondary">
            Créer un compte entreprise
          </Link>
        </div>
      </div>
    </main>
  );
}
