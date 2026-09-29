import type { MaintenanceKind } from "@prisma/client";
import { ResourceNotFoundError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma";
import { assertTenantAccess, guardTenantMutation, tenantWhere, type TenantActor } from "@/lib/tenant";

function companyIdOf(actor: TenantActor): string {
  if (!actor.companyId) throw new ResourceNotFoundError();
  assertTenantAccess(actor, actor.companyId);
  return actor.companyId;
}

async function ownedVehicle(actor: TenantActor, vehicleId: string) {
  const companyId = companyIdOf(actor);
  const vehicle = await getPrisma().vehicle.findFirst({
    where: tenantWhere(companyId, { id: vehicleId }),
  });
  if (!vehicle) throw new ResourceNotFoundError();
  guardTenantMutation(actor, vehicle);
  return vehicle;
}

export async function listMaintenance(actor: TenantActor) {
  const companyId = companyIdOf(actor);
  return getPrisma().maintenanceLog.findMany({
    where: tenantWhere(companyId),
    orderBy: { performedAt: "desc" },
    include: { vehicle: { select: { label: true, registration: true, companyId: true } } },
  });
}

export async function getMaintenance(actor: TenantActor, id: string) {
  const companyId = companyIdOf(actor);
  const log = await getPrisma().maintenanceLog.findFirst({
    where: tenantWhere(companyId, { id }),
    include: { vehicle: true },
  });
  if (!log) throw new ResourceNotFoundError();
  guardTenantMutation(actor, log);
  return log;
}

export async function saveMaintenance(
  actor: TenantActor,
  input: {
    id?: string;
    vehicleId: string;
    kind: MaintenanceKind;
    title: string;
    description: string | null;
    performedAt: Date;
    odometerKm: number | null;
    hours: number | null;
    costXof: number;
  },
) {
  const companyId = companyIdOf(actor);
  await ownedVehicle(actor, input.vehicleId);
  const prisma = getPrisma();
  const data = {
    vehicleId: input.vehicleId,
    kind: input.kind,
    title: input.title,
    description: input.description,
    performedAt: input.performedAt,
    odometerKm: input.odometerKm,
    hours: input.hours,
    costXof: input.costXof,
  };
  if (!input.id) {
    return prisma.maintenanceLog.create({ data: { ...data, companyId } });
  }
  const existing = await prisma.maintenanceLog.findFirst({
    where: tenantWhere(companyId, { id: input.id }),
  });
  if (!existing) throw new ResourceNotFoundError();
  guardTenantMutation(actor, existing);
  await prisma.maintenanceLog.updateMany({
    where: tenantWhere(companyId, { id: input.id }),
    data,
  });
  return existing;
}

export async function deleteMaintenance(actor: TenantActor, id: string) {
  const companyId = companyIdOf(actor);
  const existing = await getPrisma().maintenanceLog.findFirst({
    where: tenantWhere(companyId, { id }),
  });
  if (!existing) throw new ResourceNotFoundError();
  guardTenantMutation(actor, existing);
  await getPrisma().maintenanceLog.deleteMany({ where: tenantWhere(companyId, { id }) });
}
