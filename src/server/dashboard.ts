import { getPrisma } from "@/lib/prisma";
import { assertTenantAccess, guardTenantMutation, tenantWhere, type TenantActor } from "@/lib/tenant";

export async function getDashboard(actor: TenantActor) {
  if (!actor.companyId) {
    throw new Error("Entreprise absente.");
  }
  assertTenantAccess(actor, actor.companyId);
  const companyId = actor.companyId;
  const prisma = getPrisma();
  const where = tenantWhere(companyId);
  const [vehicleCount, openAlerts, activeRules, alerts] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.alert.count({ where: { ...where, status: "OUVERTE" } }),
    prisma.alertRule.count({ where: { ...where, active: true } }),
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        vehicle: { select: { label: true, registration: true, companyId: true } },
      },
    }),
  ]);

  for (const alert of alerts) {
    guardTenantMutation(actor, alert);
    guardTenantMutation(actor, alert.vehicle);
  }

  return { vehicleCount, openAlerts, activeRules, alerts };
}

export async function markAlertRead(actor: TenantActor, alertId: string) {
  if (!actor.companyId) return;
  assertTenantAccess(actor, actor.companyId);
  await getPrisma().alert.updateMany({
    where: tenantWhere(actor.companyId, { id: alertId, status: "OUVERTE" }),
    data: { status: "LUE", readAt: new Date() },
  });
}
