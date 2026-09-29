import { describe, expect, it } from "vitest";
import {
  TenantAccessError,
  assertPlatformAdmin,
  assertTenantAccess,
  canEnterGestionnaireShell,
  emailsForCompany,
  filterByCompany,
  guardTenantMutation,
  tenantWhere,
} from "./tenant";

const gestionnaireA = { role: "GESTIONNAIRE" as const, companyId: "company-a" };
const gestionnaireB = { role: "GESTIONNAIRE" as const, companyId: "company-b" };

describe("isolement des entreprises", () => {
  it("empêche le gestionnaire A de lire les données de B", () => {
    const vehicles = [
      { id: "v1", companyId: "company-a" },
      { id: "v2", companyId: "company-b" },
    ];
    expect(filterByCompany("company-a", vehicles)).toEqual([vehicles[0]]);
    expect(() => assertTenantAccess(gestionnaireA, "company-b")).toThrow(TenantAccessError);
    expect(() => assertTenantAccess(gestionnaireA, "company-a")).not.toThrow();
  });

  it("empêche une mutation croisée, y compris si l’identifiant est forcé", () => {
    expect(tenantWhere("company-a", { companyId: "company-b", id: "v2" })).toEqual({
      companyId: "company-a",
      id: "v2",
    });
    expect(() =>
      guardTenantMutation(gestionnaireA, { companyId: "company-b" }),
    ).toThrow(TenantAccessError);
    expect(guardTenantMutation(gestionnaireA, { companyId: "company-a" })).toEqual({
      companyId: "company-a",
    });
    expect(() => guardTenantMutation(gestionnaireB, null)).toThrow(TenantAccessError);
  });

  it("n’envoie pas l’e-mail d’alerte au gestionnaire d’une autre entreprise", () => {
    expect(
      emailsForCompany("company-a", [
        { companyId: "company-a", email: "a@example.com", role: "GESTIONNAIRE" },
        { companyId: "company-b", email: "b@example.com", role: "GESTIONNAIRE" },
        { companyId: "company-a", email: "admin@example.com", role: "ADMIN_PLATEFORME" },
      ]),
    ).toEqual(["a@example.com"]);
  });

  it("réserve la liste plateforme à l’admin et bloque le shell gestionnaire sinon", () => {
    expect(() => assertPlatformAdmin(gestionnaireA)).toThrow(TenantAccessError);
    expect(() => assertPlatformAdmin({ role: "ADMIN_PLATEFORME", companyId: null })).not.toThrow();
    expect(canEnterGestionnaireShell("VALIDEE")).toBe(true);
    expect(canEnterGestionnaireShell("EN_ATTENTE")).toBe(false);
    expect(canEnterGestionnaireShell("SUSPENDUE")).toBe(false);
  });
});
