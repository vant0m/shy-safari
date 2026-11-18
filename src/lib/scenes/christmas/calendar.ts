/**
 * The Christmas chalet's calendar: an Advent calendar. The chalet opens on
 * 1 December with four Commons out, gains one Newcomer every school day up
 * to the last day of term (Friday 18 December 2026), when Father Christmas
 * himself comes and lights the tree. After Christmas it counts down until
 * the first full week of January, then closes. The rules are shared by every
 * limited-time Scene (`scenes/limited/calendar.ts`); this file is the
 * chalet's dates and Creatures.
 *
 * Bringing it back another year is a matter of the dates below.
 */

import type { LimitedCalendar } from "../limited/calendar";

/** The first day of Advent: the chalet opens with four Commons out. */
export const OPENS = "2026-12-01";
/** Christmas Day: the last day before the countdown. */
export const CHRISTMAS = "2026-12-25";
/** The last day the chalet is open. It is gone the day after. */
export const LAST_DAY = "2027-01-08";

/** Out from the first day. Commons, and not Newcomers. */
export const OPENING = ["european-robin", "snowman", "gingerbread", "candle"];

/**
 * One Newcomer every school day from the second day of Advent, each a
 * little more exciting than the last: Common decorations first, then elves,
 * reindeer and Mrs Claus, then the Rares, ending with Father Christmas on
 * the last day of term.
 */
export const NEWCOMERS: { day: string; slug: string }[] = [
  { day: "2026-12-02", slug: "candy-cane" },
  { day: "2026-12-03", slug: "bauble" },
  { day: "2026-12-04", slug: "cracker" },
  { day: "2026-12-07", slug: "stocking" },
  { day: "2026-12-08", slug: "elf-gift" },
  { day: "2026-12-09", slug: "reindeer-comet" },
  { day: "2026-12-10", slug: "elf-list" },
  { day: "2026-12-11", slug: "reindeer-cupid" },
  { day: "2026-12-14", slug: "mrs-claus" },
  { day: "2026-12-15", slug: "reindeer-blitzen" },
  { day: "2026-12-16", slug: "sleigh" },
  { day: "2026-12-17", slug: "rudolph" },
  { day: "2026-12-18", slug: "santa" },
];

export const CHRISTMAS_CALENDAR: LimitedCalendar = {
  opens: OPENS,
  peak: CHRISTMAS,
  lastDay: LAST_DAY,
  opening: OPENING,
  newcomers: NEWCOMERS,
};
