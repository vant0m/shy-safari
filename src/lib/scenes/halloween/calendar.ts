/**
 * Pumpkin Hollow's calendar: a limited-time Scene that opens with seven
 * animals, gains one Newcomer every school day until Halloween, counts down
 * for a week after it and then closes. The rules are shared by every
 * limited-time Scene (`scenes/limited/calendar.ts`); this file is the
 * Hollow's dates and Creatures.
 *
 * Bringing the Hollow back another year is a matter of the dates below.
 */

import {
  daysLeft as limitedDaysLeft,
  isOpen as limitedIsOpen,
  newcomersSoFar as limitedNewcomersSoFar,
  phase,
  todaysNewcomer as limitedTodaysNewcomer,
  unlockDay as limitedUnlockDay,
  unlockedSlugs as limitedUnlockedSlugs,
  type LimitedCalendar,
  type LimitedPhase,
} from "../limited/calendar";

export { isDay, localDay, untilUnlock, weekday } from "../limited/calendar";

/** The first day the Hollow is open, with the opening seven out. */
export const OPENS = "2026-10-18";
/** Halloween itself: the last day before the countdown. */
export const HALLOWEEN = "2026-10-31";
/** The last day the Hollow is open. It is gone the day after. */
export const LAST_DAY = "2026-11-07";

/** Out from the first day. Commons, and not Newcomers. */
export const OPENING_SEVEN = [
  "harvest-mouse",
  "garden-spider",
  "toad",
  "brown-bat",
  "crow",
  "barn-owl",
  "black-cat",
];

/**
 * One Newcomer every school day up to Halloween, in the order they come.
 * Halloween is a Saturday in 2026, so the finale is the Friday before it.
 */
export const NEWCOMERS: { day: string; slug: string }[] = [
  { day: "2026-10-19", slug: "little-ghost" },
  { day: "2026-10-20", slug: "cloudy-moon" },
  { day: "2026-10-21", slug: "gourdling" },
  { day: "2026-10-22", slug: "scarecrow" },
  { day: "2026-10-23", slug: "mummy" },
  { day: "2026-10-26", slug: "vampire" },
  { day: "2026-10-27", slug: "gargoyle" },
  { day: "2026-10-28", slug: "howling-wolf" },
  { day: "2026-10-29", slug: "great-boo" },
  { day: "2026-10-30", slug: "jack-o-lantern" },
];

export const HALLOWEEN_CALENDAR: LimitedCalendar = {
  opens: OPENS,
  peak: HALLOWEEN,
  lastDay: LAST_DAY,
  opening: OPENING_SEVEN,
  newcomers: NEWCOMERS,
};

export type HollowPhase = LimitedPhase;

export const hollowPhase = (day: string | null) =>
  phase(HALLOWEEN_CALENDAR, day);
export const isOpen = (day: string | null) =>
  limitedIsOpen(HALLOWEEN_CALENDAR, day);
export const unlockedSlugs = (day: string | null) =>
  limitedUnlockedSlugs(HALLOWEEN_CALENDAR, day);
export const newcomersSoFar = (day: string | null) =>
  limitedNewcomersSoFar(HALLOWEEN_CALENDAR, day);
export const todaysNewcomer = (day: string | null) =>
  limitedTodaysNewcomer(HALLOWEEN_CALENDAR, day);
export const unlockDay = (slug: string) =>
  limitedUnlockDay(HALLOWEEN_CALENDAR, slug);
export const daysLeft = (day: string) =>
  limitedDaysLeft(HALLOWEEN_CALENDAR, day);
