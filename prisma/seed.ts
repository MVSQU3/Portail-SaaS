import {
  PrismaClient,
  type CompanyStatus,
  type DeadlineKind,
  type MaintenanceKind,
  type MeterMetric,
  type StockMovementKind,
  type SubscriptionStatus,
} from "@prisma/client";
import { buildAlertCopy } from "../src/lib/alerts";
import { classifyDeadline } from "../src/lib/notices";
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
  sanPedro: {
    email: "sanpedro@fleetcare.dev",
    password: "SanPedroFleetCare2026",
    name: "Mariam Touré",
  },
} as const;

type ReadingPoint = { value: number; recordedAt: string; note?: string };

type VehicleSeed = {
  label: string;
  registration: string;
  brand: string;
  model: string;
  year: number;
  currentKm: number;
  currentHours: number;
  kmReadings: ReadingPoint[];
  hourReadings: ReadingPoint[];
};

type RuleSeed = {
  registration: string;
  name: string;
  metric: MeterMetric;
  threshold: number;
  /** Valeur du relevé qui a déjà franchi le seuil. Absent : le seuil reste à déclencher. */
  crossedValue?: number;
};

type MaintenanceSeed = {
  registration: string;
  kind: MaintenanceKind;
  title: string;
  description: string;
  performedAt: string;
  odometerKm?: number;
  hours?: number;
  costXof: number;
};

type MovementSeed = { kind: StockMovementKind; quantity: number; note: string };

type PartSeed = {
  sku: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unitCostXof: number;
  movements: MovementSeed[];
};

type DeadlineSeed = {
  registration: string;
  kind: DeadlineKind;
  label: string;
  dueInDays: number;
  costXof: number;
};

type FleetSeed = {
  vehicles: VehicleSeed[];
  rules: RuleSeed[];
  maintenance: MaintenanceSeed[];
  parts: PartSeed[];
  deadlines: DeadlineSeed[];
};

