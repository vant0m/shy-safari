import { describe, expect, it } from "bun:test";
import { daysLeft, isOpen, phase } from "../limited/calendar";
import { CHRISTMAS_CALENDAR as CAL } from "./calendar";

describe("the Christmas chalet's calendar", () => {
  it("opens on 1 December and is gone from Saturday 9 January", () => {
    expect(phase(CAL, null)).toBe("hidden");
    expect(phase(CAL, "2026-11-30")).toBe("hidden");
    expect(phase(CAL, "2026-12-01")).toBe("open");
    expect(phase(CAL, "2026-12-25")).toBe("open");
    expect(phase(CAL, "2026-12-26")).toBe("countdown");
    expect(phase(CAL, "2027-01-08")).toBe("countdown");
    expect(phase(CAL, "2027-01-09")).toBe("closed");
    expect(isOpen(CAL, "2026-11-30")).toBe(false);
    expect(isOpen(CAL, "2026-12-01")).toBe(true);
    expect(isOpen(CAL, "2027-01-08")).toBe(true);
    expect(isOpen(CAL, "2027-01-09")).toBe(false);
  });

  it("counts down to its last day", () => {
    expect(daysLeft(CAL, "2026-12-26")).toBe(14);
    expect(daysLeft(CAL, "2027-01-08")).toBe(1);
  });
});
