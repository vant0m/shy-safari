/**
 * When a limited-time Scene is open (docs/adr/0009-a-limited-time-scene.md,
 * docs/adr/0016-christmas-chalet.md).
 *
 * A limited-time Scene is on offer for a few weeks a year with its whole
 * Roster from the first day, counts down for a while after its big day and
 * then closes. Everything here works on a local calendar day as a
 * `YYYY-MM-DD` key, never a time, so a class in the evening is never pushed
 * into tomorrow by a time zone and a clock change never skips or repeats a
 * day.
 *
 * Pure: the caller says what day it is (`today.svelte.ts`) and which
 * Scene's calendar to use (`scenes/halloween/calendar.ts`,
 * `scenes/christmas/calendar.ts`).
 */

export interface LimitedCalendar {
  /** The first day the Scene is open. */
  opens: string;
  /** The big day (Halloween, Christmas): the last day before the countdown. */
  peak: string;
  /** The last day the Scene is open. It is gone the day after. */
  lastDay: string;
}

export type LimitedPhase = "hidden" | "open" | "countdown" | "closed";

/** A date's local calendar day, as `YYYY-MM-DD`. */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True for a well-formed `YYYY-MM-DD` that is a real date. */
export function isDay(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [y, m, d] = text.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Whole days from one calendar day to another. */
export function daysBetween(from: string, to: string): number {
  const utc = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

export function phase(cal: LimitedCalendar, day: string | null): LimitedPhase {
  if (day === null || day < cal.opens) return "hidden";
  if (day <= cal.peak) return "open";
  if (day <= cal.lastDay) return "countdown";
  return "closed";
}

/** Whether the Scene is on offer at all. Unknown days (prerendering) are not. */
export function isOpen(cal: LimitedCalendar, day: string | null): boolean {
  const now = phase(cal, day);
  return now === "open" || now === "countdown";
}

/** Days the Scene has left, counting today: 1 on its last day. */
export function daysLeft(cal: LimitedCalendar, day: string): number {
  return daysBetween(day, cal.lastDay) + 1;
}
