import { evaluateInitialMeters } from "@/lib/alerts";
import { getPrisma } from "@/lib/prisma";
import { assertTenantAccess, tenantWhere, type TenantActor } from "@/lib/tenant";
import { VehicleNotFoundError } from "@/lib/errors";
import { sendThresholdEmails, writeThresholdAlerts } from "@/server/readings";

export async function listVehicles(actor: TenantActor) {
  if (!actor.companyId) {
    throw new VehicleNotFoundError();
  }
  assertTenantAccess(actor, actor.companyId);
  return getPrisma().vehicle.findMany({
    where: tenantWhere(actor.companyId),
    orderBy: { label: "asc" },
  });
}

export async function getVehicle(actor: TenantActor, vehicleId: string) {
  if (!actor.companyId) {
    throw new VehicleNotFoundError();
  }
  assertTenantAccess(actor, actor.companyId);
  const vehicle = await getPrisma().vehicle.findFirst({
    where: tenantWhere(actor.companyId, { id: vehicleId }),
    include: {
      meterReadings: { orderBy: { recordedAt: "desc" }, take: 20 },
      alertRules: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!vehicle) {
    throw new VehicleNotFoundError();
  }
  assertTenantAccess(actor, vehicle.companyId);
  return vehicle;
}

export async function createVehicle(
  actor: TenantActor,
  input: {
    label: string;
    registration: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    currentKm: number;
    currentHours: number;
  },
) {
  if (!actor.companyId) {
    throw new VehicleNotFoundError();
  }
  assertTenantAccess(actor, actor.companyId);
  const companyId = actor.companyId;
  const prisma = getPrisma();
  const prepared = await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.create({
      data: {
        companyId,
        label: input.label,
        registration: input.registration.toUpperCase(),
        brand: input.brand,
        model: input.model,
        year: input.year,
        currentKm: input.currentKm,
        currentHours: input.currentHours,
        meterReadings: {
          create: [
            ...(input.currentKm > 0
              ? [
                  {
                    companyId,
                    metric: "KILOMETRES" as const,
                    value: input.currentKm,
                    note: "Relevé initial",
                  },
                ]
              : []),
            ...(input.currentHours > 0
              ? [
                  {
                    companyId,
                    metric: "HEURES" as const,
                    value: input.currentHours,
                    note: "Relevé initial",
                  },
                ]
              : []),
          ],
        },
      },
      include: { meterReadings: true },
    });

    const rules = await tx.alertRule.findMany({
      where: tenantWhere(companyId, { active: true }),
    });
    const crossings = evaluateInitialMeters({
      companyId,
      vehicleId: vehicle.id,
      currentKm: input.currentKm,
      currentHours: input.currentHours,
      rules,
    });
    const alerts = await writeThresholdAlerts(tx, {
      companyId,
      vehicleId: vehicle.id,
      vehicleLabel: vehicle.label,
      registration: vehicle.registration,
      items: crossings.flatMap((crossing) => {
        const reading = vehicle.meterReadings.find((item) => item.metric === crossing.metric);
        if (!reading) return [];
        return [{ fired: crossing, readingId: reading.id, value: crossing.value }];
      }),
    });

    return { vehicle, alerts };
  });

  await sendThresholdEmails(companyId, prepared.alerts.copies, prepared.alerts.recipients);
  return prepared.vehicle;
}
