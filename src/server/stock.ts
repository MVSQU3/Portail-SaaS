import { ResourceNotFoundError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma";
import { assertTenantAccess, guardTenantMutation, tenantWhere, type TenantActor } from "@/lib/tenant";
import { syncOperationalNotices } from "@/server/notices";

function companyIdOf(actor: TenantActor): string {
  if (!actor.companyId) throw new ResourceNotFoundError();
  assertTenantAccess(actor, actor.companyId);
  return actor.companyId;
}

export async function listParts(actor: TenantActor) {
  const companyId = companyIdOf(actor);
  return getPrisma().sparePart.findMany({
    where: tenantWhere(companyId),
    orderBy: { name: "asc" },
  });
}

export async function getPart(actor: TenantActor, id: string) {
  const companyId = companyIdOf(actor);
  const part = await getPrisma().sparePart.findFirst({ where: tenantWhere(companyId, { id }) });
  if (!part) throw new ResourceNotFoundError();
  guardTenantMutation(actor, part);
  return part;
}

export async function savePart(
  actor: TenantActor,
  input: {
    id?: string;
    sku: string;
    name: string;
    quantity: number;
    minQuantity: number;
    unitCostXof: number;
  },
) {
  const companyId = companyIdOf(actor);
  const prisma = getPrisma();
  const sku = input.sku.toUpperCase();

  if (!input.id) {
    const part = await prisma.sparePart.create({
      data: {
        companyId,
        sku,
        name: input.name,
        quantity: input.quantity,
        minQuantity: input.minQuantity,
        unitCostXof: input.unitCostXof,
        movements:
          input.quantity > 0
            ? { create: { companyId, kind: "ENTREE", quantity: input.quantity, note: "Stock initial" } }
            : undefined,
      },
    });
    await syncOperationalNotices(actor);
    return part;
  }

  const existing = await prisma.sparePart.findFirst({ where: tenantWhere(companyId, { id: input.id }) });
  if (!existing) throw new ResourceNotFoundError();
  guardTenantMutation(actor, existing);
  const delta = input.quantity - existing.quantity;
  await prisma.$transaction(async (tx) => {
    await tx.sparePart.updateMany({
      where: tenantWhere(companyId, { id: input.id }),
      data: {
        sku,
        name: input.name,
        quantity: input.quantity,
        minQuantity: input.minQuantity,
        unitCostXof: input.unitCostXof,
      },
    });
    if (delta !== 0) {
      await tx.stockMovement.create({
        data: {
          companyId,
          sparePartId: existing.id,
          kind: delta > 0 ? "ENTREE" : "SORTIE",
          quantity: Math.abs(delta),
          note: "Ajustement de stock",
        },
      });
    }
  });
  await syncOperationalNotices(actor);
  return existing;
}

export async function deletePart(actor: TenantActor, id: string) {
  const companyId = companyIdOf(actor);
  const existing = await getPrisma().sparePart.findFirst({ where: tenantWhere(companyId, { id }) });
  if (!existing) throw new ResourceNotFoundError();
  guardTenantMutation(actor, existing);
  await getPrisma().sparePart.deleteMany({ where: tenantWhere(companyId, { id }) });
}
