/**
 * A Class's statistics as plain data: what was recorded each day, and the
 * sums the Statistics panel shows. Kept free of storage and state so the
 * rules are easy to test; `stats.svelte.ts` records and remembers them
 * (docs/adr/0014-class-statistics.md).
 *
 * Everything is bucketed by the computer's own calendar day, and the noise
 * level by ten-minute slot of that day, so a year of daily use stays a few
 * hundred kilobytes at most. The level is the meter's 0–100 scale, the same
 * one the Volume Goal is set on, not decibels: an uncalibrated laptop
 * microphone cannot honestly give decibels.
 */

import type { RarityTier } from "$lib/scenes/types";

/** Minutes per noise-level slot. 144 slots make a day. */
export const SLOT_MINUTES = 10;
export const SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES;
/** Days of detail kept; older days are dropped when a new one starts. */
export const KEEP_DAYS = 180;

export interface DayStats {
  /** Time the room was listened to and judged Quiet, in ms. */
  quietMs: number;
  /** Time it was judged Too Loud, in ms. */
  loudMs: number;
  /** How many times Start was pressed. */
  sessions: number;
  arrivals: number;
  /** Creatures that Ran Away. */
  departures: number;
  rares: number;
  legendaries: number;
  /**
   * Noise level by slot of the day: `[sum of samples, number of samples]`,
   * one sample per second of listening. Only slots with any are present.
   */
  level: Record<number, [number, number]>;
}

export interface ClassStats {
  version: 1;
  /** By local `YYYY-MM-DD`. */
  days: Record<string, DayStats>;
}

export function emptyStats(): ClassStats {
  return { version: 1, days: {} };
}

export function emptyDay(): DayStats {
  return {
    quietMs: 0,
    loudMs: 0,
    sessions: 0,
    arrivals: 0,
    departures: 0,
    rares: 0,
    legendaries: 0,
    level: {},
  };
}

const NUMBER_FIELDS = [
  "quietMs",
  "loudMs",
  "sessions",
  "arrivals",
  "departures",
  "rares",
  "legendaries",
] as const;

/** Whatever was saved, cleaned up; anything unreadable is left out. */
export function parseStats(saved: unknown): ClassStats {
  const stats = emptyStats();
  if (!saved || typeof saved !== "object") return stats;
  const days = (saved as { days?: unknown }).days;
  if (!days || typeof days !== "object") return stats;
  for (const [day, raw] of Object.entries(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !raw || typeof raw !== "object") {
      continue;
    }
    const clean = emptyDay();
    for (const field of NUMBER_FIELDS) {
      const value = (raw as Record<string, unknown>)[field];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        clean[field] = value;
      }
    }
    const level = (raw as { level?: unknown }).level;
    if (level && typeof level === "object") {
      for (const [slot, pair] of Object.entries(level)) {
        const index = Number(slot);
        if (
          Number.isInteger(index) &&
          index >= 0 &&
          index < SLOTS_PER_DAY &&
          Array.isArray(pair) &&
          pair.length === 2 &&
          pair.every((n) => typeof n === "number" && Number.isFinite(n))
        ) {
          clean.level[index] = [pair[0], pair[1]];
        }
      }
    }
    stats.days[day] = clean;
  }
  return stats;
}

/** The slot of the day a moment falls in. */
export function slotOf(date: Date): number {
  return Math.floor((date.getHours() * 60 + date.getMinutes()) / SLOT_MINUTES);
}

