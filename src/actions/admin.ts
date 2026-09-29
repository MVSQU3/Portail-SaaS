"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/guards";
import { emptyToNull, optionalInt, subscriptionSchema } from "@/lib/schemas";
import { setCompanyStatus, updateCompanySubscription } from "@/server/companies";

export async function validateCompanyAction(formData: FormData) {
  const { actor } = await requirePlatformAdmin();
  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) redirect("/admin/entreprises?erreur=acces");
  await setCompanyStatus(actor, companyId, "VALIDEE");
  revalidatePath("/admin/entreprises");
  revalidatePath("/admin/abonnements");
  redirect("/admin/entreprises?ok=validee");
}

export async function updateSubscriptionAction(formData: FormData) {
  const { actor } = await requirePlatformAdmin();
  const parsed = subscriptionSchema.safeParse({
    companyId: formData.get("companyId"),
    status: formData.get("status"),
    planName: formData.get("planName") ?? "",
    amountXof: formData.get("amountXof") ?? "",
  });
  if (!parsed.success) redirect("/admin/abonnements?erreur=abonnement");
  if ((parsed.data.amountXof ?? "").trim() !== "" && optionalInt(parsed.data.amountXof) === null) {
    redirect("/admin/abonnements?erreur=abonnement");
  }
  await updateCompanySubscription(actor, {
    companyId: parsed.data.companyId,
    status: parsed.data.status,
    planName: emptyToNull(parsed.data.planName),
    amountXof: optionalInt(parsed.data.amountXof),
  });
  revalidatePath("/admin/abonnements");
  revalidatePath("/abonnement");
  redirect("/admin/abonnements?ok=abonnement");
}

export async function suspendCompanyAction(formData: FormData) {
  const { actor } = await requirePlatformAdmin();
  const companyId = String(formData.get("companyId") ?? "");
  if (!companyId) redirect("/admin/entreprises?erreur=acces");
  await setCompanyStatus(actor, companyId, "SUSPENDUE");
  revalidatePath("/admin/entreprises");
  redirect("/admin/entreprises?ok=suspendue");
}