const LAGUNES: FleetSeed = {
  vehicles: [
    {
      label: "Hilux chantier",
      registration: "AA-452-CI",
      brand: "Toyota",
      model: "Hilux",
      year: 2021,
      currentKm: 45200,
      currentHours: 860,
      kmReadings: [
        { value: 38400, recordedAt: "2025-11-04T08:00:00.000Z" },
        { value: 42000, recordedAt: "2026-03-18T08:15:00.000Z" },
        { value: 45200, recordedAt: "2026-08-02T09:00:00.000Z", note: "Dernier relevé de démonstration" },
      ],
      hourReadings: [
        { value: 640, recordedAt: "2025-11-04T08:05:00.000Z" },
        { value: 700, recordedAt: "2026-03-18T08:20:00.000Z" },
        { value: 860, recordedAt: "2026-08-02T09:05:00.000Z", note: "Dernier relevé de démonstration" },
      ],
    },
    {
      label: "Fourgon livraisons",
      registration: "BB-118-CI",
      brand: "Mercedes",
      model: "Sprinter",
      year: 2019,
      currentKm: 80340,
      currentHours: 2100,
      kmReadings: [
        { value: 71200, recordedAt: "2025-08-20T07:30:00.000Z" },
        { value: 76000, recordedAt: "2026-01-15T07:45:00.000Z" },
        { value: 80340, recordedAt: "2026-07-28T10:00:00.000Z", note: "Dernier relevé de démonstration" },
      ],
      hourReadings: [
        { value: 1500, recordedAt: "2025-08-20T07:35:00.000Z" },
        { value: 1800, recordedAt: "2026-01-15T07:50:00.000Z" },
        { value: 2100, recordedAt: "2026-07-28T10:05:00.000Z", note: "Dernier relevé de démonstration" },
      ],
    },
    {
      label: "Bus personnel",
      registration: "CC-774-CI",
      brand: "Toyota",
      model: "Coaster",
      year: 2018,
      currentKm: 128400,
      currentHours: 3240,
      kmReadings: [
        { value: 98000, recordedAt: "2025-06-10T06:40:00.000Z" },
        { value: 119400, recordedAt: "2026-01-22T06:50:00.000Z" },
        {
          value: 128400,
          recordedAt: "2026-08-22T11:10:00.000Z",
          note: "Relevé ayant franchi le seuil",
        },
      ],
      hourReadings: [
        { value: 2800, recordedAt: "2025-06-10T06:45:00.000Z" },
        { value: 3050, recordedAt: "2026-01-22T06:55:00.000Z" },
        { value: 3240, recordedAt: "2026-08-22T11:15:00.000Z", note: "Dernier relevé de démonstration" },
      ],
    },
    {
      label: "Pickup pièces",
      registration: "DD-203-CI",
      brand: "Nissan",
      model: "Navara",
      year: 2022,
      currentKm: 31250,
      currentHours: 540,
      kmReadings: [
        { value: 22100, recordedAt: "2025-12-01T09:20:00.000Z" },
        { value: 27400, recordedAt: "2026-04-16T09:30:00.000Z" },
        { value: 31250, recordedAt: "2026-09-05T08:40:00.000Z", note: "Dernier relevé de démonstration" },
      ],
      hourReadings: [
        { value: 320, recordedAt: "2025-12-01T09:25:00.000Z" },
        { value: 450, recordedAt: "2026-04-16T09:35:00.000Z" },
        { value: 540, recordedAt: "2026-09-05T08:45:00.000Z", note: "Dernier relevé de démonstration" },
      ],
    },
  ],
  rules: [
    { registration: "AA-452-CI", name: "Vidange Hilux", metric: "KILOMETRES", threshold: 48000 },
    { registration: "BB-118-CI", name: "Révision horaire Sprinter", metric: "HEURES", threshold: 2500 },
    {
      registration: "CC-774-CI",
      name: "Vidange bus personnel",
      metric: "KILOMETRES",
      threshold: 125000,
      crossedValue: 128400,
    },
    { registration: "CC-774-CI", name: "Contrôle horaire bus", metric: "HEURES", threshold: 3500 },
    { registration: "DD-203-CI", name: "Vidange Navara", metric: "KILOMETRES", threshold: 35000 },
  ],
  maintenance: [
    {
      registration: "AA-452-CI",
      kind: "PREVENTIVE",
      title: "Vidange précédente",
      description: "Vidange de démonstration, visible dans le carnet d’entretien.",
      performedAt: "2026-06-12T09:00:00.000Z",
      odometerKm: 42000,
      costXof: 75000,
    },
    {
      registration: "AA-452-CI",
      kind: "CORRECTIVE",
      title: "Remplacement des plaquettes avant",
      description: "Plaquettes avant usées, remplacées au garage de Marcory.",
      performedAt: "2026-07-03T14:30:00.000Z",
      odometerKm: 43800,
      costXof: 45000,
    },
    {
      registration: "BB-118-CI",
      kind: "REVISION",
      title: "Révision des 80 000 km",
      description: "Révision du fourgon de livraisons, filtres et contrôle des freins.",
      performedAt: "2026-07-28T10:30:00.000Z",
      odometerKm: 80340,
      hours: 2100,
      costXof: 185000,
    },
    {
      registration: "CC-774-CI",
      kind: "PREVENTIVE",
      title: "Vidange moteur Coaster",
      description: "Vidange du bus personnel après franchissement du seuil kilométrique.",
      performedAt: "2026-08-22T15:00:00.000Z",
      odometerKm: 128400,
      hours: 3240,
      costXof: 95000,
    },
    {
      registration: "DD-203-CI",
      kind: "CORRECTIVE",
      title: "Remplacement de la batterie",
      description: "Batterie 12 V du pickup pièces, en panne au départ de Yopougon.",
      performedAt: "2026-04-02T11:00:00.000Z",
      odometerKm: 27400,
      costXof: 65000,
    },
  ],
  parts: [
    {
      sku: "FIL-HUILE-01",
      name: "Filtre à huile",
      quantity: 4,
      minQuantity: 2,
      unitCostXof: 8500,
      movements: [
        { kind: "ENTREE", quantity: 6, note: "Réception fournisseur, Abidjan" },
        { kind: "SORTIE", quantity: 2, note: "Pose sur le Hilux chantier" },
      ],
    },
    {
      sku: "PLQ-AV-01",
      name: "Plaquettes avant",
      quantity: 1,
      minQuantity: 4,
      unitCostXof: 22000,
      movements: [
        { kind: "ENTREE", quantity: 4, note: "Stock initial de démonstration" },
        { kind: "SORTIE", quantity: 3, note: "Pose sur le Hilux, stock sous le seuil" },
      ],
    },
    {
      sku: "FLT-AIR-02",
      name: "Filtre à air Sprinter",
      quantity: 7,
      minQuantity: 3,
      unitCostXof: 6500,
      movements: [
        { kind: "ENTREE", quantity: 10, note: "Réception magasin de Marcory" },
        { kind: "SORTIE", quantity: 3, note: "Révision du fourgon livraisons" },
      ],
    },
    {
      sku: "BAT-NAV-01",
      name: "Batterie Navara 12 V",
      quantity: 2,
      minQuantity: 1,
      unitCostXof: 48000,
      movements: [{ kind: "ENTREE", quantity: 2, note: "Stock initial de démonstration" }],
    },
  ],
  deadlines: [
    { registration: "AA-452-CI", kind: "ASSURANCE", label: "Assurance Hilux", dueInDays: 40, costXof: 180000 },
    {
      registration: "AA-452-CI",
      kind: "VISITE_TECHNIQUE",
      label: "Visite technique Hilux",
      dueInDays: 12,
      costXof: 25000,
    },
    { registration: "BB-118-CI", kind: "ASSURANCE", label: "Assurance Sprinter", dueInDays: 65, costXof: 240000 },
    {
      registration: "BB-118-CI",
      kind: "VISITE_TECHNIQUE",
      label: "Visite technique Sprinter",
      dueInDays: 9,
      costXof: 30000,
    },
    {
      registration: "CC-774-CI",
      kind: "ASSURANCE",
      label: "Assurance bus personnel",
      dueInDays: 100,
      costXof: 420000,
    },
    {
      registration: "CC-774-CI",
      kind: "VISITE_TECHNIQUE",
      label: "Visite technique bus",
      dueInDays: 18,
      costXof: 35000,
    },
    { registration: "DD-203-CI", kind: "ASSURANCE", label: "Assurance Navara", dueInDays: -4, costXof: 145000 },
    {
      registration: "DD-203-CI",
      kind: "VISITE_TECHNIQUE",
      label: "Visite technique Navara",
      dueInDays: 50,
      costXof: 25000,
    },
  ],
};