/** A local `YYYY-MM-DD`, as the rest of the app keys days. */
export function dayOf(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** What has happened since the last time it was written down. */
export interface Pending {
  quietMs: number;
  loudMs: number;
  sessions: number;
  arrivals: number;
  departures: number;
  rares: number;
  legendaries: number;
  level: Record<number, [number, number]>;
}

export function emptyPending(): Pending {
  return { ...emptyDay() };
}

export function countArrival(pending: Pending, tier: RarityTier) {
  pending.arrivals += 1;
  if (tier === "rare") pending.rares += 1;
  if (tier === "legendary") pending.legendaries += 1;
}

/** Add what is pending to `day` of `stats`, and drop days past keeping. */
export function commit(
  stats: ClassStats,
  day: string,
  pending: Pending,
): ClassStats {
  const days = { ...stats.days };
  const into = { ...(days[day] ?? emptyDay()) };
  for (const field of NUMBER_FIELDS) into[field] += pending[field];
  into.level = { ...into.level };
  for (const [slot, [sum, count]] of Object.entries(pending.level)) {
    const [oldSum, oldCount] = into.level[Number(slot)] ?? [0, 0];
    into.level[Number(slot)] = [oldSum + sum, oldCount + count];
  }
  days[day] = into;
  return { version: 1, days: prune(days, day) };
}

/** Keep the most recent `KEEP_DAYS` days up to `today`. */
export function prune(
  days: Record<string, DayStats>,
  today: string,
  keep = KEEP_DAYS,
): Record<string, DayStats> {
  const cutoff = addDays(today, -(keep - 1));
  return Object.fromEntries(
    Object.entries(days).filter(([day]) => day >= cutoff),
  );
}

/** A local `YYYY-MM-DD` moved by whole days. */
export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayOf(new Date(y, m - 1, d + delta));
}

/** The days from `from` to `to`, inclusive, in order. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) out.push(day);
  return out;
}

export interface Totals {
  quietMs: number;
  loudMs: number;
  sessions: number;
  arrivals: number;
  departures: number;
  rares: number;
  legendaries: number;
  /** Share of judged time spent Quiet, 0–1, or null if never listened. */
  quietShare: number | null;
  /** Mean noise level over the range, or null if never listened. */
  meanLevel: number | null;
  /** Days in the range with any listening. */
  activeDays: number;
}

/** Everything in the range `from`–`to`, inclusive, added up. */
export function totals(stats: ClassStats, from: string, to: string): Totals {
  const sum = { ...emptyDay() };
  let levelSum = 0;
  let levelCount = 0;
  let activeDays = 0;
  for (const [day, data] of Object.entries(stats.days)) {
    if (day < from || day > to) continue;
    for (const field of NUMBER_FIELDS) sum[field] += data[field];
    if (data.quietMs + data.loudMs > 0) activeDays += 1;
    for (const [s, c] of Object.values(data.level)) {
      levelSum += s;
      levelCount += c;
    }
  }
  const judged = sum.quietMs + sum.loudMs;
  return {
    quietMs: sum.quietMs,
    loudMs: sum.loudMs,
    sessions: sum.sessions,
    arrivals: sum.arrivals,
    departures: sum.departures,
    rares: sum.rares,
    legendaries: sum.legendaries,
    quietShare: judged > 0 ? sum.quietMs / judged : null,
    meanLevel: levelCount > 0 ? levelSum / levelCount : null,
    activeDays,
  };
}

/** Quiet minutes for each day in the range, oldest first. */
export function quietByDay(
  stats: ClassStats,
  from: string,
  to: string,
): { day: string; quietMinutes: number; loudMinutes: number }[] {
  return daysBetween(from, to).map((day) => ({
    day,
    quietMinutes: (stats.days[day]?.quietMs ?? 0) / 60_000,
    loudMinutes: (stats.days[day]?.loudMs ?? 0) / 60_000,
  }));
}

/**
 * The mean noise level in each ten-minute slot of the day, over every day in
 * the range, for slots that have any samples: when in the day the class is
 * loudest.
 */
export function levelByTimeOfDay(
  stats: ClassStats,
  from: string,
  to: string,
): { slot: number; level: number }[] {
  const sums = new Map<number, [number, number]>();
  for (const [day, data] of Object.entries(stats.days)) {
    if (day < from || day > to) continue;
    for (const [slot, [s, c]] of Object.entries(data.level)) {
      const [oldS, oldC] = sums.get(Number(slot)) ?? [0, 0];
      sums.set(Number(slot), [oldS + s, oldC + c]);
    }
  }
  return [...sums.entries()]
    .filter(([, [, c]]) => c > 0)
    .map(([slot, [s, c]]) => ({ slot, level: s / c }))
    .sort((a, b) => a.slot - b.slot);
}

/** "08:40", for a slot's start. */
export function slotLabel(slot: number): string {
  const minutes = slot * SLOT_MINUTES;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
