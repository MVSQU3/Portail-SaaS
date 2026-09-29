"use server";

import { Prisma } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ResourceNotFoundError } from "@/lib/errors";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { parseIsoDate } from "@/lib/notices";
import { deadlineSchema, emptyToNull, maintenanceSchema, optionalInt, partSchema } from "@/lib/schemas";
import { deleteDeadline, saveDeadline } from "@/server/deadlines";
import { deleteMaintenance, saveMaintenance } from "@/server/maintenance";
import { markNoticeRead } from "@/server/notices";
import { deletePart, savePart } from "@/server/stock";

function invalidOptionalInt(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 && optionalInt(trimmed) === null;
}

export async function saveMaintenanceAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const parsed = maintenanceSchema.safeParse({
    id: formData.get("id") ?? "",
    vehicleId: formData.get("vehicleId"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    description: formData.get("description"),
    performedAt: formData.get("performedAt"),
    odometerKm: formData.get("odometerKm") ?? "",
    hours: formData.get("hours") ?? "",
    costXof: formData.get("costXof") || 0,
  });
  const returnTo = String(formData.get("id") ?? "") ? `/carnet/${formData.get("id")}` : "/carnet";
  if (!parsed.success) redirect(`${returnTo}?erreur=entretien`);
  if (invalidOptionalInt(parsed.data.odometerKm) || invalidOptionalInt(parsed.data.hours)) {
    redirect(`${returnTo}?erreur=entretien`);
  }
  const performedAt = parseIsoDate(parsed.data.performedAt);
  if (!performedAt) redirect(`${returnTo}?erreur=entretien`);

  try {
    await saveMaintenance(actor, {
      id: emptyToNull(parsed.data.id) ?? undefined,
      vehicleId: parsed.data.vehicleId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      description: emptyToNull(parsed.data.description),
      performedAt,
      odometerKm: optionalInt(parsed.data.odometerKm),
      hours: optionalInt(parsed.data.hours),
      costXof: parsed.data.costXof,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }

  revalidatePath("/carnet");
  redirect("/carnet?ok=entretien");
}

export async function deleteMaintenanceAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/carnet?erreur=entretien");
  try {
    await deleteMaintenance(actor, id);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }
  revalidatePath("/carnet");
  redirect("/carnet?ok=entretien-supprime");
}

export async function savePartAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const parsed = partSchema.safeParse({
    id: formData.get("id") ?? "",
    sku: formData.get("sku"),
    name: formData.get("name"),
    quantity: formData.get("quantity"),
    minQuantity: formData.get("minQuantity"),
    unitCostXof: formData.get("unitCostXof") || 0,
  });
  const returnTo = String(formData.get("id") ?? "") ? `/stocks/${formData.get("id")}` : "/stocks";
  if (!parsed.success) redirect(`${returnTo}?erreur=stock`);
  try {
    await savePart(actor, {
      id: emptyToNull(parsed.data.id) ?? undefined,
      sku: parsed.data.sku,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      minQuantity: parsed.data.minQuantity,
      unitCostXof: parsed.data.unitCostXof,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(`${returnTo}?erreur=stock`);
    }
    throw error;
  }
  revalidatePath("/stocks");
  revalidatePath("/tableau-de-bord");
  redirect("/stocks?ok=stock");
}

export async function deletePartAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/stocks?erreur=stock");
  try {
    await deletePart(actor, id);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }
  revalidatePath("/stocks");
  redirect("/stocks?ok=stock-supprime");
}

export async function saveDeadlineAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const parsed = deadlineSchema.safeParse({
    id: formData.get("id") ?? "",
    vehicleId: formData.get("vehicleId") ?? "",
    kind: formData.get("kind"),
    label: formData.get("label"),
    dueOn: formData.get("dueOn"),
    costXof: formData.get("costXof") ?? "",
    notes: formData.get("notes") ?? "",
    treated: formData.get("treated") ?? "",
  });
  const returnTo = String(formData.get("id") ?? "") ? `/echeances/${formData.get("id")}` : "/echeances";
  if (!parsed.success) redirect(`${returnTo}?erreur=echeance`);
  if (invalidOptionalInt(parsed.data.costXof)) redirect(`${returnTo}?erreur=echeance`);
  const dueOn = parseIsoDate(parsed.data.dueOn);
  if (!dueOn) redirect(`${returnTo}?erreur=echeance`);
  try {
    await saveDeadline(actor, {
      id: emptyToNull(parsed.data.id) ?? undefined,
      vehicleId: emptyToNull(parsed.data.vehicleId),
      kind: parsed.data.kind,
      label: parsed.data.label,
      dueOn,
      treated: parsed.data.treated === "on",
      costXof: optionalInt(parsed.data.costXof),
      notes: emptyToNull(parsed.data.notes),
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }
  revalidatePath("/echeances");
  revalidatePath("/tableau-de-bord");
  redirect("/echeances?ok=echeance");
}

export async function deleteDeadlineAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/echeances?erreur=echeance");
  try {
    await deleteDeadline(actor, id);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }
  revalidatePath("/echeances");
  redirect("/echeances?ok=echeance-supprime");
}

export async function markNoticeReadAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const noticeId = String(formData.get("noticeId") ?? "");
  if (!noticeId) redirect("/tableau-de-bord?erreur=acces");
  await markNoticeRead(actor, noticeId);
  revalidatePath("/tableau-de-bord");
  revalidatePath("/stocks");
  revalidatePath("/echeances");
  redirect("/tableau-de-bord?ok=alerte");
}