const SAN_PEDRO: FleetSeed = {
  vehicles: [
    {
      label: "Tracteur portuaire",
      registration: "EE-901-CI",
      brand: "Renault",
      model: "Kerax",
      year: 2017,
      currentKm: 186200,
      currentHours: 6200,
      kmReadings: [
        { value: 162000, recordedAt: "2025-10-12T07:00:00.000Z" },
        { value: 176500, recordedAt: "2026-03-02T07:20:00.000Z" },
        {
          value: 186200,
          recordedAt: "2026-09-01T08:10:00.000Z",
          note: "Relevé ayant franchi le seuil",
        },
      ],
      hourReadings: [
        { value: 5100, recordedAt: "2025-10-12T07:05:00.000Z" },
        { value: 5750, recordedAt: "2026-03-02T07:25:00.000Z" },
        { value: 6200, recordedAt: "2026-09-01T08:15:00.000Z", note: "Dernier relevé de démonstration" },
      ],
    },
    {
      label: "Camion cacao",
      registration: "FF-334-CI",
      brand: "Isuzu",
      model: "FVR",
      year: 2020,
      currentKm: 67450,
      currentHours: 1980,
      kmReadings: [
        { value: 51200, recordedAt: "2025-09-18T08:00:00.000Z" },
        { value: 64000, recordedAt: "2026-02-09T08:20:00.000Z" },
        { value: 67450, recordedAt: "2026-08-30T09:40:00.000Z", note: "Dernier relevé de démonstration" },
      ],
      hourReadings: [
        { value: 1400, recordedAt: "2025-09-18T08:05:00.000Z" },
        { value: 1720, recordedAt: "2026-02-09T08:25:00.000Z" },
        { value: 1980, recordedAt: "2026-08-30T09:45:00.000Z", note: "Dernier relevé de démonstration" },
      ],
    },
    {
      label: "Benne quai",
      registration: "GG-560-CI",
      brand: "Mitsubishi",
      model: "Fuso",
      year: 2016,
      currentKm: 142800,
      currentHours: 3800,
      kmReadings: [
        { value: 121000, recordedAt: "2025-07-14T06:30:00.000Z" },
        { value: 134200, recordedAt: "2026-01-08T06:45:00.000Z" },
        { value: 142800, recordedAt: "2026-08-20T13:00:00.000Z", note: "Dernier relevé de démonstration" },
      ],
      hourReadings: [
        { value: 3100, recordedAt: "2025-07-14T06:35:00.000Z" },
        { value: 3520, recordedAt: "2026-01-08T06:50:00.000Z" },
        { value: 3800, recordedAt: "2026-08-20T13:05:00.000Z", note: "Dernier relevé de démonstration" },
      ],
    },
    {
      label: "Pick-up quai",
      registration: "HH-088-CI",
      brand: "Ford",
      model: "Ranger",
      year: 2023,
      currentKm: 18420,
      currentHours: 410,
      kmReadings: [
        { value: 8200, recordedAt: "2025-12-11T10:00:00.000Z" },
        { value: 14100, recordedAt: "2026-05-19T10:15:00.000Z" },
        { value: 18420, recordedAt: "2026-09-12T09:10:00.000Z", note: "Dernier relevé de démonstration" },
      ],
      hourReadings: [
        { value: 180, recordedAt: "2025-12-11T10:05:00.000Z" },
        { value: 300, recordedAt: "2026-05-19T10:20:00.000Z" },
        { value: 410, recordedAt: "2026-09-12T09:15:00.000Z", note: "Dernier relevé de démonstration" },
      ],
    },
  ],
  rules: [
    {
      registration: "EE-901-CI",
      name: "Révision tracteur portuaire",
      metric: "KILOMETRES",
      threshold: 180000,
      crossedValue: 186200,
    },
    { registration: "EE-901-CI", name: "Graissage horaire Kerax", metric: "HEURES", threshold: 6500 },
    { registration: "FF-334-CI", name: "Vidange camion cacao", metric: "KILOMETRES", threshold: 70000 },
    { registration: "GG-560-CI", name: "Révision horaire benne", metric: "HEURES", threshold: 4000 },
    { registration: "HH-088-CI", name: "Vidange pick-up quai", metric: "KILOMETRES", threshold: 20000 },
  ],
  maintenance: [
    {
      registration: "EE-901-CI",
      kind: "REVISION",
      title: "Révision générale du tracteur",
      description: "Révision du Kerax à l’atelier du port de San-Pédro.",
      performedAt: "2026-03-02T16:00:00.000Z",
      odometerKm: 176500,
      hours: 5750,
      costXof: 420000,
    },
    {
      registration: "EE-901-CI",
      kind: "CORRECTIVE",
      title: "Remplacement de l’embrayage",
      description: "Embrayage du tracteur portuaire, après des manœuvres sur le quai.",
      performedAt: "2026-07-28T09:30:00.000Z",
      odometerKm: 182000,
      hours: 6050,
      costXof: 310000,
    },
    {
      registration: "FF-334-CI",
      kind: "PREVENTIVE",
      title: "Vidange camion cacao",
      description: "Vidange avant la prochaine saison de collecte vers Soubré.",
      performedAt: "2026-06-01T08:00:00.000Z",
      odometerKm: 64000,
      hours: 1720,
      costXof: 88000,
    },
    {
      registration: "GG-560-CI",
      kind: "CORRECTIVE",
      title: "Reprise de la benne",
      description: "Soudure de la benne après un choc au chargement du quai.",
      performedAt: "2026-08-20T15:30:00.000Z",
      odometerKm: 142800,
      hours: 3800,
      costXof: 150000,
    },
    {
      registration: "HH-088-CI",
      kind: "PREVENTIVE",
      title: "Contrôle des 15 000 km",
      description: "Contrôle du pick-up quai, filtres et niveaux.",
      performedAt: "2026-09-01T11:00:00.000Z",
      odometerKm: 15000,
      hours: 340,
      costXof: 35000,
    },
  ],
  parts: [
    {
      sku: "FH-KERAX-01",
      name: "Filtre à huile Kerax",
      quantity: 6,
      minQuantity: 2,
      unitCostXof: 12000,
      movements: [
        { kind: "ENTREE", quantity: 8, note: "Réception magasin du port" },
        { kind: "SORTIE", quantity: 2, note: "Vidange du tracteur portuaire" },
      ],
    },
    {
      sku: "PLQ-FUSO-01",
      name: "Plaquettes Fuso",
      quantity: 1,
      minQuantity: 4,
      unitCostXof: 28000,
      movements: [
        { kind: "ENTREE", quantity: 4, note: "Stock initial de démonstration" },
        { kind: "SORTIE", quantity: 3, note: "Pose sur la benne, stock sous le seuil" },
      ],
    },
    {
      sku: "INJ-ISZ-01",
      name: "Jeu d’injecteurs Isuzu",
      quantity: 3,
      minQuantity: 1,
      unitCostXof: 175000,
      movements: [{ kind: "ENTREE", quantity: 3, note: "Commande atelier San-Pédro" }],
    },
    {
      sku: "PNEU-315-01",
      name: "Pneu 315/80 R22.5",
      quantity: 2,
      minQuantity: 6,
      unitCostXof: 185000,
      movements: [
        { kind: "ENTREE", quantity: 6, note: "Réception pneus poids lourd" },
        { kind: "SORTIE", quantity: 4, note: "Montage sur le camion cacao, stock sous le seuil" },
      ],
    },
  ],
  deadlines: [
    {
      registration: "EE-901-CI",
      kind: "ASSURANCE",
      label: "Assurance tracteur portuaire",
      dueInDays: 14,
      costXof: 380000,
    },
    {
      registration: "EE-901-CI",
      kind: "VISITE_TECHNIQUE",
      label: "Visite technique tracteur",
      dueInDays: 110,
      costXof: 45000,
    },
    {
      registration: "FF-334-CI",
      kind: "VISITE_TECHNIQUE",
      label: "Visite technique camion cacao",
      dueInDays: 6,
      costXof: 35000,
    },
    {
      registration: "FF-334-CI",
      kind: "ASSURANCE",
      label: "Assurance camion cacao",
      dueInDays: 48,
      costXof: 260000,
    },
    { registration: "GG-560-CI", kind: "ASSURANCE", label: "Assurance benne quai", dueInDays: -6, costXof: 210000 },
    {
      registration: "GG-560-CI",
      kind: "VISITE_TECHNIQUE",
      label: "Visite technique benne",
      dueInDays: 75,
      costXof: 40000,
    },
    {
      registration: "HH-088-CI",
      kind: "VISITE_TECHNIQUE",
      label: "Visite technique pick-up quai",
      dueInDays: 22,
      costXof: 25000,
    },
    {
      registration: "HH-088-CI",
      kind: "ASSURANCE",
      label: "Assurance pick-up quai",
      dueInDays: 130,
      costXof: 155000,
    },
  ],
};

