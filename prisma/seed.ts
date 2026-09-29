import { PrismaClient, type CompanyStatus, type SubscriptionStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/passwords";

const prisma = new PrismaClient();

const ACCOUNTS = {
  admin: {
    email: "admin@fleetcare.dev",
    password: "AdminFleetCare2026",
    name: "Admin plateforme",
  },
  pending: {
    email: "en-attente@fleetcare.dev",
    password: "AttenteFleetCare2026",
    name: "Awa Koné",
  },
  manager: {
    email: "gestionnaire@fleetcare.dev",
    password: "GestionnaireFleetCare2026",
    name: "Yves Kouassi",
  },
} as const;

async function main() {
  await prisma.user.upsert({
    where: { email: ACCOUNTS.admin.email },
    update: {
      name: ACCOUNTS.admin.name,
      role: "ADMIN_PLATEFORME",
      companyId: null,
    },
    create: {
      email: ACCOUNTS.admin.email,
      name: ACCOUNTS.admin.name,
      passwordHash: await hashPassword(ACCOUNTS.admin.password),
      role: "ADMIN_PLATEFORME",
    },
  });

  await ensureCompany({
    name: "Société Pendante SARL",
    city: "Bouaké",
    phone: "+225 07 00 00 01",
    email: ACCOUNTS.pending.email,
    managerName: ACCOUNTS.pending.name,
    password: ACCOUNTS.pending.password,
    status: "EN_ATTENTE",
    planName: null,
    subscriptionStatus: "AUCUN",
    amountXof: null,
  });

  const lagunes = await ensureCompany({
    name: "Transports Lagunes",
    city: "Abidjan",
    phone: "+225 07 00 00 02",
    email: ACCOUNTS.manager.email,
    managerName: ACCOUNTS.manager.name,
    password: ACCOUNTS.manager.password,
    status: "VALIDEE",
    planName: "Essentiel",
    subscriptionStatus: "ACTIF",
    amountXof: 25000,
  });

  const hilux = await ensureVehicle(lagunes, {
    label: "Hilux chantier",
    registration: "AA-452-CI",
    brand: "Toyota",
    model: "Hilux",
    year: 2021,
    currentKm: 45200,
    currentHours: 860,
    kmReadings: [42000, 45200],
    hourReadings: [700, 860],
  });

  const sprinter = await ensureVehicle(lagunes, {
    label: "Fourgon livraisons",
    registration: "BB-118-CI",
    brand: "Mercedes",
    model: "Sprinter",
    year: 2019,
    currentKm: 80340,
    currentHours: 2100,
    kmReadings: [76000, 80340],
    hourReadings: [1800, 2100],
  });

  await ensureRule(lagunes, hilux, {
    name: "Vidange Hilux",
    metric: "KILOMETRES",
    threshold: 48000,
  });
  await ensureRule(lagunes, sprinter, {
    name: "Révision horaire Sprinter",
    metric: "HEURES",
    threshold: 2500,
  });

  await ensureMaintenance(lagunes, hilux);
  await ensurePart(lagunes);
  await ensureDeadline(lagunes, hilux);
}

async function ensureCompany(input: {
  name: string;
  city: string;
  phone: string;
  email: string;
  managerName: string;
  password: string;
  status: CompanyStatus;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus;
  amountXof: number | null;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + 30);

  if (existing?.companyId) {
    await prisma.company.update({
      where: { id: existing.companyId },
      data: {
        name: input.name,
        city: input.city,
        phone: input.phone,
        email: input.email,
        status: input.status,
      },
    });
    await prisma.subscription.upsert({
      where: { companyId: existing.companyId },
      create: {
        companyId: existing.companyId,
        status: input.subscriptionStatus,
        planName: input.planName,
        amountXof: input.amountXof,
        periodStart,
        periodEnd,
      },
      update: {
        status: input.subscriptionStatus,
        planName: input.planName,
        amountXof: input.amountXof,
      },
    });
    return existing.companyId;
  }

  const company = await prisma.company.create({
    data: {
      name: input.name,
      city: input.city,
      phone: input.phone,
      email: input.email,
      status: input.status,
      users: {
        create: {
          email: input.email,
          name: input.managerName,
          passwordHash: await hashPassword(input.password),
          role: "GESTIONNAIRE",
        },
      },
      subscription: {
        create: {
          status: input.subscriptionStatus,
          planName: input.planName,
          amountXof: input.amountXof,
          periodStart,
          periodEnd,
        },
      },
    },
  });
  return company.id;
}

async function ensureVehicle(
  companyId: string,
  input: {
    label: string;
    registration: string;
    brand: string;
    model: string;
    year: number;
    currentKm: number;
    currentHours: number;
    kmReadings: number[];
    hourReadings: number[];
  },
) {
  const vehicle = await prisma.vehicle.upsert({
    where: { companyId_registration: { companyId, registration: input.registration } },
    update: {
      label: input.label,
      currentKm: input.currentKm,
      currentHours: input.currentHours,
    },
    create: {
      companyId,
      label: input.label,
      registration: input.registration,
      brand: input.brand,
      model: input.model,
      year: input.year,
      currentKm: input.currentKm,
      currentHours: input.currentHours,
    },
  });

  const readingCount = await prisma.meterReading.count({ where: { vehicleId: vehicle.id } });
  if (readingCount === 0) {
    await prisma.meterReading.createMany({
      data: [
        ...input.kmReadings.map((value) => ({
          companyId,
          vehicleId: vehicle.id,
          metric: "KILOMETRES" as const,
          value,
          note: "Historique de démonstration",
        })),
        ...input.hourReadings.map((value) => ({
          companyId,
          vehicleId: vehicle.id,
          metric: "HEURES" as const,
          value,
          note: "Historique de démonstration",
        })),
      ],
    });
  }
  return vehicle.id;
}

async function ensureRule(
  companyId: string,
  vehicleId: string,
  input: { name: string; metric: "KILOMETRES" | "HEURES"; threshold: number },
) {
  const existing = await prisma.alertRule.findFirst({
    where: { companyId, vehicleId, name: input.name },
  });
  if (existing) return;
  await prisma.alertRule.create({
    data: {
      companyId,
      vehicleId,
      name: input.name,
      metric: input.metric,
      threshold: input.threshold,
      active: true,
    },
  });
}

async function ensureMaintenance(companyId: string, vehicleId: string) {
  const existing = await prisma.maintenanceLog.findFirst({
    where: { companyId, vehicleId, title: "Vidange précédente" },
  });
  if (existing) return;
  await prisma.maintenanceLog.create({
    data: {
      companyId,
      vehicleId,
      kind: "PREVENTIVE",
      title: "Vidange précédente",
      description: "Vidange de démonstration, visible dans le carnet d’entretien.",
      performedAt: new Date("2026-06-12T09:00:00.000Z"),
      odometerKm: 42000,
      costXof: 75000,
    },
  });
}

async function ensurePart(companyId: string) {
  const part = await prisma.sparePart.upsert({
    where: { companyId_sku: { companyId, sku: "FIL-HUILE-01" } },
    update: {},
    create: {
      companyId,
      sku: "FIL-HUILE-01",
      name: "Filtre à huile",
      quantity: 4,
      minQuantity: 2,
      unitCostXof: 8500,
    },
  });
  const movement = await prisma.stockMovement.findFirst({ where: { sparePartId: part.id } });
  if (!movement) {
    await prisma.stockMovement.create({
      data: {
        companyId,
        sparePartId: part.id,
        kind: "ENTREE",
        quantity: 4,
        note: "Stock initial de démonstration",
      },
    });
  }

  const low = await prisma.sparePart.upsert({
    where: { companyId_sku: { companyId, sku: "PLQ-AV-01" } },
    update: {},
    create: {
      companyId,
      sku: "PLQ-AV-01",
      name: "Plaquettes avant",
      quantity: 1,
      minQuantity: 4,
      unitCostXof: 22000,
    },
  });
  const lowMovement = await prisma.stockMovement.findFirst({ where: { sparePartId: low.id } });
  if (!lowMovement) {
    await prisma.stockMovement.create({
      data: {
        companyId,
        sparePartId: low.id,
        kind: "ENTREE",
        quantity: 1,
        note: "Stock sous le seuil, pour la démonstration",
      },
    });
  }
}

async function ensureDeadline(companyId: string, vehicleId: string) {
  const existing = await prisma.deadline.findFirst({
    where: { companyId, vehicleId, label: "Assurance Hilux" },
  });
  if (!existing) {
    const dueOn = new Date();
    dueOn.setUTCDate(dueOn.getUTCDate() + 40);
    await prisma.deadline.create({
      data: {
        companyId,
        vehicleId,
        kind: "ASSURANCE",
        label: "Assurance Hilux",
        dueOn,
        status: "A_VENIR",
        costXof: 180000,
      },
    });
  }

  const inspection = await prisma.deadline.findFirst({
    where: { companyId, vehicleId, label: "Visite technique Hilux" },
  });
  if (!inspection) {
    const soon = new Date();
    soon.setUTCDate(soon.getUTCDate() + 12);
    await prisma.deadline.create({
      data: {
        companyId,
        vehicleId,
        kind: "VISITE_TECHNIQUE",
        label: "Visite technique Hilux",
        dueOn: soon,
        status: "A_VENIR",
        costXof: 25000,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
