import { AppShell } from "@/components/app-shell";
import { requirePlatformAdmin } from "@/lib/guards";
import { ADMIN_NAV } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return (
    <AppShell section="Administration plateforme" contextLabel="Toutes les entreprises" items={ADMIN_NAV}>
      {children}
    </AppShell>
  );
}
