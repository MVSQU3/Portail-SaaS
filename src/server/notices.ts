import { deliverTransactionalEmail } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { planOperationalNotices, type DeadlineSnapshot, type NoticeDraft, type PartSnapshot } from "@/lib/notices";
import { assertTenantAccess, emailsForCompany, tenantWhere, type TenantActor } from "@/lib/tenant";

function requireCompanyId(actor: TenantActor): string {
  if (!actor.companyId) {
    throw new Error("Entreprise absente.");
  }
  assertTenantAccess(actor, actor.companyId);
  return actor.companyId;
}

export async function syncOperationalNotices(actor: TenantActor, today = new Date()): Promise<number> {
  const companyId = requireCompanyId(actor);
  const prisma = getPrisma();
  const [parts, deadlines, notices, users] = await Promise.all([
    prisma.sparePart.findMany({ where: tenantWhere(companyId) }),
    prisma.deadline.findMany({
      where: tenantWhere(companyId),
      include: { vehicle: { select: { label: true, companyId: true } } },
    }),
    prisma.notice.findMany({ where: tenantWhere(companyId) }),
    prisma.user.findMany({
      where: { companyId },
      select: { companyId: true, email: true, role: true },
    }),
  ]);

  const partSnapshots: PartSnapshot[] = parts.map((part) => ({
    id: part.id,
    companyId: part.companyId,
    name: part.name,
    sku: part.sku,
    quantity: part.quantity,
    minQuantity: part.minQuantity,
  }));
  const deadlineSnapshots: DeadlineSnapshot[] = deadlines.map((deadline) => ({
    id: deadline.id,
    companyId: deadline.companyId,
    label: deadline.label,
    kind: deadline.kind,
    dueOn: deadline.dueOn,
    treated: deadline.status === "TRAITEE",
    vehicleLabel: deadline.vehicle && deadline.vehicle.companyId === companyId ? deadline.vehicle.label : null,
  }));

  const plan = planOperationalNotices({
    companyId,
    today,
    parts: partSnapshots,
    deadlines: deadlineSnapshots,
    notices,
  });

  const emails: NoticeDraft[] = [];
  await prisma.$transaction(async (tx) => {
    for (const id of plan.resolveIds) {
      await tx.notice.updateMany({
        where: tenantWhere(companyId, { id }),
        data: { status: "RESOLUE", readAt: new Date() },
      });
    }
    for (const status of plan.deadlineStatuses) {
      await tx.deadline.updateMany({
        where: tenantWhere(companyId, { id: status.id }),
        data: { status: status.status },
      });
    }
    for (const draft of plan.create) {
      await tx.notice.create({
        data: {
          companyId,
          kind: draft.kind,
          severity: draft.severity,
          dedupeKey: draft.dedupeKey,
          title: draft.title,
          message: draft.message,
          status: "OUVERTE",
          sparePartId: draft.sparePartId,
          deadlineId: draft.deadlineId,
        },
      });
      emails.push(draft);
    }
    for (const draft of plan.reopen) {
      await tx.notice.updateMany({
        where: tenantWhere(companyId, { id: draft.id }),
        data: {
          status: "OUVERTE",
          readAt: null,
          title: draft.title,
          message: draft.message,
          severity: draft.severity,
        },
      });
      emails.push(draft);
    }
  });

  const recipients = emailsForCompany(companyId, users);
  for (const draft of emails) {
    for (const to of recipients) {
      await deliverTransactionalEmail({
        to,
        subject: draft.emailSubject,
        body: draft.emailBody,
        kind: draft.kind,
        companyId,
      });
    }
  }
  return emails.length;
}

export async function markNoticeRead(actor: TenantActor, noticeId: string) {
  const companyId = requireCompanyId(actor);
  await getPrisma().notice.updateMany({
    where: tenantWhere(companyId, { id: noticeId, status: "OUVERTE" }),
    data: { status: "LUE", readAt: new Date() },
  });
}
