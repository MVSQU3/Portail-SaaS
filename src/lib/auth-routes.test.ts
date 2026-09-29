import { describe, expect, it } from "vitest";
import { isPublicPath } from "./auth-routes";

describe("isPublicPath", () => {
  it("laisse publics l’accueil, l’inscription, la connexion et les callbacks Auth.js", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/connexion")).toBe(true);
    expect(isPublicPath("/inscription")).toBe(true);
    expect(isPublicPath("/api/auth/callback/credentials")).toBe(true);
    expect(isPublicPath("/api/auth/csrf")).toBe(true);
  });

  it("protège les écrans entreprise et admin", () => {
    expect(isPublicPath("/tableau-de-bord")).toBe(false);
    expect(isPublicPath("/vehicules")).toBe(false);
    expect(isPublicPath("/vehicules/abc")).toBe(false);
    expect(isPublicPath("/en-attente")).toBe(false);
    expect(isPublicPath("/admin/entreprises")).toBe(false);
    expect(isPublicPath("/carnet")).toBe(false);
  });
});
