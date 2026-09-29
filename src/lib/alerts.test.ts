import { describe, expect, it } from "vitest";
import {
  buildAlertCopy,
  didCrossThreshold,
  evaluateMeterReading,
  isMeterProgression,
  type ThresholdRule,
} from "./alerts";

const rule = (overrides: Partial<ThresholdRule> = {}): ThresholdRule => ({
  id: "rule-a",
  companyId: "company-a",
  vehicleId: "vehicle-a",
  metric: "KILOMETRES",
  threshold: 48000,
  name: "Vidange",
  active: true,
  ...overrides,
});

describe("didCrossThreshold", () => {
  it("déclenche quand le relevé atteint le seuil pour la première fois", () => {
    expect(didCrossThreshold(45200, 48000, 48000)).toBe(true);
    expect(didCrossThreshold(45200, 48100, 48000)).toBe(true);
    expect(didCrossThreshold(null, 48000, 48000)).toBe(true);
  });

  it("ne redéclenche pas un seuil déjà franchi", () => {
    expect(didCrossThreshold(48000, 49000, 48000)).toBe(false);
    expect(didCrossThreshold(50000, 51000, 48000)).toBe(false);
  });

  it("ignore un relevé sous le seuil, un seuil nul ou une valeur non entière", () => {
    expect(didCrossThreshold(100, 150, 200)).toBe(false);
    expect(didCrossThreshold(null, 10, 0)).toBe(false);
    expect(didCrossThreshold(10, 10.5, 10)).toBe(false);
  });
});

describe("evaluateMeterReading", () => {
  it("ne retient que les règles de l’entreprise, du véhicule et de la métrique", () => {
    const fired = evaluateMeterReading({
      companyId: "company-a",
      vehicleId: "vehicle-a",
      metric: "KILOMETRES",
      previous: 45200,
      next: 48000,
      rules: [
        rule(),
        rule({ id: "other-company", companyId: "company-b", threshold: 1 }),
        rule({ id: "other-vehicle", vehicleId: "vehicle-b", threshold: 1 }),
        rule({ id: "hours", metric: "HEURES", threshold: 1 }),
        rule({ id: "inactive", active: false, threshold: 1 }),
        rule({ id: "fleet", vehicleId: null, threshold: 47000, name: "Parc" }),
      ],
    });

    expect(fired.map((item) => item.ruleId)).toEqual(["rule-a", "fleet"]);
  });

  it("ne produit aucune alerte si le compteur n’a pas franchi le seuil", () => {
    const fired = evaluateMeterReading({
      companyId: "company-a",
      vehicleId: "vehicle-a",
      metric: "KILOMETRES",
      previous: 44000,
      next: 45200,
      rules: [rule()],
    });
    expect(fired).toEqual([]);
  });
});

describe("isMeterProgression", () => {
  it("accepte un relevé égal ou supérieur et refuse une régression", () => {
    expect(isMeterProgression(100, 100)).toBe(true);
    expect(isMeterProgression(100, 120)).toBe(true);
    expect(isMeterProgression(100, 90)).toBe(false);
    expect(isMeterProgression(100, 10.2)).toBe(false);
  });
});

describe("buildAlertCopy", () => {
  it("rédige une notification en français avec des entiers", () => {
    const copy = buildAlertCopy({
      ruleName: "Vidange Hilux",
      vehicleLabel: "Hilux chantier",
      registration: "AA-452-CI",
      metric: "KILOMETRES",
      value: 48000,
      threshold: 48000,
    });
    expect(copy.title).toBe("Vidange Hilux");
    expect(copy.message).toContain("48000 km");
    expect(copy.message).not.toMatch(/\d[.,]\d/);
    expect(copy.emailSubject).toContain("Vidange Hilux");
    expect(copy.emailBody).toContain("AA-452-CI");
  });
});
