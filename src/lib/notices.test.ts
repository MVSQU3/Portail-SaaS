import { describe, expect, it } from "vitest";
import {
  buildDeadlineCopy,
  buildLowStockCopy,
  classifyDeadline,
  isLowStock,
  planOperationalNotices,
  type DeadlineSnapshot,
  type NoticeSnapshot,
  type PartSnapshot,
} from "./notices";

const today = new Date("2026-09-29T12:00:00.000Z");

const part = (overrides: Partial<PartSnapshot> = {}): PartSnapshot => ({
  id: "part-a",
  companyId: "company-a",
  name: "Plaquettes",
  sku: "PLQ-01",
  quantity: 1,
  minQuantity: 4,
  ...overrides,
});

const deadline = (overrides: Partial<DeadlineSnapshot> = {}): DeadlineSnapshot => ({
  id: "dead-a",
  companyId: "company-a",
  label: "Assurance Hilux",
  kind: "ASSURANCE",
  dueOn: new Date("2026-10-09T00:00:00.000Z"),
  treated: false,
  vehicleLabel: "Hilux chantier",
  ...overrides,
});

const notice = (overrides: Partial<NoticeSnapshot> = {}): NoticeSnapshot => ({
  id: "notice-a",
  companyId: "company-a",
  dedupeKey: "stock:part-a",
  status: "OUVERTE",
  kind: "STOCK_BAS",
  severity: "BAS",
  sparePartId: "part-a",
  deadlineId: null,
  ...overrides,
});

describe("stocks bas", () => {
  it("signale un stock au seuil ou en dessous, pas un minimum à zéro", () => {
    expect(isLowStock(4, 4)).toBe(true);
    expect(isLowStock(5, 4)).toBe(false);
    expect(isLowStock(0, 0)).toBe(false);
  });

  it("ouvre une notification une seule fois, puis la résout au réassort", () => {
    const opened = planOperationalNotices({
      companyId: "company-a",
      today,
      parts: [part(), part({ id: "part-b", companyId: "company-b", quantity: 0, minQuantity: 1 })],
      deadlines: [],
      notices: [],
    });
    expect(opened.create.map((item) => item.dedupeKey)).toEqual(["stock:part-a"]);
    expect(opened.create[0]?.message).not.toMatch(/\d[.,]\d/);

    const again = planOperationalNotices({
      companyId: "company-a",
      today,
      parts: [part()],
      deadlines: [],
      notices: [notice()],
    });
    expect(again.create).toEqual([]);
    expect(again.reopen).toEqual([]);

    const restocked = planOperationalNotices({
      companyId: "company-a",
      today,
      parts: [part({ quantity: 8 })],
      deadlines: [],
      notices: [notice({ status: "LUE" })],
    });
    expect(restocked.resolveIds).toEqual(["notice-a"]);
  });

  it("rouvre une alerte résolue si le stock redescend", () => {
    const plan = planOperationalNotices({
      companyId: "company-a",
      today,
      parts: [part()],
      deadlines: [],
      notices: [notice({ status: "RESOLUE" })],
    });
    expect(plan.reopen.map((item) => item.id)).toEqual(["notice-a"]);
    expect(plan.create).toEqual([]);
  });
});

describe("échéances", () => {
  it("classe proche, dépassée, à venir et traitée", () => {
    expect(classifyDeadline(new Date("2026-10-09T00:00:00.000Z"), today, false)).toBe("PROCHE");
    expect(classifyDeadline(new Date("2026-10-29T00:00:00.000Z"), today, false)).toBe("PROCHE");
    expect(classifyDeadline(new Date("2026-10-30T00:00:00.000Z"), today, false)).toBe("A_VENIR");
    expect(classifyDeadline(new Date("2026-09-28T00:00:00.000Z"), today, false)).toBe("DEPASSEE");
    expect(classifyDeadline(new Date("2026-09-28T00:00:00.000Z"), today, true)).toBe("TRAITEE");
  });

  it("prévient au passage en proche puis en dépassée, sans mélanger les entreprises", () => {
    const soon = planOperationalNotices({
      companyId: "company-a",
      today,
      parts: [],
      deadlines: [
        deadline(),
        deadline({ id: "dead-b", companyId: "company-b", dueOn: new Date("2026-09-01T00:00:00.000Z") }),
      ],
      notices: [
        notice({
          id: "foreign",
          companyId: "company-b",
          dedupeKey: "deadline:dead-b:DEPASSEE",
          deadlineId: "dead-b",
          kind: "ECHEANCE",
          severity: "DEPASSEE",
        }),
      ],
    });
    expect(soon.create.map((item) => item.dedupeKey)).toEqual(["deadline:dead-a:PROCHE"]);
    expect(soon.resolveIds).toEqual([]);
    expect(soon.deadlineStatuses).toEqual([{ id: "dead-a", status: "PROCHE" }]);

    const overdue = planOperationalNotices({
      companyId: "company-a",
      today,
      parts: [],
      deadlines: [deadline({ dueOn: new Date("2026-09-20T00:00:00.000Z") })],
      notices: [
        notice({
          id: "proche",
          dedupeKey: "deadline:dead-a:PROCHE",
          kind: "ECHEANCE",
          severity: "PROCHE",
          sparePartId: null,
          deadlineId: "dead-a",
        }),
      ],
    });
    expect(overdue.resolveIds).toEqual(["proche"]);
    expect(overdue.create.map((item) => item.severity)).toEqual(["DEPASSEE"]);
  });

  it("rédige des messages sans décimales", () => {
    const stock = buildLowStockCopy(part());
    const due = buildDeadlineCopy({
      label: "Visite technique",
      kind: "VISITE_TECHNIQUE",
      dueOn: new Date("2026-10-09T00:00:00.000Z"),
      severity: "PROCHE",
      vehicleLabel: "Hilux",
    });
    expect(stock.message).not.toMatch(/\d[.,]\d/);
    expect(due.message).toContain("2026-10-09");
    expect(due.message).not.toMatch(/\d[.,]\d/);
  });
});
