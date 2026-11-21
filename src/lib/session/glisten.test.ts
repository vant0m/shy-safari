import { describe, expect, it } from "bun:test";
import { GLISTEN_MS, LEGEND_GLISTEN_MS, glistenLeft } from "./glisten";

describe("glistening", () => {
  it("lasts a minute for a Rare and three for a Legendary, from arrival", () => {
    expect(glistenLeft("rare", 1_000, 1_000)).toBe(GLISTEN_MS);
    expect(glistenLeft("legendary", 1_000, 1_000)).toBe(LEGEND_GLISTEN_MS);
    expect(glistenLeft("common", 1_000, 1_000)).toBe(0);
  });

  it("carries on with the time it had left after leaving and coming back", () => {
    expect(glistenLeft("legendary", 0, 100_000)).toBe(80_000);
    expect(glistenLeft("rare", 0, 45_000)).toBe(15_000);
  });

  it("is over once its time is up", () => {
    expect(glistenLeft("rare", 0, 61_000)).toBe(0);
    expect(glistenLeft("legendary", 0, 200_000)).toBe(0);
  });

  it("treats a Creature saved without an arrival time as settled", () => {
    expect(glistenLeft("legendary", undefined, 5)).toBe(0);
  });
});
