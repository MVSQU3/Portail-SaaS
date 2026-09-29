import {
  buildAlertCopy,
  evaluateMeterReading,
  isMeterProgression,
  type FiredRule,
  type MeterMetric,
} from "@/lib/alerts";
import type { Prisma } from "@prisma/client";
import { deliverTransactionalEmail } from "@/lib/email";
import { MeterRegressionError, VehicleNotFoundError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma";
import {
  assertTenantAccess,
  emailsForCompany,
  guardTenantMutation,
  tenantWhere,
  type TenantActor,
} from "@/lib/tenant";

type AlertCopy = ReturnType<typeof buildAlertCopy>;

export async function writeThresholdAlerts(
  tx: Prisma.TransactionClient,
  input: {
    companyId: string;
    vehicleId: string;
    vehicleLabel: string;
    registration: string;
    items: Array<{ fired: FiredRule; readingId: string; value: number }>;
  },
): Promise<{ copies: AlertCopy[]; recipients: string[] }> {
  const copies: AlertCopy[] = [];
  for (const item of input.items) {
    const copy = buildAlertCopy({
      ruleName: item.fired.name,
      vehicleLabel: input.vehicleLabel,
      registration: input.registration,
      metric: item.fired.metric,
      value: item.value,
      threshold: item.fired.threshold,
    });
    await tx.alert.create({
      data: {
        companyId: input.companyId,
        vehicleId: input.vehicleId,
        ruleId: item.fired.ruleId,
        readingId: item.readingId,
        title: copy.title,
        message: copy.message,
        status: "OUVERTE",
      },
    });
    copies.push(copy);
  }

  const users = await tx.user.findMany({
    where: { companyId: input.companyId },
    select: { companyId: true, email: true, role: true },
  });

  return { copies, recipients: emailsForCompany(input.companyId, users) };
}

export async function sendThresholdEmails(
  companyId: string,
  copies: AlertCopy[],
  recipients: string[],
): Promise<void> {
  for (const copy of copies) {
    for (const to of recipients) {
      await deliverTransactionalEmail({
        to,
        subject: copy.emailSubject,
        body: copy.emailBody,
        kind: "ALERTE_SEUIL",
        companyId,
      });
    }
  }
}

export async function recordMeterReading(input: {
  actor: TenantActor;
  userId: string;
  vehicleId: string;
  metric: MeterMetric;
  value: number;
  note?: string | null;
}): Promise<{ alertCount: number }> {
  if (!input.actor.companyId) {
    throw new VehicleNotFoundError();
  }
  const companyId = input.actor.companyId;
  assertTenantAccess(input.actor, companyId);
  const prisma = getPrisma();

  const prepared = await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findFirst({
      where: tenantWhere(companyId, { id: input.vehicleId }),
    });
    if (!vehicle) throw new VehicleNotFoundError();
    guardTenantMutation(input.actor, vehicle);

    const previous = input.metric === "KILOMETRES" ? vehicle.currentKm : vehicle.currentHours;
    if (!isMeterProgression(previous, input.value)) {
      throw new MeterRegressionError();
    }

    const rules = await tx.alertRule.findMany({
      where: tenantWhere(companyId, { active: true, metric: input.metric }),
    });
    const fired = evaluateMeterReading({
      companyId,
      vehicleId: vehicle.id,
      metric: input.metric,
      previous,
      next: input.value,
      rules,
    });

    const reading = await tx.meterReading.create({
      data: {
        companyId,
        vehicleId: vehicle.id,
        metric: input.metric,
        value: input.value,
        note: input.note || null,
        recordedById: input.userId,
      },
    });

    await tx.vehicle.updateMany({
      where: tenantWhere(companyId, { id: vehicle.id }),
      data: input.metric === "KILOMETRES" ? { currentKm: input.value } : { currentHours: input.value },
    });

    return writeThresholdAlerts(tx, {
      companyId,
      vehicleId: vehicle.id,
      vehicleLabel: vehicle.label,
      registration: vehicle.registration,
      items: fired.map((rule) => ({ fired: rule, readingId: reading.id, value: input.value })),
    });
  });

  await sendThresholdEmails(companyId, prepared.copies, prepared.recipients);

  return { alertCount: prepared.copies.length };
}

export async function createAlertRule(
  actor: TenantActor,
  input: { vehicleId: string; name: string; metric: MeterMetric; threshold: number },
) {
  if (!actor.companyId) throw new VehicleNotFoundError();
  assertTenantAccess(actor, actor.companyId);
  const prisma = getPrisma();
  const vehicle = await prisma.vehicle.findFirst({
    where: tenantWhere(actor.companyId, { id: input.vehicleId }),
  });
  if (!vehicle) throw new VehicleNotFoundError();
  guardTenantMutation(actor, vehicle);
  return prisma.alertRule.create({
    data: {
      companyId: actor.companyId,
      vehicleId: vehicle.id,
      name: input.name,
      metric: input.metric,
      threshold: input.threshold,
      active: true,
    },
  });
}
