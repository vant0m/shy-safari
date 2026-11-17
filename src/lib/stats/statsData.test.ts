import { describe, expect, it } from "bun:test";
import {
  addDays,
  commit,
  countArrival,
  dayOf,
  daysBetween,
  emptyPending,
  emptyStats,
  levelByTimeOfDay,
  parseStats,
  prune,
  quietByDay,
  slotLabel,
  slotOf,
  totals,
} from "./statsData";

function pendingWith(changes: Partial<ReturnType<typeof emptyPending>>) {
  return { ...emptyPending(), ...changes };
}

describe("days and slots", () => {
  it("keys days by the local calendar", () => {
    expect(dayOf(new Date(2026, 10, 7, 23, 59))).toBe("2026-11-07");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(daysBetween("2026-12-30", "2027-01-02")).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });

  it("puts a moment in its ten-minute slot", () => {
    expect(slotOf(new Date(2026, 0, 1, 8, 47))).toBe(52);
    expect(slotLabel(52)).toBe("08:40");
  });
});

describe("recording", () => {
  it("adds what is pending to the day", () => {
    let stats = commit(
      emptyStats(),
      "2026-11-17",
      pendingWith({ quietMs: 60_000, sessions: 1, level: { 52: [300, 10] } }),
    );
    stats = commit(
      stats,
      "2026-11-17",
      pendingWith({ quietMs: 30_000, loudMs: 10_000, level: { 52: [100, 5] } }),
    );
    const day = stats.days["2026-11-17"];
    expect(day.quietMs).toBe(90_000);
    expect(day.loudMs).toBe(10_000);
    expect(day.sessions).toBe(1);
    expect(day.level[52]).toEqual([400, 15]);
  });

  it("counts Rares and Legendaries as arrivals too", () => {
    const pending = emptyPending();
    countArrival(pending, "common");
    countArrival(pending, "rare");
    countArrival(pending, "legendary");
    expect([pending.arrivals, pending.rares, pending.legendaries]).toEqual([
      3, 1, 1,
    ]);
  });

  it("forgets days past keeping", () => {
    const days = {
      "2026-01-01": commit(emptyStats(), "2026-01-01", emptyPending()).days[
        "2026-01-01"
      ],
      "2026-11-17": commit(emptyStats(), "2026-11-17", emptyPending()).days[
        "2026-11-17"
      ],
    };
    expect(Object.keys(prune(days, "2026-11-17", 30))).toEqual(["2026-11-17"]);
  });
});

describe("reading back", () => {
  const stats = [
    [
      "2026-11-16",
      pendingWith({
        quietMs: 120_000,
        loudMs: 60_000,
        arrivals: 2,
        level: { 50: [200, 10] },
      }),
    ],
    [
      "2026-11-17",
      pendingWith({
        quietMs: 60_000,
        sessions: 2,
        level: { 50: [100, 10], 60: [600, 10] },
      }),
    ],
  ].reduce(
    (acc, [day, pending]) =>
      commit(acc, day as string, pending as ReturnType<typeof emptyPending>),
    emptyStats(),
  );

  it("adds a range up", () => {
    const sum = totals(stats, "2026-11-16", "2026-11-17");
    expect(sum.quietMs).toBe(180_000);
    expect(sum.quietShare).toBeCloseTo(0.75);
    expect(sum.meanLevel).toBeCloseTo(30);
    expect(sum.activeDays).toBe(2);
    expect(totals(stats, "2026-11-17", "2026-11-17").arrivals).toBe(0);
  });

  it("says nothing about a range never listened to", () => {
    const sum = totals(stats, "2025-01-01", "2025-01-31");
    expect(sum.quietShare).toBeNull();
    expect(sum.meanLevel).toBeNull();
  });

  it("gives quiet minutes for every day, empty ones included", () => {
    expect(quietByDay(stats, "2026-11-15", "2026-11-17")).toEqual([
      { day: "2026-11-15", quietMinutes: 0, loudMinutes: 0 },
      { day: "2026-11-16", quietMinutes: 2, loudMinutes: 1 },
      { day: "2026-11-17", quietMinutes: 1, loudMinutes: 0 },
    ]);
  });

  it("averages the level by time of day across days", () => {
    expect(levelByTimeOfDay(stats, "2026-11-16", "2026-11-17")).toEqual([
      { slot: 50, level: 15 },
      { slot: 60, level: 60 },
    ]);
  });

  it("survives a hand-edited or broken record", () => {
    const parsed = parseStats({
      days: {
        "2026-11-17": {
          quietMs: "lots",
          arrivals: 3,
          level: { 5: [1, 2], 999: [1, 1] },
        },
        nonsense: {},
      },
    });
    expect(Object.keys(parsed.days)).toEqual(["2026-11-17"]);
    expect(parsed.days["2026-11-17"].quietMs).toBe(0);
    expect(parsed.days["2026-11-17"].arrivals).toBe(3);
    expect(parsed.days["2026-11-17"].level).toEqual({ 5: [1, 2] });
  });
});
