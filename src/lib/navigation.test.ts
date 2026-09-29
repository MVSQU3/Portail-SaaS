import { describe, expect, it } from "vitest";
import { ADMIN_NAV, GESTIONNAIRE_NAV, isActivePath } from "./navigation";

describe("navigation gestionnaire", () => {
  it("garde l’ordre et les libellés du shell", () => {
    expect(GESTIONNAIRE_NAV.map((item) => item.label)).toEqual([
      "Dashboard",
      "Véhicules",
      "Carnet d’entretien",
      "Stocks",
      "Échéances",
      "Abonnement",
      "Déconnexion",
    ]);
    expect(GESTIONNAIRE_NAV.at(-1)?.kind).toBe("sign-out");
  });

  it("ne reprend pas le menu gestionnaire pour l’admin plateforme", () => {
    expect(ADMIN_NAV.map((item) => item.label)).toEqual([
      "Entreprises",
      "Abonnements",
      "Déconnexion",
    ]);
  });
});

describe("isActivePath", () => {
  it("active le détail véhicule sans activer les autres entrées", () => {
    expect(isActivePath("/vehicules/abc", "/vehicules")).toBe(true);
    expect(isActivePath("/vehicules/abc", "/tableau-de-bord")).toBe(false);
    expect(isActivePath("/abonnement", "/abonnement")).toBe(true);
  });
});
