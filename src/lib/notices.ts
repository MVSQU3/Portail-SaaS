export const DEADLINE_SOON_DAYS = 30;

export type DeadlineState = "A_VENIR" | "PROCHE" | "DEPASSEE" | "TRAITEE";
export type NoticeStatus = "OUVERTE" | "LUE" | "RESOLUE";
export type NoticeKind = "STOCK_BAS" | "ECHEANCE";

export type PartSnapshot = {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
};

export type DeadlineSnapshot = {
  id: string;
  companyId: string;
  label: string;
  kind: "ASSURANCE" | "VISITE_TECHNIQUE";
  dueOn: Date;
  treated: boolean;
  vehicleLabel: string | null;
};

export type NoticeSnapshot = {
  id: string;
  companyId: string;
  dedupeKey: string;
  status: NoticeStatus;
  kind: NoticeKind;
  severity: string;
  sparePartId: string | null;
  deadlineId: string | null;
};

export type NoticeDraft = {
  dedupeKey: string;
  kind: NoticeKind;
  severity: string;
  title: string;
  message: string;
  emailSubject: string;
  emailBody: string;
  sparePartId: string | null;
  deadlineId: string | null;
};

export type NoticePlan = {
  create: NoticeDraft[];
  reopen: Array<NoticeDraft & { id: string }>;
  resolveIds: string[];
  deadlineStatuses: Array<{ id: string; status: DeadlineState }>;
};

export function utcDayNumber(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

export function daysUntil(dueOn: Date, today: Date): number {
  return Math.round((utcDayNumber(dueOn) - utcDayNumber(today)) / 86_400_000);
}

export function classifyDeadline(dueOn: Date, today: Date, treated: boolean): DeadlineState {
  if (treated) return "TRAITEE";
  const delta = daysUntil(dueOn, today);
  if (delta < 0) return "DEPASSEE";
  if (delta <= DEADLINE_SOON_DAYS) return "PROCHE";
  return "A_VENIR";
}

export function isLowStock(quantity: number, minQuantity: number): boolean {
  return Number.isInteger(quantity) && Number.isInteger(minQuantity) && minQuantity > 0 && quantity <= minQuantity;
}

export function buildLowStockCopy(part: Pick<PartSnapshot, "name" | "sku" | "quantity" | "minQuantity">): Pick<
  NoticeDraft,
  "title" | "message" | "emailSubject" | "emailBody"
> {
  const message = `${part.name} (${part.sku}) est en dessous du seuil : ${part.quantity} en stock pour un minimum de ${part.minQuantity}.`;
  return {
    title: `Stock bas — ${part.name}`,
    message,
    emailSubject: `Alerte FleetCare — stock bas ${part.name}`,
    emailBody: ["Bonjour,", "", message, "", "Connectez-vous à FleetCare pour consulter les stocks."].join("\n"),
  };
}

export function buildDeadlineCopy(input: {
  label: string;
  kind: DeadlineSnapshot["kind"];
  dueOn: Date;
  severity: "PROCHE" | "DEPASSEE";
  vehicleLabel: string | null;
}): Pick<NoticeDraft, "title" | "message" | "emailSubject" | "emailBody"> {
  const kindLabel = input.kind === "ASSURANCE" ? "assurance" : "visite technique";
  const when =
    input.severity === "DEPASSEE"
      ? `est dépassée depuis le ${formatIsoDate(input.dueOn)}`
      : `arrive le ${formatIsoDate(input.dueOn)}`;
  const vehicle = input.vehicleLabel ? ` — ${input.vehicleLabel}` : "";
  const message = `${input.label}${vehicle} (${kindLabel}) ${when}.`;
  const title =
    input.severity === "DEPASSEE" ? `Échéance dépassée — ${input.label}` : `Échéance proche — ${input.label}`;
  return {
    title,
    message,
    emailSubject: `Alerte FleetCare — ${title}`,
    emailBody: ["Bonjour,", "", message, "", "Connectez-vous à FleetCare pour consulter les échéances."].join("\n"),
  };
}

function remember(plan: NoticePlan, existing: NoticeSnapshot | undefined, draft: NoticeDraft) {
  if (!existing) {
    plan.create.push(draft);
    return;
  }
  if (existing.status === "RESOLUE") {
    plan.reopen.push({ ...draft, id: existing.id });
  }
}

export function planOperationalNotices(input: {
  companyId: string;
  today: Date;
  parts: PartSnapshot[];
  deadlines: DeadlineSnapshot[];
  notices: NoticeSnapshot[];
}): NoticePlan {
  const plan: NoticePlan = { create: [], reopen: [], resolveIds: [], deadlineStatuses: [] };
  const notices = input.notices.filter((notice) => notice.companyId === input.companyId);

  for (const part of input.parts) {
    if (part.companyId !== input.companyId) continue;
    const key = `stock:${part.id}`;
    const existing = notices.find((notice) => notice.dedupeKey === key);
    if (!isLowStock(part.quantity, part.minQuantity)) {
      if (existing && existing.status !== "RESOLUE") plan.resolveIds.push(existing.id);
      continue;
    }
    const copy = buildLowStockCopy(part);
    remember(plan, existing, {
      dedupeKey: key,
      kind: "STOCK_BAS",
      severity: "BAS",
      sparePartId: part.id,
      deadlineId: null,
      ...copy,
    });
  }

  for (const deadline of input.deadlines) {
    if (deadline.companyId !== input.companyId) continue;
    const next = classifyDeadline(deadline.dueOn, input.today, deadline.treated);
    plan.deadlineStatuses.push({ id: deadline.id, status: next });
    const severity = next === "PROCHE" || next === "DEPASSEE" ? next : null;
    const related = notices.filter((notice) => notice.deadlineId === deadline.id);
    for (const notice of related) {
      if (notice.severity !== severity && notice.status !== "RESOLUE") {
        plan.resolveIds.push(notice.id);
      }
    }
    if (!severity) continue;
    const key = `deadline:${deadline.id}:${severity}`;
    const existing = related.find((notice) => notice.dedupeKey === key);
    const copy = buildDeadlineCopy({
      label: deadline.label,
      kind: deadline.kind,
      dueOn: deadline.dueOn,
      severity,
      vehicleLabel: deadline.vehicleLabel,
    });
    remember(plan, existing, {
      dedupeKey: key,
      kind: "ECHEANCE",
      severity,
      sparePartId: null,
      deadlineId: deadline.id,
      ...copy,
    });
  }

  return plan;
}
