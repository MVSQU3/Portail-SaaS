import type { DeadlineKind } from "@prisma/client";
import { ResourceNotFoundError } from "@/lib/errors";
import { classifyDeadline } from "@/lib/notices";
import { getPrisma } from "@/lib/prisma";
import { assertTenantAccess, guardTenantMutation, tenantWhere, type TenantActor } from "@/lib/tenant";
import { syncOperationalNotices } from "@/server/notices";

function companyIdOf(actor: TenantActor): string {
  if (!actor.companyId) throw new ResourceNotFoundError();
  assertTenantAccess(actor, actor.companyId);
  return actor.companyId;
}

export async function listDeadlines(actor: TenantActor) {
  const companyId = companyIdOf(actor);
  return getPrisma().deadline.findMany({
    where: tenantWhere(companyId),
    orderBy: { dueOn: "asc" },
    include: { vehicle: { select: { label: true, registration: true, companyId: true } } },
  });
}

export async function getDeadline(actor: TenantActor, id: string) {
  const companyId = companyIdOf(actor);
  const deadline = await getPrisma().deadline.findFirst({
    where: tenantWhere(companyId, { id }),
    include: { vehicle: true },
  });
  if (!deadline) throw new ResourceNotFoundError();
  guardTenantMutation(actor, deadline);
  return deadline;
}

export async function saveDeadline(
  actor: TenantActor,
  input: {
    id?: string;
    vehicleId: string | null;
    kind: DeadlineKind;
    label: string;
    dueOn: Date;
    treated: boolean;
    costXof: number | null;
    notes: string | null;
  },
  today = new Date(),
) {
  const companyId = companyIdOf(actor);
  const prisma = getPrisma();
  if (input.vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: tenantWhere(companyId, { id: input.vehicleId }),
    });
    if (!vehicle) throw new ResourceNotFoundError();
    guardTenantMutation(actor, vehicle);
  }
  const status = classifyDeadline(input.dueOn, today, input.treated);
  const data = {
    vehicleId: input.vehicleId,
    kind: input.kind,
    label: input.label,
    dueOn: input.dueOn,
    status,
    costXof: input.costXof,
    notes: input.notes,
  };
  if (!input.id) {
    const created = await prisma.deadline.create({ data: { ...data, companyId } });
    await syncOperationalNotices(actor, today);
    return created;
  }
  const existing = await prisma.deadline.findFirst({ where: tenantWhere(companyId, { id: input.id }) });
  if (!existing) throw new ResourceNotFoundError();
  guardTenantMutation(actor, existing);
  await prisma.deadline.updateMany({
    where: tenantWhere(companyId, { id: input.id }),
    data,
  });
  await syncOperationalNotices(actor, today);
  return existing;
}

export async function deleteDeadline(actor: TenantActor, id: string) {
  const companyId = companyIdOf(actor);
  const existing = await getPrisma().deadline.findFirst({ where: tenantWhere(companyId, { id }) });
  if (!existing) throw new ResourceNotFoundError();
  guardTenantMutation(actor, existing);
  await getPrisma().deadline.deleteMany({ where: tenantWhere(companyId, { id }) });
}
