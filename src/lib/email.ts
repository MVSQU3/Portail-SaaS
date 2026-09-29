import { getPrisma } from "@/lib/prisma";

export type OutboundEmail = {
  to: string;
  subject: string;
  body: string;
  kind: string;
  companyId?: string | null;
};

export function emailStubConfig(): { from: string; stub: true } {
  return {
    from: process.env.EMAIL_FROM ?? "noreply@fleetcare.local",
    stub: true,
  };
}

export async function deliverTransactionalEmail(
  email: OutboundEmail,
): Promise<{ mode: "stub"; id: string }> {
  const config = emailStubConfig();
  console.info(
    `[fleetcare:email-stub] from=${config.from} to=${email.to} kind=${email.kind} subject=${email.subject}`,
  );
  const row = await getPrisma().emailLog.create({
    data: {
      companyId: email.companyId ?? null,
      to: email.to,
      subject: email.subject,
      body: email.body,
      kind: email.kind,
    },
  });
  return { mode: "stub", id: row.id };
}
