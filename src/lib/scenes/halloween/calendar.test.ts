import { describe, expect, it } from "bun:test";
import { daysLeft, isDay, isOpen, localDay, phase } from "../limited/calendar";
import { HALLOWEEN_CALENDAR as CAL } from "./calendar";

describe("the Hollow's calendar", () => {
  it("is hidden until Sunday 18 October and gone from Sunday 8 November", () => {
    expect(phase(CAL, null)).toBe("hidden");
    expect(phase(CAL, "2026-10-17")).toBe("hidden");
    expect(phase(CAL, "2026-10-18")).toBe("open");
    expect(phase(CAL, "2026-10-31")).toBe("open");
    expect(phase(CAL, "2026-11-01")).toBe("countdown");
    expect(phase(CAL, "2026-11-07")).toBe("countdown");
    expect(phase(CAL, "2026-11-08")).toBe("closed");
    expect(phase(CAL, "2027-10-20")).toBe("closed");
    expect(isOpen(CAL, "2026-10-17")).toBe(false);
    expect(isOpen(CAL, "2026-10-18")).toBe(true);
    expect(isOpen(CAL, "2026-11-07")).toBe(true);
  });

  it("counts down the week after Halloween", () => {
    expect(daysLeft(CAL, "2026-11-01")).toBe(7);
    expect(daysLeft(CAL, "2026-11-07")).toBe(1);
  });

  it("reads days as local calendar days", () => {
    expect(localDay(new Date(2026, 9, 31, 23, 59))).toBe("2026-10-31");
    expect(isDay("2026-10-31")).toBe(true);
    expect(isDay("2026-02-30")).toBe(false);
    expect(isDay("31/10/2026")).toBe(false);
  });
});
