import { describe, expect, it } from "bun:test";
import {
  daysLeft,
  isOpen,
  newcomersSoFar,
  phase,
  todaysNewcomer,
  unlockedSlugs,
  weekday,
} from "../limited/calendar";
import { CHRISTMAS_CALENDAR as CAL, NEWCOMERS, OPENING } from "./calendar";

describe("the Christmas chalet's calendar", () => {
  it("opens on 1 December and is gone from Saturday 9 January", () => {
    expect(phase(CAL, null)).toBe("hidden");
    expect(phase(CAL, "2026-11-30")).toBe("hidden");
    expect(phase(CAL, "2026-12-01")).toBe("unlocking");
    expect(phase(CAL, "2026-12-25")).toBe("unlocking");
    expect(phase(CAL, "2026-12-26")).toBe("countdown");
    expect(phase(CAL, "2027-01-08")).toBe("countdown");
    expect(phase(CAL, "2027-01-09")).toBe("closed");
    expect(isOpen(CAL, "2026-11-30")).toBe(false);
    expect(isOpen(CAL, "2027-01-08")).toBe(true);
    expect(isOpen(CAL, "2027-01-09")).toBe(false);
  });

  it("opens with four, then brings one Newcomer a school day", () => {
    expect(unlockedSlugs(CAL, "2026-12-01")).toEqual(OPENING);
    expect(todaysNewcomer(CAL, "2026-12-01")).toBeNull();
    for (const { day } of NEWCOMERS) {
      expect([1, 2, 3, 4, 5]).toContain(weekday(day));
    }
    const days = NEWCOMERS.map(({ day }) => day);
    expect(new Set(days).size).toBe(days.length);
    expect([...days].sort()).toEqual(days);
  });

  it("brings Father Christmas on the last day of term, before Christmas", () => {
    const last = NEWCOMERS[NEWCOMERS.length - 1];
    expect(last).toEqual({ day: "2026-12-18", slug: "santa" });
    expect(weekday(last.day)).toBe(5);
    expect(unlockedSlugs(CAL, "2026-12-18")).toHaveLength(17);
    expect(newcomersSoFar(CAL, "2026-12-18")[0]).toBe("santa");
  });

  it("counts down to its last day", () => {
    expect(daysLeft(CAL, "2026-12-26")).toBe(14);
    expect(daysLeft(CAL, "2027-01-08")).toBe(1);
  });
});
