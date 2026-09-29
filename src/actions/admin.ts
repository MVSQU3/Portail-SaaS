"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/guards";
import { setCompanyStatus } from "@/server/companies";

export async function validateCompanyAction(formData: FormData) {
  const { actor } = await requirePlatformAdmin();
  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) redirect("/admin/entreprises?erreur=acces");
  await setCompanyStatus(actor, companyId, "VALIDEE");
  revalidatePath("/admin/entreprises");
  revalidatePath("/admin/abonnements");
  redirect("/admin/entreprises?ok=validee");
}

export async function suspendCompanyAction(formData: FormData) {
  const { actor } = await requirePlatformAdmin();
  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) redirect("/admin/entreprises?erreur=acces");
  await setCompanyStatus(actor, companyId, "SUSPENDUE");
  revalidatePath("/admin/entreprises");
  redirect("/admin/entreprises?ok=suspendue");
}
