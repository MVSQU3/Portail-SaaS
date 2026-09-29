"use server";

import { Prisma } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { MeterRegressionError, VehicleNotFoundError } from "@/lib/errors";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { emptyToNull, parseYear, readingSchema, ruleSchema, vehicleSchema } from "@/lib/schemas";
import { markAlertRead } from "@/server/dashboard";
import { recordMeterReading, createAlertRule } from "@/server/readings";
import { createVehicle } from "@/server/vehicles";

export async function createVehicleAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const parsed = vehicleSchema.safeParse({
    label: formData.get("label"),
    registration: formData.get("registration"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    currentKm: formData.get("currentKm") || 0,
    currentHours: formData.get("currentHours") || 0,
  });
  if (!parsed.success) {
    redirect("/vehicules?erreur=vehicule");
  }
  const year = parseYear(parsed.data.year);
  if ((parsed.data.year ?? "").trim() !== "" && year === null) {
    redirect("/vehicules?erreur=vehicule");
  }

  try {
    await createVehicle(actor, {
      label: parsed.data.label,
      registration: parsed.data.registration,
      brand: emptyToNull(parsed.data.brand),
      model: emptyToNull(parsed.data.model),
      year,
      currentKm: parsed.data.currentKm,
      currentHours: parsed.data.currentHours,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/vehicules?erreur=vehicule");
    }
    throw error;
  }

  revalidatePath("/vehicules");
  redirect("/vehicules?ok=vehicule");
}

export async function addReadingAction(formData: FormData) {
  const { actor, userId } = await requireValidatedGestionnaire();
  const parsed = readingSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    metric: formData.get("metric"),
    value: formData.get("value"),
    note: formData.get("note"),
  });
  const vehicleId = String(formData.get("vehicleId") ?? "");
  if (!parsed.success) {
    redirect(`/vehicules/${vehicleId}?erreur=releve`);
  }

  try {
    await recordMeterReading({
      actor,
      userId,
      vehicleId: parsed.data.vehicleId,
      metric: parsed.data.metric,
      value: parsed.data.value,
      note: emptyToNull(parsed.data.note),
    });
  } catch (error) {
    if (error instanceof MeterRegressionError) {
      redirect(`/vehicules/${parsed.data.vehicleId}?erreur=releve`);
    }
    if (error instanceof VehicleNotFoundError) {
      notFound();
    }
    throw error;
  }

  revalidatePath(`/vehicules/${parsed.data.vehicleId}`);
  revalidatePath("/tableau-de-bord");
  redirect(`/vehicules/${parsed.data.vehicleId}?ok=releve`);
}

export async function createRuleAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const parsed = ruleSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    name: formData.get("name"),
    metric: formData.get("metric"),
    threshold: formData.get("threshold"),
  });
  const vehicleId = String(formData.get("vehicleId") ?? "");
  if (!parsed.success) {
    redirect(`/vehicules/${vehicleId}?erreur=seuil`);
  }

  try {
    await createAlertRule(actor, parsed.data);
  } catch (error) {
    if (error instanceof VehicleNotFoundError) notFound();
    throw error;
  }

  revalidatePath(`/vehicules/${parsed.data.vehicleId}`);
  redirect(`/vehicules/${parsed.data.vehicleId}?ok=seuil`);
}

export async function markAlertReadAction(formData: FormData) {
  const { actor } = await requireValidatedGestionnaire();
  const alertId = String(formData.get("alertId") ?? "");
  if (!alertId) redirect("/tableau-de-bord?erreur=acces");
  await markAlertRead(actor, alertId);
  revalidatePath("/tableau-de-bord");
  redirect("/tableau-de-bord?ok=alerte");
}
