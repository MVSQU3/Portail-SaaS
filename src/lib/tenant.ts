export type TenantRole = "GESTIONNAIRE" | "ADMIN_PLATEFORME";

export type TenantActor = {
  role: TenantRole;
  companyId: string | null;
};

export class TenantAccessError extends Error {
  readonly code = "TENANT_ACCESS";

  constructor(message = "Accès refusé : cette ressource appartient à une autre entreprise.") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export function assertTenantAccess(actor: TenantActor, resourceCompanyId: string): void {
  if (actor.role !== "GESTIONNAIRE" || !actor.companyId || actor.companyId !== resourceCompanyId) {
    throw new TenantAccessError();
  }
}

export function assertPlatformAdmin(actor: TenantActor): void {
  if (actor.role !== "ADMIN_PLATEFORME") {
    throw new TenantAccessError("Réservé à l’administrateur plateforme.");
  }
}

export function tenantWhere<const T extends object>(
  companyId: string,
  extra?: T,
): T & { companyId: string } {
  return { ...(extra ?? ({} as T)), companyId };
}

export function filterByCompany<T extends { companyId: string }>(companyId: string, records: T[]): T[] {
  return records.filter((record) => record.companyId === companyId);
}

export function guardTenantMutation(
  actor: TenantActor,
  resource: { companyId: string } | null,
): { companyId: string } {
  if (!resource) {
    throw new TenantAccessError("Ressource introuvable.");
  }
  assertTenantAccess(actor, resource.companyId);
  if (!actor.companyId) {
    throw new TenantAccessError();
  }
  return { companyId: actor.companyId };
}

export function emailsForCompany(
  companyId: string,
  users: Array<{ companyId: string | null; email: string; role: string }>,
): string[] {
  return users
    .filter((user) => user.companyId === companyId && user.role === "GESTIONNAIRE")
    .map((user) => user.email);
}

export function canEnterGestionnaireShell(status: "EN_ATTENTE" | "VALIDEE" | "SUSPENDUE"): boolean {
  return status === "VALIDEE";
}
