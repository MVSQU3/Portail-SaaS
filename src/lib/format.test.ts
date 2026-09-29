import { describe, expect, it } from "vitest";
import { formatXof } from "./format";

describe("formatXof", () => {
  it("affiche des montants XOF entiers, sans décimales", () => {
    expect(formatXof(25000)).not.toContain(",");
    expect(formatXof(10.8)).not.toContain(",");
    expect(formatXof(10.8)).toContain("10");
    expect(formatXof(25000).toLowerCase()).toMatch(/f\s?cfa|xof/);
  });
});