function assertFleet(label: string, fleet: FleetSeed) {
  const registrations = new Set<string>();
  for (const vehicle of fleet.vehicles) {
    if (registrations.has(vehicle.registration)) {
      throw new Error(`Immatriculation en double (${label}) : ${vehicle.registration}`);
    }
    registrations.add(vehicle.registration);
    const maxKm = Math.max(...vehicle.kmReadings.map((reading) => reading.value));
    const maxHours = Math.max(...vehicle.hourReadings.map((reading) => reading.value));
    if (maxKm !== vehicle.currentKm || maxHours !== vehicle.currentHours) {
      throw new Error(`Compteur incohérent (${label}) : ${vehicle.registration}`);
    }
  }

  for (const part of fleet.parts) {
    const net = part.movements.reduce((sum, movement) => {
      return movement.kind === "SORTIE" ? sum - movement.quantity : sum + movement.quantity;
    }, 0);
    if (net !== part.quantity) {
      throw new Error(`Stock incohérent (${label}) : ${part.sku}`);
    }
  }
  if (!fleet.parts.some((part) => part.quantity < part.minQuantity)) {
    throw new Error(`Aucune pièce sous le seuil (${label}).`);
  }

  const soon = fleet.deadlines.some((deadline) => deadline.dueInDays >= 0 && deadline.dueInDays <= 30);
  const later = fleet.deadlines.some((deadline) => deadline.dueInDays > 30);
  if (!soon || !later) {
    throw new Error(`Échéances incomplètes (${label}).`);
  }

  if (!fleet.rules.some((rule) => rule.crossedValue != null) || !fleet.rules.some((rule) => rule.crossedValue == null)) {
    throw new Error(`Règles d’alerte incomplètes (${label}).`);
  }

  for (const rule of fleet.rules) {
    const vehicle = fleet.vehicles.find((item) => item.registration === rule.registration);
    if (!vehicle) throw new Error(`Règle sans véhicule (${label}) : ${rule.name}`);
    if (rule.crossedValue == null) {
      const current = rule.metric === "KILOMETRES" ? vehicle.currentKm : vehicle.currentHours;
      if (current >= rule.threshold) {
        throw new Error(`Seuil déjà atteint sans alerte (${label}) : ${rule.name}`);
      }
      continue;
    }
    const points = rule.metric === "KILOMETRES" ? vehicle.kmReadings : vehicle.hourReadings;
    const index = points.findIndex((point) => point.value === rule.crossedValue);
    const previous = index > 0 ? points[index - 1] : undefined;
    if (!previous || previous.value >= rule.threshold || rule.crossedValue < rule.threshold) {
      throw new Error(`Franchissement incohérent (${label}) : ${rule.name}`);
    }
  }

  for (const item of [...fleet.maintenance, ...fleet.deadlines]) {
    if (!registrations.has(item.registration)) {
      throw new Error(`Véhicule manquant (${label}) : ${item.registration}`);
    }
  }
}

