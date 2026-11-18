/**
 * When a limited-time Scene is open, and what it has unlocked so far
 * (docs/adr/0009-a-limited-time-scene.md).
 *
 * A limited-time Scene opens with a few Creatures, gains one Newcomer every
 * school day up to its big day, counts down for a while after it and then
 * closes. Everything here works on a local calendar day as a `YYYY-MM-DD`
 * key, never a time, so a class in the evening is never pushed into tomorrow
 * by a time zone and a clock change never skips or repeats a day.
 *
 * Pure: the caller says what day it is (`today.svelte.ts`) and which
 * Scene's calendar to use (`scenes/halloween/calendar.ts`,
 * `scenes/christmas/calendar.ts`).
 */

export interface LimitedCalendar {
  /** The first day the Scene is open, with the opening Creatures out. */
  opens: string;
  /** The big day (Halloween, Christmas): the last day before the countdown. */
  peak: string;
  /** The last day the Scene is open. It is gone the day after. */
  lastDay: string;
  /** Out from the first day; not Newcomers. */
  opening: string[];
  /** One Newcomer per school day, in the order they come. */
  newcomers: { day: string; slug: string }[];
}

export type LimitedPhase = "hidden" | "unlocking" | "countdown" | "closed";

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
  if (day <= cal.peak) return "unlocking";
  if (day <= cal.lastDay) return "countdown";
  return "closed";
}

/** Whether the Scene is on offer at all. Unknown days (prerendering) are not. */
export function isOpen(cal: LimitedCalendar, day: string | null): boolean {
  const now = phase(cal, day);
  return now === "unlocking" || now === "countdown";
}

/** Every slug unlocked by this day: the opening ones, then the Newcomers so far. */
export function unlockedSlugs(
  cal: LimitedCalendar,
  day: string | null,
): string[] {
  if (phase(cal, day) === "hidden") return [];
  return [
    ...cal.opening,
    ...cal.newcomers
      .filter((newcomer) => newcomer.day <= day!)
      .map(({ slug }) => slug),
  ];
}

/** The Newcomers unlocked by this day, newest first. */
export function newcomersSoFar(
  cal: LimitedCalendar,
  day: string | null,
): string[] {
  if (phase(cal, day) === "hidden") return [];
  return cal.newcomers
    .filter((newcomer) => newcomer.day <= day!)
    .map(({ slug }) => slug)
    .reverse();
}

/** The Newcomer that unlocks on this very day, if one does. */
export function todaysNewcomer(
  cal: LimitedCalendar,
  day: string | null,
): string | null {
  return cal.newcomers.find((newcomer) => newcomer.day === day)?.slug ?? null;
}

/** The day a Newcomer unlocks, or null for the opening Creatures. */
export function unlockDay(cal: LimitedCalendar, slug: string): string | null {
  return cal.newcomers.find((newcomer) => newcomer.slug === slug)?.day ?? null;
}

/**
 * How long until a Newcomer unlocks, at midnight at the start of its day:
 * whole days while it is two or more away, and the seconds left on the day
 * before. The seconds go by this computer's clock and time zone, as `now`
 * gives them, so moving the clock or the time zone moves the countdown.
 */
export function untilUnlock(
  unlocks: string,
  day: string,
  now: Date,
): { days: number } | { seconds: number } {
  const days = daysBetween(day, unlocks);
  if (days > 1) return { days };
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  // Rounded up, so it reads 00:00:01 until the day turns, never 00:00:00.
  const seconds = Math.ceil((midnight.getTime() - now.getTime()) / 1_000);
  return { seconds: Math.max(0, seconds) };
}

/** Days the Scene has left, counting today: 1 on its last day. */
export function daysLeft(cal: LimitedCalendar, day: string): number {
  return daysBetween(day, cal.lastDay) + 1;
}

/** Which day of the week a calendar day falls on, 0 for Sunday. */
export function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
