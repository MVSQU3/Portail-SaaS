import { AppShell } from "@/components/app-shell";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { GESTIONNAIRE_NAV } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function GestionnaireLayout({ children }: { children: React.ReactNode }) {
  const { company } = await requireValidatedGestionnaire();
  return (
    <AppShell section="Espace gestionnaire" contextLabel={company.name} items={GESTIONNAIRE_NAV}>
      {children}
    </AppShell>
  );
}