async function main() {
  assertFleet("Transports Lagunes", LAGUNES);
  assertFleet("San-Pédro Logistique", SAN_PEDRO);

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

  const sanPedro = await ensureCompany({
    name: "San-Pédro Logistique",
    city: "San-Pédro",
    phone: "+225 07 00 00 03",
    email: ACCOUNTS.sanPedro.email,
    managerName: ACCOUNTS.sanPedro.name,
    password: ACCOUNTS.sanPedro.password,
    status: "VALIDEE",
    planName: "Atelier",
    subscriptionStatus: "ACTIF",
    amountXof: 45000,
  });

  await seedFleet(lagunes, LAGUNES);
  await seedFleet(sanPedro, SAN_PEDRO);
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
    await prisma.user.update({
      where: { email: input.email },
      data: { name: input.managerName, role: "GESTIONNAIRE" },
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

async function seedFleet(companyId: string, fleet: FleetSeed) {
  const vehicleIds = new Map<string, string>();
  for (const vehicle of fleet.vehicles) {
    vehicleIds.set(vehicle.registration, await ensureVehicle(companyId, vehicle));
  }

  for (const rule of fleet.rules) {
    const vehicleId = requiredVehicleId(vehicleIds, rule.registration);
    const vehicle = fleet.vehicles.find((item) => item.registration === rule.registration);
    if (!vehicle) continue;
    const ruleId = await ensureRule(companyId, vehicleId, rule);
    if (rule.crossedValue != null) {
      await ensureOpenAlert({
        companyId,
        vehicleId,
        ruleId,
        vehicleLabel: vehicle.label,
        registration: vehicle.registration,
        ruleName: rule.name,
        metric: rule.metric,
        threshold: rule.threshold,
        value: rule.crossedValue,
      });
    }
  }

  for (const entry of fleet.maintenance) {
    await ensureMaintenance(companyId, requiredVehicleId(vehicleIds, entry.registration), entry);
  }
  for (const part of fleet.parts) {
    await ensurePart(companyId, part);
  }
  for (const deadline of fleet.deadlines) {
    await ensureDeadline(companyId, requiredVehicleId(vehicleIds, deadline.registration), deadline);
  }
}

function requiredVehicleId(ids: Map<string, string>, registration: string): string {
  const id = ids.get(registration);
  if (!id) throw new Error(`Immatriculation inconnue dans le seed : ${registration}`);
  return id;
}

async function ensureVehicle(companyId: string, input: VehicleSeed) {
  const vehicle = await prisma.vehicle.upsert({
    where: { companyId_registration: { companyId, registration: input.registration } },
    update: {
      label: input.label,
      brand: input.brand,
      model: input.model,
      year: input.year,
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

  const readingCount = await prisma.meterReading.count({ where: { vehicleId: vehicle.id, companyId } });
  if (readingCount === 0) {
    const points = [
      ...input.kmReadings.map((reading) => ({ ...reading, metric: "KILOMETRES" as const })),
      ...input.hourReadings.map((reading) => ({ ...reading, metric: "HEURES" as const })),
    ];
    await prisma.meterReading.createMany({
      data: points.map((reading) => ({
        companyId,
        vehicleId: vehicle.id,
        metric: reading.metric,
        value: reading.value,
        recordedAt: new Date(reading.recordedAt),
        note: reading.note ?? "Historique de démonstration",
      })),
    });
  }
  return vehicle.id;
}

async function ensureRule(
  companyId: string,
  vehicleId: string,
  input: { name: string; metric: MeterMetric; threshold: number },
) {
  const existing = await prisma.alertRule.findFirst({
    where: { companyId, vehicleId, name: input.name },
  });
  if (existing) {
    await prisma.alertRule.update({
      where: { id: existing.id },
      data: { metric: input.metric, threshold: input.threshold, active: true },
    });
    return existing.id;
  }
  const created = await prisma.alertRule.create({
    data: {
      companyId,
      vehicleId,
      name: input.name,
      metric: input.metric,
      threshold: input.threshold,
      active: true,
    },
  });
  return created.id;
}

async function ensureOpenAlert(input: {
  companyId: string;
  vehicleId: string;
  ruleId: string;
  vehicleLabel: string;
  registration: string;
  ruleName: string;
  metric: MeterMetric;
  threshold: number;
  value: number;
}) {
  const existing = await prisma.alert.findFirst({
    where: { companyId: input.companyId, vehicleId: input.vehicleId, ruleId: input.ruleId },
  });
  if (existing) return;

  const reading = await prisma.meterReading.findFirst({
    where: {
      companyId: input.companyId,
      vehicleId: input.vehicleId,
      metric: input.metric,
      value: input.value,
    },
    orderBy: { recordedAt: "desc" },
  });
  const copy = buildAlertCopy({
    ruleName: input.ruleName,
    vehicleLabel: input.vehicleLabel,
    registration: input.registration,
    metric: input.metric,
    value: input.value,
    threshold: input.threshold,
  });
  await prisma.alert.create({
    data: {
      companyId: input.companyId,
      vehicleId: input.vehicleId,
      ruleId: input.ruleId,
      readingId: reading?.id,
      title: copy.title,
      message: copy.message,
      status: "OUVERTE",
    },
  });
}

async function ensureMaintenance(
  companyId: string,
  vehicleId: string,
  input: Omit<MaintenanceSeed, "registration">,
) {
  const existing = await prisma.maintenanceLog.findFirst({
    where: { companyId, vehicleId, title: input.title },
  });
  if (existing) return;
  await prisma.maintenanceLog.create({
    data: {
      companyId,
      vehicleId,
      kind: input.kind,
      title: input.title,
      description: input.description,
      performedAt: new Date(input.performedAt),
      odometerKm: input.odometerKm,
      hours: input.hours,
      costXof: input.costXof,
    },
  });
}

async function ensurePart(companyId: string, input: PartSeed) {
  const part = await prisma.sparePart.upsert({
    where: { companyId_sku: { companyId, sku: input.sku } },
    update: {},
    create: {
      companyId,
      sku: input.sku,
      name: input.name,
      quantity: input.quantity,
      minQuantity: input.minQuantity,
      unitCostXof: input.unitCostXof,
    },
  });
  const movement = await prisma.stockMovement.findFirst({
    where: { companyId, sparePartId: part.id },
  });
  if (movement) return;
  await prisma.stockMovement.createMany({
    data: input.movements.map((item) => ({
      companyId,
      sparePartId: part.id,
      kind: item.kind,
      quantity: item.quantity,
      note: item.note,
    })),
  });
}

function utcDayOffset(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function ensureDeadline(companyId: string, vehicleId: string, input: Omit<DeadlineSeed, "registration">) {
  const existing = await prisma.deadline.findFirst({
    where: { companyId, vehicleId, label: input.label },
  });
  if (existing) return;
  const dueOn = utcDayOffset(input.dueInDays);
  await prisma.deadline.create({
    data: {
      companyId,
      vehicleId,
      kind: input.kind,
      label: input.label,
      dueOn,
      status: classifyDeadline(dueOn, new Date(), false),
      costXof: input.costXof,
    },
  });
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
