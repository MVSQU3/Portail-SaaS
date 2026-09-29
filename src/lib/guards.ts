import { redirect } from "next/navigation";
import type { Company } from "@prisma/client";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { canEnterGestionnaireShell, type TenantActor } from "@/lib/tenant";

export async function requireSession(): Promise<{
  userId: string;
  actor: TenantActor;
  email: string;
  name: string;
}> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/connexion");
  }
  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    actor: {
      role: session.user.role,
      companyId: session.user.companyId,
    },
  };
}

export async function requireValidatedGestionnaire(): Promise<{
  userId: string;
  actor: TenantActor & { companyId: string };
  company: Company;
}> {
  const session = await requireSession();
  if (session.actor.role === "ADMIN_PLATEFORME") {
    redirect("/admin/entreprises");
  }
  if (!session.actor.companyId) {
    redirect("/connexion");
  }
  const company = await getPrisma().company.findUnique({
    where: { id: session.actor.companyId },
  });
  if (!company || !canEnterGestionnaireShell(company.status)) {
    redirect("/en-attente");
  }
  return {
    userId: session.userId,
    actor: { role: "GESTIONNAIRE", companyId: company.id },
    company,
  };
}

export async function requirePlatformAdmin(): Promise<{ userId: string; actor: TenantActor }> {
  const session = await requireSession();
  if (session.actor.role !== "ADMIN_PLATEFORME") {
    redirect("/tableau-de-bord");
  }
  return { userId: session.userId, actor: session.actor };
}
