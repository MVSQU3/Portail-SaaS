import type { CompanyStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { assertPlatformAdmin, type TenantActor } from "@/lib/tenant";

export async function registerCompany(input: {
  companyName: string;
  city: string | null;
  phone: string | null;
  managerName: string;
  email: string;
  password: string;
}): Promise<void> {
  const passwordHash = await hashPassword(input.password);
  const prisma = getPrisma();
  await prisma.company.create({
    data: {
      name: input.companyName,
      email: input.email,
      phone: input.phone,
      city: input.city,
      status: "EN_ATTENTE",
      subscription: { create: { status: "AUCUN" } },
      users: {
        create: {
          email: input.email,
          name: input.managerName,
          passwordHash,
          role: "GESTIONNAIRE",
        },
      },
    },
  });
}

export async function listCompaniesForAdmin(actor: TenantActor) {
  assertPlatformAdmin(actor);
  return getPrisma().company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: { select: { users: true, vehicles: true } },
    },
  });
}

export async function setCompanyStatus(actor: TenantActor, companyId: string, status: CompanyStatus) {
  assertPlatformAdmin(actor);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.company.update({ where: { id: companyId }, data: { status } });
    await tx.subscription.upsert({
      where: { companyId },
      create: { companyId, status: "AUCUN" },
      update: {},
    });
  });
}
